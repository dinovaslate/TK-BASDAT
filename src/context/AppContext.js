import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createInitialState } from '../data/mockData';
import { apiRequest, checkBackend } from '../services/api';

const STORAGE_KEY = 'aeromiles-demo-state-v2';

const AppContext = createContext(null);

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const getDisplayName = (person) => [person.firstName, person.lastName].map((item) => String(item || '').trim()).filter(Boolean).join(' ');

const today = () => new Date().toISOString().slice(0, 10);

const createActivity = ({ memberNumber, title, meta, amount, date = today() }) => ({
  id: createId('activity'),
  memberNumber,
  title,
  meta,
  amount,
  date,
});

const prependActivity = (items, activity) => [activity, ...items].slice(0, 12);

const upsertItem = (items, nextItem, prependNew = false) => {
  const exists = items.some((item) => item.id === nextItem.id);
  if (exists) {
    return items.map((item) => (item.id === nextItem.id ? nextItem : item));
  }
  return prependNew ? [nextItem, ...items] : [...items, nextItem];
};

const syncMemberState = (state, member, prependNew = false) => {
  const members = upsertItem(state.members, member, prependNew);
  const isActiveMember = state.session?.role === 'member' && state.session.userId === member.id;

  return {
    ...state,
    members,
    currentMember: state.currentMember?.id === member.id || isActiveMember ? member : state.currentMember,
    session: isActiveMember
      ? { ...state.session, name: getDisplayName(member), email: member.email }
      : state.session,
  };
};

const syncStaffState = (state, person, prependNew = false) => {
  const staff = upsertItem(state.staff, person, prependNew);
  const isActiveStaff = state.session?.role === 'staff' && state.session.userId === person.id;

  return {
    ...state,
    staff,
    currentStaff: state.currentStaff?.id === person.id || isActiveStaff ? person : state.currentStaff,
    session: isActiveStaff
      ? { ...state.session, name: getDisplayName(person), email: person.email }
      : state.session,
  };
};

const getInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...JSON.parse(stored), backendConnected: false };
    }
  } catch (error) {
    console.error('Unable to load AeroMiles demo state.', error);
  }

  return { ...createInitialState(), backendConnected: false };
};

const estimateClaimMiles = (values) => {
  const base = {
    Economy: 900,
    'Premium Economy': 1200,
    Business: 1800,
    First: 2600,
  };

  return base[values.cabinClass] || 1000;
};

const dateOnly = (value) => String(value || today()).slice(0, 10);

const backendStatusToUi = (status) => {
  const map = {
    Menunggu: 'Pending Review',
    Disetujui: 'Approved',
    Ditolak: 'Rejected',
  };
  return map[status] || status || 'Pending Review';
};

const findAirlineByCode = (airlines, codeOrName) =>
  airlines.find(
    (airline) =>
      String(airline.code || '').toUpperCase() === String(codeOrName || '').toUpperCase() ||
      String(airline.name || '').toLowerCase() === String(codeOrName || '').toLowerCase()
  );

const mapBackendMember = (row) => ({
  id: row.email,
  salutation: row.salutation || '',
  firstName: row.first_mid_name || '',
  middleName: '',
  lastName: row.last_name || '',
  email: row.email,
  countryCode: row.country_code || '',
  mobileNumber: row.mobile_number || '',
  dateOfBirth: row.tanggal_lahir || '',
  nationality: row.kewarganegaraan || '',
  memberNumber: row.nomor_member,
  joinDate: row.tanggal_bergabung || '',
  tier: row.nama_tier || row.id_tier || '',
  awardMiles: Number(row.award_miles || 0),
  tierMiles: Number(row.total_miles || 0),
  totalMiles: Number(row.total_miles || 0),
  status: 'Active',
  password: '',
});

const mapBackendStaff = (row) => ({
  id: row.email,
  staffId: row.id_staf,
  salutation: row.salutation || '',
  firstName: row.first_mid_name || '',
  middleName: '',
  lastName: row.last_name || '',
  email: row.email,
  airline: row.nama_maskapai || row.kode_maskapai || '',
  airlineCode: row.kode_maskapai || '',
  role: 'Staff',
  status: 'Active',
  password: '',
});

