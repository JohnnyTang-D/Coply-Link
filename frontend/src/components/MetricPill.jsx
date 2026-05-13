export function MetricPill({ label, value, tone = 'default' }) {
  return (
    <div className={`metric-pill metric-pill--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}