import { ArrowRightLeft, BadgeDollarSign, CircleDollarSign, FileSearch, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatNumber, getTierProgress } from '../../utils/formatters';

export default function MemberDashboardPage() {
  const { state } = useAppContext();
  const progress = getTierProgress(state.currentMember, state.masterData.tiers);
  const memberActivities = state.recentActivity.filter((item) => item.memberNumber === state.currentMember.memberNumber);
  const transactionHistory = [
    ...state.purchases
      .filter((purchase) => purchase.memberNumber === state.currentMember.memberNumber)
      .map((purchase) => ({
        id: purchase.id,
        type: 'Miles Purchase',
        detail: purchase.packageLabel,
        value: `+${formatNumber(purchase.amount)} miles`,
        date: purchase.createdAt,
      })),
    ...state.transfers
      .filter(
        (transfer) =>
          transfer.fromMemberNumber === state.currentMember.memberNumber ||
          transfer.toMemberNumber === state.currentMember.memberNumber
      )
      .map((transfer) => ({
        id: transfer.id,
        type: transfer.fromMemberNumber === state.currentMember.memberNumber ? 'Miles Transfer Out' : 'Miles Transfer In',
        detail:
          transfer.fromMemberNumber === state.currentMember.memberNumber
            ? `To ${transfer.toMemberNumber}`
            : `From ${transfer.fromMemberNumber}`,
        value: `${transfer.fromMemberNumber === state.currentMember.memberNumber ? '-' : '+'}${formatNumber(transfer.amount)} miles`,
        date: transfer.createdAt,
      })),
    ...state.redemptions
      .filter((redemption) => redemption.memberNumber === state.currentMember.memberNumber)
      .map((redemption) => ({
        id: redemption.id,
        type: 'Reward Redemption',
        detail: redemption.rewardTitle,
        value: `-${formatNumber(redemption.milesCost)} miles`,
        date: redemption.createdAt,
      })),
    ...state.claims
      .filter((claim) => claim.memberNumber === state.currentMember.memberNumber)
      .map((claim) => ({
        id: claim.id,
        type: 'Missing Miles Claim',
        detail: `${claim.airline} ${claim.flightNumber}`,
        value: `${claim.status === 'Approved' ? '+' : ''}${formatNumber(claim.requestedMiles)} miles`,
        date: claim.submittedAt,
      })),
  ]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 6);

  const quickLinks = [
    { label: 'Claim Missing Miles', to: '/member/claim', icon: <FileSearch size={16} /> },
    { label: 'Purchase Miles', to: '/member/buy-miles', icon: <BadgeDollarSign size={16} /> },
    { label: 'Transfer Miles', to: '/member/transfer', icon: <ArrowRightLeft size={16} /> },
    { label: 'Browse Rewards', to: '/member/rewards', icon: <Gift size={16} /> },
  ];

  return (
    <div className="stack gap-xl" data-testid="member-dashboard">
      <section className="stat-grid">
        <StatCard
          label="Award Miles"
          value={formatNumber(state.currentMember.awardMiles)}
          meta="Available for redemption"
          accent="gold"
          icon={<CircleDollarSign size={18} />}
          testId="member-award-miles-card"
        />
        <StatCard
          label="Tier Miles"
          value={formatNumber(state.currentMember.tierMiles)}
          meta="Current qualification balance"
          icon={<BadgeDollarSign size={18} />}
        />
        <StatCard label="Current Tier" value={state.currentMember.tier} meta="Alliance standing" icon={<Gift size={18} />} />
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Tier progress</div>
              <h2>{progress.currentTier} to {progress.nextTier}</h2>
            </div>
            <strong>{progress.percent}%</strong>
          </div>
          <div className="progress-track">
            <span className="progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="muted-text">
            {formatNumber(progress.remaining)} Tier Miles remaining to reach {progress.nextTier}.
          </p>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Quick actions</div>
              <h2>Most used tasks</h2>
            </div>
          </div>
          <div className="action-grid">
            {quickLinks.map((link) => (
              <Link key={link.to} className="action-card" to={link.to}>
                <span className="action-icon">{link.icon}</span>
                <strong>{link.label}</strong>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Recent activity</div>
            <h2>Last account movements</h2>
          </div>
        </div>
        <div className="activity-list">
          {memberActivities.length ? (
            memberActivities.map((item) => (
              <div key={item.id} className="activity-row">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </div>
                <div className="activity-values">
                  <strong>{item.amount}</strong>
                  <span>{item.date}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-inline">No recent activity yet for this member account.</div>
          )}
        </div>
      </section>

      <section className="panel" data-testid="member-transaction-history">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Miles history</div>
            <h2>Transaction ledger</h2>
          </div>
        </div>
        <div className="activity-list">
          {transactionHistory.length ? (
            transactionHistory.map((item) => (
              <div key={item.id} className="activity-row">
                <div>
                  <strong>{item.type}</strong>
                  <span>{item.id} · {item.detail}</span>
                </div>
                <div className="activity-values">
                  <strong>{item.value}</strong>
                  <span>{formatDate(item.date)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-inline">No transaction history yet for this member account.</div>
          )}
        </div>
      </section>
    </div>
  );
}
