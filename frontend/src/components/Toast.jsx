import { useEffect } from 'react';

export function Toast({ message, tone = 'success', onClose, duration = 1500 }) {
  useEffect(() => {
    if (message && onClose) {
      const timer = window.setTimeout(onClose, duration);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [message, onClose, duration]);

  if (!message) return null;

  const bgColor = tone === 'success' ? 'rgba(72, 185, 120, 0.95)' : 'rgba(255, 107, 107, 0.95)';

  return (
    <div className="copy-toast" style={{ background: bgColor }}>
      {message}
    </div>
  );
}