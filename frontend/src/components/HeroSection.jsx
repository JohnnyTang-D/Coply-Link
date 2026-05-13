export function HeroSection({ eyebrow, title, children }) {
  return (
    <section className="hero glass-panel">
      <div className="hero-copy">
        <span className="hero-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}