import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createInitialState } from '../data/mockData';

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
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Unable to load AeroMiles demo state.', error);
  }

  return createInitialState();
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
        awardMiles: Number(member.awardMiles) + action.payload.amount,
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
        awardMiles: Number(sender.awardMiles) - action.payload.amount,
      });

      const recipient = nextState.members.find(
        (member) => member.memberNumber.toUpperCase() === action.payload.transfer.toMemberNumber.toUpperCase()
      );

      if (recipient) {
        nextState = syncMemberState(nextState, {
          ...recipient,
          awardMiles: Number(recipient.awardMiles) + action.payload.amount,
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
        awardMiles: Number(member.awardMiles) - action.payload.reward.milesCost,
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
            awardMiles: Number(targetMember.awardMiles) + Number(existingClaim.requestedMiles || 0),
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
      signIn: ({ role, email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();
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
      registerMember: (values) => {
        const member = {
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

        dispatch({ type: 'REGISTER_MEMBER', payload: member });
        return member;
      },
      registerStaff: (values) => {
        const person = {
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
          airline: values.airline,
          role: values.role.trim(),
          status: 'Active',
          password: values.password,
          workspace: 'Alliance Operations Center',
          alertDigest: 'Daily',
          escalationAlerts: true,
        };

        dispatch({ type: 'REGISTER_STAFF', payload: person });
        return person;
      },
      saveClaim: (values) => {
        const existingClaim = values.id ? state.claims.find((claim) => claim.id === values.id) : null;
        const formValues = {
          airline: values.airline,
          flightNumber: values.flightNumber,
          flightDate: values.flightDate,
          origin: values.origin,
          destination: values.destination,
          cabinClass: values.cabinClass,
          ticketNumber: values.ticketNumber,
          pnr: values.pnr,
          notes: values.notes,
        };
        const claim = {
          id: existingClaim?.id || `CLM-${Math.floor(100000 + Math.random() * 900000)}`,
          memberNumber: state.currentMember.memberNumber,
          memberName: getDisplayName(state.currentMember),
          status: 'Pending Review',
          requestedMiles: existingClaim?.requestedMiles || estimateClaimMiles(values),
          submittedAt: today(),
          reviewerNote: '',
          ...formValues,
        };

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
      purchaseMiles: (pkg) => {
        const purchase = {
          id: createId('PUR'),
          memberNumber: state.currentMember.memberNumber,
          packageId: pkg.id,
          packageLabel: pkg.label,
          amount: pkg.amount,
          price: pkg.price,
          status: 'Settled',
          createdAt: today(),
        };
        const activity = createActivity({
          memberNumber: state.currentMember.memberNumber,
          title: 'Purchased Award Miles',
          meta: pkg.label,
          amount: `+${pkg.amount.toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'PURCHASE_MILES',
          payload: { memberId: state.currentMember.id, amount: pkg.amount, purchase, activity },
        });
        return purchase;
      },
      transferMiles: ({ recipientMemberNumber, amount, note }) => {
        const transfer = {
          id: createId('TRF'),
          fromMemberNumber: state.currentMember.memberNumber,
          toMemberNumber: recipientMemberNumber.trim().toUpperCase(),
          amount: Number(amount),
          note,
          status: 'Completed',
          createdAt: today(),
        };
        const activity = createActivity({
          memberNumber: state.currentMember.memberNumber,
          title: 'Transfer completed',
          meta: `To ${transfer.toMemberNumber}`,
          amount: `-${Number(amount).toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'TRANSFER_MILES',
          payload: { memberId: state.currentMember.id, amount: Number(amount), transfer, activity },
        });
        return transfer;
      },
      redeemReward: (reward) => {
        const redemption = {
          id: createId('RED'),
          memberNumber: state.currentMember.memberNumber,
          rewardId: reward.id,
          rewardTitle: reward.title,
          milesCost: reward.milesCost,
          status: 'Issued',
          createdAt: today(),
        };
        const activity = createActivity({
          memberNumber: state.currentMember.memberNumber,
          title: 'Reward redeemed',
          meta: reward.title,
          amount: `-${reward.milesCost.toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'REDEEM_REWARD',
          payload: { memberId: state.currentMember.id, reward, redemption, activity },
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
      reviewClaim: ({ claimId, status, note }) => dispatch({ type: 'REVIEW_CLAIM', payload: { claimId, status, note } }),
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
