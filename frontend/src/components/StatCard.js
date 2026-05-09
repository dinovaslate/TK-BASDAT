export default function StatCard({ label, value, meta, icon, accent = 'default', testId }) {
  return (
    <article className={`stat-card stat-card-${accent}`} data-testid={testId}>
      <div className="stat-card-head">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      {meta ? <span className="stat-meta">{meta}</span> : null}
    </article>
  );
}