const mapBackendClaim = (row, airlines = []) => {
  const airline = findAirlineByCode(airlines, row.maskapai);
  return {
    id: row.id,
    memberNumber: row.nomor_member || row.email_member,
    memberName: row.nama_member || row.email_member,
    airline: airline?.name || row.nama_maskapai || row.maskapai,
    airlineCode: row.maskapai,
    flightNumber: row.flight_number,
    flightDate: row.tanggal_penerbangan,
    origin: row.bandara_asal,
    destination: row.bandara_tujuan,
    cabinClass: row.kelas_kabin,
    ticketNumber: row.nomor_tiket,
    pnr: row.pnr,
    notes: '',
    status: backendStatusToUi(row.status_penerimaan),
    requestedMiles: 1000,
    submittedAt: dateOnly(row.time_stamp),
  };
};

const mapBackendTransfer = (row) => ({
  id: `TRF-${dateOnly(row.time_stamp)}-${row.sender_nomor_member || row.sender_email}-${row.recipient_nomor_member || row.recipient_email}`,
  fromMemberNumber: row.sender_nomor_member || row.sender_email,
  toMemberNumber: row.recipient_nomor_member || row.recipient_email,
  fromEmail: row.sender_email,
  toEmail: row.recipient_email,
  amount: Number(row.jumlah || row.amount || 0),
  note: row.catatan || row.note || '',
  status: 'Completed',
  createdAt: dateOnly(row.time_stamp),
  message: row.message,
});

const mapBackendReward = (row) => ({
  id: row.kode_hadiah,
  title: row.nama_hadiah || row.nama,
  category: 'Reward',
  partner: row.nama_penyedia || 'AeroMiles',
  milesCost: Number(row.miles || 0),
  status: 'Active',
  activeFrom: row.valid_start_date || '',
  activeTo: row.program_end || '',
  description: row.deskripsi || '',
});

const mapBackendPackage = (row) => ({
  id: row.id,
  amount: Number(row.jumlah_award_miles || 0),
  price: Number(row.harga_paket || 0),
  label: `${Number(row.jumlah_award_miles || 0).toLocaleString('en-US')} Award Miles`,
});

const mapBackendPurchase = (row) => ({
  id: `PUR-${dateOnly(row.time_stamp)}-${row.id_award_miles_package}`,
  memberNumber: row.nomor_member || row.email_member,
  packageId: row.id_award_miles_package,
  packageLabel: `${Number(row.jumlah_award_miles || 0).toLocaleString('en-US')} Award Miles`,
  amount: Number(row.jumlah_award_miles || 0),
  price: Number(row.harga_paket || 0),
  status: 'Settled',
  createdAt: dateOnly(row.time_stamp),
});

const mapBackendRedemption = (row) => ({
  id: `RED-${dateOnly(row.time_stamp)}-${row.kode_hadiah}`,
  memberNumber: row.nomor_member || row.email_member,
  rewardId: row.kode_hadiah,
  rewardTitle: row.nama_hadiah,
  milesCost: Number(row.jumlah_miles || 0),
  status: 'Issued',
  createdAt: dateOnly(row.time_stamp),
});

const mapTopMembers = (rows = []) =>
  rows.map((row) => ({
    rank: row.peringkat,
    email: row.email_member,
    name: row.nama_lengkap,
    totalMiles: Number(row.total_miles_member || 0),
  }));

