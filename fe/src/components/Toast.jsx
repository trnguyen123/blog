import { useEffect, useState } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {type === 'success' && <span className="toast-icon">✓</span>}
        {type === 'error' && <span className="toast-icon">✕</span>}
        {type === 'info' && <span className="toast-icon">ℹ</span>}
        <span className="toast-message">{message}</span>
      </div>
      <button 
        className="toast-close" 
        onClick={() => setIsVisible(false)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
