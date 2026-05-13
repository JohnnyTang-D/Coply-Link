export function StatusCard({ title, description, actionLabel, onAction, tone = 'default' }) {
  return (
    <section className={`status-card glass-panel status-card--${tone}`}>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="secondary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}