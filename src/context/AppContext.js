import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createInitialState } from '../data/mockData';

const STORAGE_KEY = 'aeromiles-demo-state-v1';

const AppContext = createContext(null);

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createActivity = ({ title, meta, amount, date = new Date().toISOString().slice(0, 10) }) => ({
  id: createId('activity'),
  title,
  meta,
  amount,
  date,
});

const prependActivity = (items, activity) => [activity, ...items].slice(0, 8);

const syncCurrentMember = (state, updates) => {
  const currentMember = { ...state.currentMember, ...updates };
  const members = state.members.map((member) =>
    member.memberNumber === currentMember.memberNumber ? { ...member, ...currentMember } : member
  );

  return { currentMember, members };
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        session: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        session: null,
      };

    case 'SUBMIT_CLAIM':
      return {
        ...state,
        claims: [action.payload, ...state.claims],
      };

    case 'PURCHASE_MILES': {
      const synced = syncCurrentMember(state, {
        awardMiles: state.currentMember.awardMiles + action.payload.amount,
      });

      return {
        ...state,
        ...synced,
        purchases: [action.payload.purchase, ...state.purchases],
        recentActivity: prependActivity(state.recentActivity, action.payload.activity),
      };
    }

    case 'TRANSFER_MILES': {
      const synced = syncCurrentMember(state, {
        awardMiles: state.currentMember.awardMiles - action.payload.amount,
      });

      return {
        ...state,
        ...synced,
        transfers: [action.payload.transfer, ...state.transfers],
        recentActivity: prependActivity(state.recentActivity, action.payload.activity),
      };
    }

    case 'REDEEM_REWARD': {
      const synced = syncCurrentMember(state, {
        awardMiles: state.currentMember.awardMiles - action.payload.reward.milesCost,
      });

      return {
        ...state,
        ...synced,
        redemptions: [action.payload.redemption, ...state.redemptions],
        recentActivity: prependActivity(state.recentActivity, action.payload.activity),
      };
    }

    case 'SAVE_IDENTITY': {
      const identities = state.identities.some((identity) => identity.id === action.payload.id)
        ? state.identities.map((identity) => (identity.id === action.payload.id ? action.payload : identity))
        : [action.payload, ...state.identities];

      return {
        ...state,
        identities,
      };
    }

    case 'DELETE_IDENTITY':
      return {
        ...state,
        identities: state.identities.filter((identity) => identity.id !== action.payload),
      };

    case 'SAVE_MEMBER': {
      const exists = state.members.some((member) => member.id === action.payload.id);
      const members = exists
        ? state.members.map((member) => (member.id === action.payload.id ? action.payload : member))
        : [action.payload, ...state.members];

      if (action.payload.memberNumber === state.currentMember.memberNumber) {
        return {
          ...state,
          members,
          currentMember: { ...state.currentMember, ...action.payload },
        };
      }

      return {
        ...state,
        members,
      };
    }

    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter((member) => member.id !== action.payload),
      };

    case 'SAVE_STAFF': {
      const exists = state.staff.some((person) => person.id === action.payload.id);
      const staff = exists
        ? state.staff.map((person) => (person.id === action.payload.id ? action.payload : person))
        : [action.payload, ...state.staff];

      return {
        ...state,
        staff,
      };
    }

    case 'DELETE_STAFF':
      return {
        ...state,
        staff: state.staff.filter((person) => person.id !== action.payload),
      };

    case 'REVIEW_CLAIM': {
      const claims = state.claims.map((claim) =>
        claim.id === action.payload.claimId
          ? { ...claim, status: action.payload.status, reviewerNote: action.payload.note || '' }
          : claim
      );

      if (action.payload.status === 'Approved') {
        const claim = state.claims.find((item) => item.id === action.payload.claimId);
        if (claim && claim.memberNumber === state.currentMember.memberNumber) {
          const synced = syncCurrentMember(state, {
            awardMiles: state.currentMember.awardMiles + Number(claim.requestedMiles || 0),
          });
          return {
            ...state,
            ...synced,
            claims,
            recentActivity: prependActivity(
              state.recentActivity,
              createActivity({
                title: `Claim ${claim.id} approved`,
                meta: `${claim.airline} ${claim.flightNumber}`,
                amount: `+${claim.requestedMiles} miles`,
              })
            ),
          };
        }
      }

      return {
        ...state,
        claims,
      };
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

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const removeToast = useCallback((toastId) => {
    setToasts((items) => items.filter((toast) => toast.id !== toastId));
  }, []);

  const notify = useCallback(({ type = 'success', title, message }) => {
    const toast = {
      id: createId('toast'),
      type,
      title,
      message,
    };

    setToasts((items) => [toast, ...items].slice(0, 4));
    window.setTimeout(() => removeToast(toast.id), 4000);
  }, [removeToast]);

  const value = useMemo(
    () => ({
      state,
      toasts,
      removeToast,
      notify,
      login: (payload) => dispatch({ type: 'LOGIN', payload }),
      logout: () => dispatch({ type: 'LOGOUT' }),
      resetState: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      },
      submitClaim: (values) => {
        const claim = {
          id: `CLM-${Math.floor(100000 + Math.random() * 900000)}`,
          memberNumber: state.currentMember.memberNumber,
          memberName: `${state.currentMember.firstName} ${state.currentMember.lastName}`,
          status: 'Pending Review',
          requestedMiles: 1800,
          submittedAt: new Date().toISOString().slice(0, 10),
          ...values,
        };
        dispatch({ type: 'SUBMIT_CLAIM', payload: claim });
        return claim;
      },
      purchaseMiles: (pkg) => {
        const purchase = {
          id: createId('PUR'),
          memberNumber: state.currentMember.memberNumber,
          packageId: pkg.id,
          packageLabel: pkg.label,
          amount: pkg.amount,
          price: pkg.price,
          status: 'Settled',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const activity = createActivity({
          title: 'Purchased Award Miles',
          meta: pkg.label,
          amount: `+${pkg.amount.toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'PURCHASE_MILES',
          payload: { amount: pkg.amount, purchase, activity },
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
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const activity = createActivity({
          title: 'Transfer completed',
          meta: `To ${transfer.toMemberNumber}`,
          amount: `-${Number(amount).toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'TRANSFER_MILES',
          payload: { amount: Number(amount), transfer, activity },
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
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const activity = createActivity({
          title: 'Reward redeemed',
          meta: reward.title,
          amount: `-${reward.milesCost.toLocaleString('en-US')} miles`,
        });
        dispatch({
          type: 'REDEEM_REWARD',
          payload: { reward, redemption, activity },
        });
        return redemption;
      },
      saveIdentity: (values) => {
        const payload = values.id ? values : { ...values, id: createId('identity') };
        dispatch({ type: 'SAVE_IDENTITY', payload });
        return payload;
      },
      deleteIdentity: (id) => dispatch({ type: 'DELETE_IDENTITY', payload: id }),
      saveMember: (values) => {
        const payload = values.id ? values : { ...values, id: createId('member') };
        dispatch({ type: 'SAVE_MEMBER', payload });
        return payload;
      },
      deleteMember: (id) => dispatch({ type: 'DELETE_MEMBER', payload: id }),
      saveStaff: (values) => {
        const payload = values.id ? values : { ...values, id: createId('staff') };
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
