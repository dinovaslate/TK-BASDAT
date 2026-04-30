import { ArrowRightLeft, BadgeDollarSign, CircleDollarSign, FileSearch, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import { useAppContext } from '../../context/AppContext';
import { formatNumber, getTierProgress } from '../../utils/formatters';

export default function MemberDashboardPage() {
  const { state } = useAppContext();
  const progress = getTierProgress(state.currentMember, state.masterData.tiers);

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
          {state.recentActivity.map((item) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}