const nextNumericSuffix = (items, field, prefix, fallbackStart) => {
  const maxValue = items.reduce((max, item) => {
    const raw = String(item[field] || '');
    const match = raw.match(/(\d+)$/);
    if (!match) {
      return max;
    }
    return Math.max(max, Number(match[1]));
  }, fallbackStart);

  return `${prefix}${maxValue + 1}`;
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN': {
      if (action.payload.role === 'member') {
        const currentMember = state.members.find((member) => member.id === action.payload.userId) || state.currentMember;
        return {
          ...state,
          session: action.payload,
          currentMember,
        };
      }

      if (action.payload.role === 'staff') {
        const currentStaff = state.staff.find((person) => person.id === action.payload.userId) || state.currentStaff;
        return {
          ...state,
          session: action.payload,
          currentStaff,
        };
      }

      return {
        ...state,
        session: action.payload,
      };
    }

    case 'LOGOUT':
      return {
        ...state,
        session: null,
      };

    case 'SET_BACKEND_CONNECTED':
      return {
        ...state,
        backendConnected: action.payload,
      };

    case 'LOAD_BACKEND_DATA': {
      const members = action.payload.members || state.members;
      const staff = action.payload.staff || state.staff;
      return {
        ...state,
        ...action.payload,
        backendConnected: true,
        members,
        staff,
        currentMember:
          members.find((member) => member.email === state.currentMember?.email) ||
          members.find((member) => member.id === state.session?.userId) ||
          members[0] ||
          state.currentMember,
        currentStaff:
          staff.find((person) => person.email === state.currentStaff?.email) ||
          staff.find((person) => person.id === state.session?.userId) ||
          staff[0] ||
          state.currentStaff,
        masterData: {
          ...state.masterData,
          ...(action.payload.masterData || {}),
        },
        reportData: {
          ...state.reportData,
          ...(action.payload.reportData || {}),
        },
      };
    }

    case 'REGISTER_MEMBER': {
      const session = {
        role: 'member',
        userId: action.payload.id,
        email: action.payload.email,
        name: getDisplayName(action.payload),
      };

      return syncMemberState(
        {
          ...state,
          session,
        },
        action.payload,
        true
      );
    }

    case 'REGISTER_STAFF': {
      const session = {
        role: 'staff',
        userId: action.payload.id,
        email: action.payload.email,
        name: getDisplayName(action.payload),
      };

      return syncStaffState(
        {
          ...state,
          session,
        },
        action.payload,
        true
      );
    }

    case 'SAVE_CLAIM': {
      const claims = upsertItem(state.claims, action.payload.claim, true);
      return {
        ...state,
        claims,
        recentActivity: action.payload.activity ? prependActivity(state.recentActivity, action.payload.activity) : state.recentActivity,
      };
    }

    case 'DELETE_CLAIM':
      return {
        ...state,
        claims: state.claims.filter((claim) => claim.id !== action.payload),
      };

    case 'PURCHASE_MILES': {
      const member = state.members.find((item) => item.id === action.payload.memberId) || state.currentMember;
      let nextState = syncMemberState(state, {
        ...member,
        awardMiles: action.payload.awardMiles ?? Number(member.awardMiles) + action.payload.amount,
        tierMiles: action.payload.totalMiles ?? Number(member.tierMiles || member.totalMiles || 0) + action.payload.amount,
        totalMiles: action.payload.totalMiles ?? Number(member.totalMiles || member.tierMiles || 0) + action.payload.amount,
      });

      nextState = {
        ...nextState,
        purchases: [action.payload.purchase, ...nextState.purchases],
        recentActivity: prependActivity(nextState.recentActivity, action.payload.activity),
      };

      return nextState;
    }

    case 'TRANSFER_MILES': {
      const sender = state.members.find((item) => item.id === action.payload.memberId) || state.currentMember;
      let nextState = syncMemberState(state, {
        ...sender,
        awardMiles: action.payload.senderAwardMiles ?? Number(sender.awardMiles) - action.payload.amount,
      });

      const recipient = nextState.members.find(
        (member) => member.memberNumber.toUpperCase() === action.payload.transfer.toMemberNumber.toUpperCase()
      );

      if (recipient) {
        nextState = syncMemberState(nextState, {
          ...recipient,
          awardMiles: action.payload.recipientAwardMiles ?? Number(recipient.awardMiles) + action.payload.amount,
          tierMiles: action.payload.recipientTotalMiles ?? Number(recipient.tierMiles || recipient.totalMiles || 0) + action.payload.amount,
          totalMiles: action.payload.recipientTotalMiles ?? Number(recipient.totalMiles || recipient.tierMiles || 0) + action.payload.amount,
        });
      }

      return {
        ...nextState,
        transfers: [action.payload.transfer, ...nextState.transfers],
        recentActivity: prependActivity(nextState.recentActivity, action.payload.activity),
      };
    }

    case 'REDEEM_REWARD': {
      const member = state.members.find((item) => item.id === action.payload.memberId) || state.currentMember;
      let nextState = syncMemberState(state, {
        ...member,
        awardMiles: action.payload.awardMiles ?? Number(member.awardMiles) - action.payload.reward.milesCost,
      });

      nextState = {
        ...nextState,
        redemptions: [action.payload.redemption, ...nextState.redemptions],
        recentActivity: prependActivity(nextState.recentActivity, action.payload.activity),
      };

      return nextState;
    }

    case 'SAVE_IDENTITY':
      return {
        ...state,
        identities: upsertItem(state.identities, action.payload, true),
      };

    case 'DELETE_IDENTITY':
      return {
        ...state,
        identities: state.identities.filter((identity) => identity.id !== action.payload),
      };

    case 'SAVE_MEMBER':
      return syncMemberState(state, action.payload, true);

    case 'DELETE_MEMBER': {
      const nextMembers = state.members.filter((member) => member.id !== action.payload);
      const isDeletedSessionUser = state.session?.role === 'member' && state.session.userId === action.payload;
      const nextCurrentMember =
        state.currentMember?.id === action.payload ? nextMembers[0] || state.currentMember : state.currentMember;

      return {
        ...state,
        members: nextMembers,
        currentMember: nextCurrentMember,
        session: isDeletedSessionUser ? null : state.session,
      };
    }

    case 'SAVE_STAFF':
      return syncStaffState(state, action.payload, true);

    case 'DELETE_STAFF': {
      const nextStaff = state.staff.filter((person) => person.id !== action.payload);
      const isDeletedSessionUser = state.session?.role === 'staff' && state.session.userId === action.payload;
      const nextCurrentStaff =
        state.currentStaff?.id === action.payload ? nextStaff[0] || state.currentStaff : state.currentStaff;

      return {
        ...state,
        staff: nextStaff,
        currentStaff: nextCurrentStaff,
        session: isDeletedSessionUser ? null : state.session,
      };
    }

    case 'REVIEW_CLAIM': {
      const existingClaim = state.claims.find((item) => item.id === action.payload.claimId);
      const claims = state.claims.map((claim) =>
        claim.id === action.payload.claimId
          ? { ...claim, status: action.payload.status, reviewerNote: action.payload.note || '' }
          : claim
      );

      let nextState = {
        ...state,
        claims,
      };

      if (action.payload.status === 'Approved' && existingClaim) {
        const targetMember = state.members.find((member) => member.memberNumber === existingClaim.memberNumber);
        if (targetMember) {
          nextState = syncMemberState(nextState, {
            ...targetMember,
            awardMiles: action.payload.awardMiles ?? Number(targetMember.awardMiles) + Number(existingClaim.requestedMiles || 0),
            tierMiles:
              action.payload.totalMiles ??
              Number(targetMember.tierMiles || targetMember.totalMiles || 0) + Number(existingClaim.requestedMiles || 0),
            totalMiles:
              action.payload.totalMiles ??
              Number(targetMember.totalMiles || targetMember.tierMiles || 0) + Number(existingClaim.requestedMiles || 0),
          });
        }

        nextState = {
          ...nextState,
          recentActivity: prependActivity(
            nextState.recentActivity,
            createActivity({
              memberNumber: existingClaim.memberNumber,
              title: `Claim ${existingClaim.id} approved`,
              meta: `${existingClaim.airline} ${existingClaim.flightNumber}`,
              amount: `+${existingClaim.requestedMiles} miles`,
            })
          ),
        };
      }

      return nextState;
    }

    case 'SAVE_MASTER_DATA':
      return {
        ...state,
        masterData: {
          ...state.masterData,
          [action.payload.section]: action.payload.items,
        },
      };

    case 'SAVE_PARTNERS':
      return {
        ...state,
        partners: action.payload,
      };

    case 'SAVE_REWARDS':
      return {
        ...state,
        rewards: action.payload,
      };

    default:
      return state;
  }
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    const loadBackendData = async () => {
      try {
        await checkBackend();
        const [
          members,
          staff,
          claims,
          rewards,
          airports,
          airlines,
          tiers,
          milesPackages,
          transfers,
          redemptions,
          purchases,
          topMembers,
        ] = await Promise.all([
          apiRequest('/members/'),
          apiRequest('/staff/'),
          apiRequest('/claims/'),
          apiRequest('/rewards/'),
          apiRequest('/master-data/airports/'),
          apiRequest('/master-data/airlines/'),
          apiRequest('/master-data/tiers/'),
          apiRequest('/master-data/miles-packages/'),
          apiRequest('/transfers/'),
          apiRequest('/redeems/'),
          apiRequest('/miles-packages/purchases/'),
          apiRequest('/reports/top-members/'),
        ]);

        if (cancelled) {
          return;
        }

        const mappedAirlines = airlines.map((airline) => ({
          id: airline.kode_maskapai,
          code: airline.kode_maskapai,
          name: airline.nama_maskapai,
          status: 'Active',
        }));

        dispatch({
          type: 'LOAD_BACKEND_DATA',
          payload: {
            members: members.map(mapBackendMember),
            staff: staff.map(mapBackendStaff),
            claims: claims.map((claim) => mapBackendClaim(claim, mappedAirlines)),
            rewards: rewards.map(mapBackendReward),
            transfers: transfers.map(mapBackendTransfer),
            redemptions: redemptions.map(mapBackendRedemption),
            purchases: purchases.map(mapBackendPurchase),
            masterData: {
              airlines: mappedAirlines,
              airports: airports.map((airport) => ({
                id: airport.iata_code,
                code: airport.iata_code,
                city: airport.kota || airport.nama,
                country: airport.negara,
              })),
              tiers: tiers.map((tier) => ({
                id: tier.id_tier,
                name: tier.nama,
                threshold: Number(tier.minimal_tier_miles || 0),
                flightFrequency: Number(tier.minimal_frekuensi_terbang || 0),
              })),
              milesPackages: milesPackages.map(mapBackendPackage),
            },
            reportData: {
              topMembers: mapTopMembers(topMembers),
            },
          },
        });
      } catch (error) {
        if (!cancelled) {
          dispatch({ type: 'SET_BACKEND_CONNECTED', payload: false });
        }
      }
    };

    loadBackendData();

    return () => {
      cancelled = true;
    };
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts((items) => items.filter((toast) => toast.id !== toastId));
  }, []);

  const notify = useCallback(
    ({ type = 'success', title, message }) => {
      const toast = {
        id: createId('toast'),
        type,
        title,
        message,
      };

      setToasts((items) => [toast, ...items].slice(0, 4));
      window.setTimeout(() => removeToast(toast.id), 4000);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      state,
      toasts,
      removeToast,
      notify,
      signIn: async ({ role, email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (state.backendConnected) {
          try {
            const loginResult = await apiRequest('/auth/login/', {
              method: 'POST',
              body: { email: normalizedEmail, password },
            });
            const dashboard = await apiRequest(`/dashboard/?email=${encodeURIComponent(normalizedEmail)}`);
            const backendRole = dashboard.role === 'staf' ? 'staff' : dashboard.role;
            const userPayload = loginResult.user || {};
            const displayName = [userPayload.first_mid_name, userPayload.last_name]
              .map((item) => String(item || '').trim())
              .filter(Boolean)
              .join(' ');
            const user =
              backendRole === 'member'
                ? {
                    ...(state.members.find((member) => member.email.toLowerCase() === normalizedEmail) || {}),
                    id: normalizedEmail,
                    email: normalizedEmail,
                    firstName: userPayload.first_mid_name || dashboard.profile?.nama_lengkap || '',
                    lastName: userPayload.last_name || '',
                    memberNumber: userPayload.nomor_member || dashboard.member?.nomor_member,
                    tier: dashboard.member?.tier?.nama || '',
                    awardMiles: Number(dashboard.member?.award_miles || 0),
                    tierMiles: Number(dashboard.member?.total_miles || 0),
                    totalMiles: Number(dashboard.member?.total_miles || 0),
                  }
                : {
                    ...(state.staff.find((person) => person.email.toLowerCase() === normalizedEmail) || {}),
                    id: normalizedEmail,
                    email: normalizedEmail,
                    firstName: userPayload.first_mid_name || dashboard.profile?.nama_lengkap || '',
                    lastName: userPayload.last_name || '',
                    staffId: userPayload.id_staf || dashboard.staf?.id_staf,
                    airline: dashboard.staf?.nama_maskapai || '',
                    airlineCode: dashboard.staf?.kode_maskapai || '',
                  };

            dispatch({ type: backendRole === 'member' ? 'SAVE_MEMBER' : 'SAVE_STAFF', payload: user });
            dispatch({
              type: 'LOGIN',
              payload: {
                role: backendRole,
                userId: user.id,
                email: user.email,
                name: displayName || getDisplayName(user),
              },
            });

            return { error: '', user };
          } catch (error) {
            return { error: error.message };
          }
        }

        const collection = role === 'member' ? state.members : state.staff;
        const user = collection.find((item) => item.email.toLowerCase() === normalizedEmail);

        if (!user || user.password !== password) {
          return { error: 'The email or password is incorrect.' };
        }

        dispatch({
          type: 'LOGIN',
          payload: {
            role,
            userId: user.id,
            email: user.email,
            name: getDisplayName(user),
          },
        });

        return { error: '', user };
      },
      logout: () => dispatch({ type: 'LOGOUT' }),
      resetState: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      },
      registerMember: async (values) => {
        let member = {
          id: createId('member'),
          salutation: values.salutation || '',
          firstName: values.firstName.trim(),
          middleName: values.middleName?.trim() || '',
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          countryCode: values.countryCode?.trim() || '+62',
          mobileNumber: values.mobileNumber?.trim() || '',
          dateOfBirth: values.dateOfBirth,
          nationality: values.nationality.trim(),
          memberNumber: nextNumericSuffix(state.members, 'memberNumber', 'AM-', 100000),
          joinDate: today(),
          tier: 'Blue',
          awardMiles: 0,
          tierMiles: 0,
          status: 'Active',
          password: values.password,
          preferredAirport: 'CGK',
          seatPreference: 'Aisle',
          communicationChannel: 'Email',
          marketingOptIn: true,
        };

        if (state.backendConnected) {
          const response = await apiRequest('/auth/register/member/', {
            method: 'POST',
            body: values,
          });
          member = {
            ...member,
            id: response.member.email,
            email: response.member.email,
            memberNumber: response.member.nomor_member,
            joinDate: response.member.tanggal_bergabung,
            tier: response.member.id_tier,
            awardMiles: Number(response.member.award_miles || 0),
            tierMiles: Number(response.member.total_miles || 0),
            totalMiles: Number(response.member.total_miles || 0),
            message: response.message,
          };
        }

        dispatch({ type: 'REGISTER_MEMBER', payload: member });
        return member;
      },
      registerStaff: async (values) => {
        const selectedAirline = findAirlineByCode(state.masterData.airlines, values.airline);
        let person = {
          id: createId('staff'),
          staffId: nextNumericSuffix(state.staff, 'staffId', 'STF-', 1000),
          salutation: values.salutation || '',
          firstName: values.firstName.trim(),
          middleName: values.middleName?.trim() || '',
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          countryCode: values.countryCode?.trim() || '+62',
          mobileNumber: values.mobileNumber?.trim() || '',
          dateOfBirth: values.dateOfBirth || '',
          nationality: values.nationality?.trim() || '',
          airline: selectedAirline?.name || values.airline,
          airlineCode: selectedAirline?.code || values.airline,
          role: values.role.trim(),
          status: 'Active',
          password: values.password,
          workspace: 'Alliance Operations Center',
          alertDigest: 'Daily',
          escalationAlerts: true,
        };

        if (state.backendConnected) {
          const response = await apiRequest('/auth/register/staff/', {
            method: 'POST',
            body: {
              ...values,
              airlineCode: selectedAirline?.code || values.airline,
            },
          });
          person = {
            ...person,
            id: response.staff.email,
            email: response.staff.email,
            staffId: response.staff.id_staf,
            airlineCode: response.staff.kode_maskapai,
            airline: selectedAirline?.name || response.staff.kode_maskapai,
            message: response.message,
          };
        }

        dispatch({ type: 'REGISTER_STAFF', payload: person });
        return person;
      },
      saveClaim: async (values) => {
        const existingClaim = values.id ? state.claims.find((claim) => claim.id === values.id) : null;
        const selectedAirline = findAirlineByCode(state.masterData.airlines, values.airline);
        const formValues = {
          airline: selectedAirline?.name || values.airline,
          airlineCode: selectedAirline?.code || values.airline,
          flightNumber: values.flightNumber,
          flightDate: values.flightDate,
          origin: values.origin,
          destination: values.destination,
          cabinClass: values.cabinClass,
          ticketNumber: values.ticketNumber,
          pnr: values.pnr,
          notes: values.notes,
        };
        let claim = {
          id: existingClaim?.id || `CLM-${Math.floor(100000 + Math.random() * 900000)}`,
          memberNumber: state.currentMember.memberNumber,
          memberName: getDisplayName(state.currentMember),
          status: 'Pending Review',
          requestedMiles: existingClaim?.requestedMiles || estimateClaimMiles(values),
          submittedAt: today(),
          reviewerNote: '',
          ...formValues,
        };

        if (state.backendConnected) {
          const response = await apiRequest('/claims/', {
            method: 'POST',
            body: {
              ...values,
              email: state.currentMember.email,
              airlineCode: selectedAirline?.code || values.airline,
            },
          });
          claim = {
            ...mapBackendClaim(
              {
                ...response,
                nomor_member: state.currentMember.memberNumber,
                nama_member: getDisplayName(state.currentMember),
              },
              state.masterData.airlines
            ),
            airline: selectedAirline?.name || values.airline,
            message: response.message,
          };
        }

        dispatch({
          type: 'SAVE_CLAIM',
          payload: {
            claim,
            activity: createActivity({
              memberNumber: state.currentMember.memberNumber,
              title: existingClaim ? 'Claim resubmitted' : 'Claim submitted',
              meta: `${claim.airline} ${claim.flightNumber}`,
              amount: `+${claim.requestedMiles} miles pending`,
            }),
          },
        });
        return claim;
      },
      deleteClaim: (id) => dispatch({ type: 'DELETE_CLAIM', payload: id }),
      purchaseMiles: async (pkg) => {
        let purchase = {
          id: createId('PUR'),
          memberNumber: state.currentMember.memberNumber,
          packageId: pkg.id,
          packageLabel: pkg.label,
          amount: pkg.amount,
          price: pkg.price,
          status: 'Settled',
          createdAt: today(),
        };
        let awardMiles;
        let totalMiles;

        if (state.backendConnected) {
          const response = await apiRequest('/miles-packages/purchases/', {
            method: 'POST',
            body: {
              email: state.currentMember.email,
              packageId: pkg.id,
            },
          });
          purchase = {
            ...purchase,
            id: `PUR-${dateOnly(response.time_stamp)}-${response.id_award_miles_package}`,
            packageId: response.id_award_miles_package,
            packageLabel: `${Number(response.jumlah_award_miles || pkg.amount).toLocaleString('en-US')} Award Miles`,
            amount: Number(response.jumlah_award_miles || pkg.amount),
            createdAt: dateOnly(response.time_stamp),
            message: response.message,
          };
          awardMiles = Number(response.award_miles);
          totalMiles = Number(response.total_miles);
        }

        const activity = createActivity({
          memberNumber: state.currentMember.memberNumber,
          title: 'Purchased Award Miles',
          meta: pkg.label,
          amount: `+${pkg.amount.toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'PURCHASE_MILES',
          payload: { memberId: state.currentMember.id, amount: purchase.amount, purchase, activity, awardMiles, totalMiles },
        });
        return purchase;
      },
      transferMiles: async ({ recipientMemberNumber, amount, note }) => {
        if (!state.backendConnected && Number(amount) > Number(state.currentMember.awardMiles)) {
          throw new Error(
            `ERROR: Saldo award miles tidak mencukupi. Saldo Anda saat ini: ${state.currentMember.awardMiles} miles, jumlah transfer: ${Number(amount)} miles.`
          );
        }

        let transfer = {
          id: createId('TRF'),
          fromMemberNumber: state.currentMember.memberNumber,
          toMemberNumber: recipientMemberNumber.trim().toUpperCase(),
          amount: Number(amount),
          note,
          status: 'Completed',
          createdAt: today(),
        };
        let senderAwardMiles;
        let recipientAwardMiles;
        let recipientTotalMiles;

        if (state.backendConnected) {
          const response = await apiRequest('/transfers/', {
            method: 'POST',
            body: {
              email: state.currentMember.email,
              recipientMemberNumber,
              amount: Number(amount),
              note,
            },
          });
          transfer = {
            ...transfer,
            id: `TRF-${dateOnly(response.time_stamp)}-${response.sender_email}-${response.recipient_email}`,
            fromEmail: response.sender_email,
            toEmail: response.recipient_email,
            amount: Number(response.jumlah),
            note: response.catatan,
            createdAt: dateOnly(response.time_stamp),
            message: response.message,
          };
          senderAwardMiles = Number(response.sender_award_miles);
          recipientAwardMiles = Number(response.recipient_award_miles);
          recipientTotalMiles = Number(response.recipient_total_miles);
        } else {
          const recipient = state.members.find(
            (member) => member.memberNumber.toUpperCase() === recipientMemberNumber.trim().toUpperCase()
          );
          transfer.message = `SUKSES: Transfer ${Number(amount)} miles dari "${state.currentMember.email}" ke "${
            recipient?.email || recipientMemberNumber.trim().toUpperCase()
          }" berhasil dicatat.`;
        }

        const activity = createActivity({
          memberNumber: state.currentMember.memberNumber,
          title: 'Transfer completed',
          meta: `To ${transfer.toMemberNumber}`,
          amount: `-${Number(amount).toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'TRANSFER_MILES',
          payload: {
            memberId: state.currentMember.id,
            amount: Number(amount),
            transfer,
            activity,
            senderAwardMiles,
            recipientAwardMiles,
            recipientTotalMiles,
          },
        });
        return transfer;
      },
      redeemReward: async (reward) => {
        if (!state.backendConnected && Number(reward.milesCost) > Number(state.currentMember.awardMiles)) {
          throw new Error(
            `ERROR: Saldo award miles tidak mencukupi. Saldo Anda saat ini: ${state.currentMember.awardMiles} miles, jumlah redeem: ${Number(reward.milesCost)} miles.`
          );
        }

        let redemption = {
          id: createId('RED'),
          memberNumber: state.currentMember.memberNumber,
          rewardId: reward.id,
          rewardTitle: reward.title,
          milesCost: reward.milesCost,
          status: 'Issued',
          createdAt: today(),
        };
        let awardMiles;

        if (state.backendConnected) {
          const response = await apiRequest('/redeems/', {
            method: 'POST',
            body: {
              email: state.currentMember.email,
              rewardId: reward.id,
            },
          });
          redemption = {
            ...redemption,
            id: `RED-${dateOnly(response.time_stamp)}-${response.kode_hadiah}`,
            rewardId: response.kode_hadiah,
            rewardTitle: response.nama_hadiah,
            milesCost: Number(response.jumlah_miles),
            createdAt: dateOnly(response.time_stamp),
            message: response.message,
          };
          awardMiles = Number(response.award_miles);
        }

        const activity = createActivity({
          memberNumber: state.currentMember.memberNumber,
          title: 'Reward redeemed',
          meta: reward.title,
          amount: `-${reward.milesCost.toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'REDEEM_REWARD',
          payload: { memberId: state.currentMember.id, reward, redemption, activity, awardMiles },
        });
        return redemption;
      },
      saveIdentity: (values) => {
        const payload = values.id
          ? { ...values, memberNumber: values.memberNumber || state.currentMember.memberNumber }
          : { ...values, id: createId('identity'), memberNumber: state.currentMember.memberNumber };
        dispatch({ type: 'SAVE_IDENTITY', payload });
        return payload;
      },
      deleteIdentity: (id) => dispatch({ type: 'DELETE_IDENTITY', payload: id }),
      saveMember: (values) => {
        const payload = values.id
          ? values
          : {
              ...values,
              id: createId('member'),
              password: values.password || 'password123',
              preferredAirport: values.preferredAirport || 'CGK',
              seatPreference: values.seatPreference || 'Aisle',
              communicationChannel: values.communicationChannel || 'Email',
              marketingOptIn: values.marketingOptIn ?? true,
            };
        dispatch({ type: 'SAVE_MEMBER', payload });
        return payload;
      },
      deleteMember: (id) => dispatch({ type: 'DELETE_MEMBER', payload: id }),
      saveStaff: (values) => {
        const payload = values.id
          ? values
          : {
              ...values,
              id: createId('staff'),
              password: values.password || 'password123',
              workspace: values.workspace || 'Alliance Operations Center',
              alertDigest: values.alertDigest || 'Daily',
              escalationAlerts: values.escalationAlerts ?? true,
            };
        dispatch({ type: 'SAVE_STAFF', payload });
        return payload;
      },
      deleteStaff: (id) => dispatch({ type: 'DELETE_STAFF', payload: id }),
      reviewClaim: async ({ claimId, status, note }) => {
        let nextStatus = status;
        let awardMiles;
        let totalMiles;
        let message;

        if (state.backendConnected) {
          const response = await apiRequest(`/claims/${encodeURIComponent(claimId)}/review/`, {
            method: 'PATCH',
            body: {
              email: state.currentStaff.email,
              status,
              note,
            },
          });
          nextStatus = backendStatusToUi(response.status_penerimaan);
          awardMiles = Number(response.award_miles);
          totalMiles = Number(response.total_miles);
          message = response.message;
        }

        dispatch({ type: 'REVIEW_CLAIM', payload: { claimId, status: nextStatus, note, awardMiles, totalMiles } });
        return { message, status: nextStatus };
      },
      saveMasterSection: (section, items) => dispatch({ type: 'SAVE_MASTER_DATA', payload: { section, items } }),
      savePartners: (payload) => dispatch({ type: 'SAVE_PARTNERS', payload }),
      saveRewards: (payload) => dispatch({ type: 'SAVE_REWARDS', payload }),
    }),
    [notify, removeToast, state, toasts]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider.');
  }
  return context;
};
