import { useAppContext } from '../../context/AppContext';
import { formatCurrencyIdr, formatNumber } from '../../utils/formatters';

export default function ReportsPage() {
  const { state } = useAppContext();

  return (
    <div className="stack gap-xl" data-testid="admin-reports-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Member growth chart placeholder</div>
            <h2>Growth by month</h2>
          </div>
        </div>
        <div className="chart-bars">
          {state.reportData.memberGrowth.map((item) => (
            <div key={item.month} className="chart-bar-col">
              <span className="chart-bar" style={{ height: `${item.value}px` }} />
              <strong>{item.month}</strong>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Tier distribution</div>
              <h2>Member mix</h2>
            </div>
          </div>
          <div className="stack gap-md">
            {state.reportData.tierDistribution.map((tier) => (
              <div key={tier.label} className="metric-line">
                <span>{tier.label}</span>
                <strong>{tier.value}%</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Issued vs redeemed</div>
              <h2>Award miles flow</h2>
            </div>
          </div>
          <div className="metric-line">
            <span>Miles issued</span>
            <strong>{formatNumber(state.reportData.milesFlow.issued)}</strong>
          </div>
          <div className="metric-line">
            <span>Miles redeemed</span>
            <strong>{formatNumber(state.reportData.milesFlow.redeemed)}</strong>
          </div>
        </article>
      </section>

      <section className="three-column-grid">
        <article className="panel">
          <div className="eyebrow">Claims approved vs rejected</div>
          <h2>{state.reportData.claimsSummary.approved}% approved</h2>
          <p className="muted-text">{state.reportData.claimsSummary.rejected}% rejected after review.</p>
        </article>
        <article className="panel">
          <div className="eyebrow">Purchase revenue</div>
          <h2>{formatCurrencyIdr(state.reportData.purchaseRevenue.reduce((sum, item) => sum + item.value, 0))}</h2>
          <p className="muted-text">Aggregate mock revenue across the tracked months.</p>
        </article>
        <article className="panel">
          <div className="eyebrow">Top rewards</div>
          <div className="stack gap-sm">
            {state.reportData.topRewards.map((reward) => (
              <div key={reward.label} className="metric-line">
                <span>{reward.label}</span>
                <strong>{reward.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
