import { Activity, BadgeDollarSign, FileCheck2, ShieldCheck, Users, UserSquare2 } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { useAppContext } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';

export default function AdminDashboardPage() {
  const { state } = useAppContext();
  const pendingClaims = state.claims.filter((claim) => claim.status === 'Pending Review').length;
  const activeMembers = state.members.filter((member) => member.status === 'Active').length;
  const activeStaff = state.staff.filter((member) => member.status === 'Active').length;
  const milesIssued = state.purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const rewardsRedeemed = state.redemptions.length;

  return (
    <div className="stack gap-xl" data-testid="admin-dashboard">
      <section className="stat-grid">
        <StatCard label="Total Members" value={formatNumber(state.members.length)} meta="Across all alliance carriers" icon={<Users size={18} />} />
        <StatCard label="Active Members" value={formatNumber(activeMembers)} meta="Eligible for transactions" icon={<ShieldCheck size={18} />} />
        <StatCard label="Total Staff" value={formatNumber(state.staff.length)} meta={`${activeStaff} currently active`} icon={<UserSquare2 size={18} />} />
        <StatCard
          label="Pending Claims"
          value={formatNumber(pendingClaims)}
          meta="Awaiting staff action"
          accent="gold"
          icon={<FileCheck2 size={18} />}
          testId="admin-pending-claims-card"
        />
        <StatCard label="Miles Issued" value={formatNumber(milesIssued)} meta="Purchased via mock checkout" icon={<BadgeDollarSign size={18} />} />
        <StatCard label="Rewards Redeemed" value={formatNumber(rewardsRedeemed)} meta="Completed member redemptions" icon={<Activity size={18} />} />
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Operational queue</div>
              <h2>Immediate focus</h2>
            </div>
          </div>
          <div className="queue-list">
            {state.operationalQueue.map((item) => (
              <div key={item.id} className="queue-card">
                <div className="queue-copy">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <span className="queue-value">{item.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Airline performance</div>
              <h2>Alliance summary</h2>
            </div>
          </div>
          <div className="stack gap-md">
            {state.airlinePerformance.map((airline) => (
              <div key={airline.airline} className="performance-row">
                <div>
                  <strong>{airline.airline}</strong>
                  <span>{airline.claims} recent claims</span>
                </div>
                <div className="performance-values">
                  <span>{airline.onTime} on-time</span>
                  <span>{airline.satisfaction} satisfaction</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
