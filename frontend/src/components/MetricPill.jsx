export function MetricPill({ label, value, tone = 'default' }) {
  return (
    <div className={`metric-pill metric-pill--${tone}`}>
      {label}: <strong>{value}</strong>
    </div>
  );
}