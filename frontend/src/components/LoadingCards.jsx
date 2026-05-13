export function LoadingCards() {
  return (
    <div className="links-grid" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <article key={item} className="link-card glass-panel skeleton-card">
          <div className="skeleton-line skeleton-line--lg" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--sm" />
          <div className="skeleton-footer">
            <div className="skeleton-pill" />
            <div className="skeleton-button" />
          </div>
        </article>
      ))}
    </div>
  );
}