import { BadgeDollarSign, CircleDollarSign, Gift } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { useAppContext } from '../../context/AppContext';
import { formatNumber, getTierProgress } from '../../utils/formatters';

export default function MemberDashboardPage() {
  const { state } = useAppContext();
  const progress = getTierProgress(state.currentMember, state.masterData.tiers);

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
              <div className="eyebrow">Membership snapshot</div>
              <h2>Program standing</h2>
            </div>
          </div>
          <div className="stack gap-md">
            <div className="activity-row">
              <div>
                <strong>Join date</strong>
                <span>Member since</span>
              </div>
              <div className="activity-values">
                <strong>{state.currentMember.joinDate}</strong>
              </div>
            </div>
            <div className="activity-row">
              <div>
                <strong>Primary airline</strong>
                <span>Alliance home carrier</span>
              </div>
              <div className="activity-values">
                <strong>Ozi Skies</strong>
              </div>
            </div>
            <div className="activity-row">
              <div>
                <strong>Status</strong>
                <span>Account eligibility</span>
              </div>
              <div className="activity-values">
                <strong>{state.currentMember.status}</strong>
              </div>
            </div>
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
