import { useState, useRef, useEffect } from 'react';
import './UserMenu.css';

function getDashboardHref(user) {
  const role = String(user?.role || '').toLowerCase();

  if (role === 'admin' || role === 'super_admin') return '#admin';
  if (role === 'author') return '#author';
  return '#home';
}

export default function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const dashboardHref = getDashboardHref(user);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className={`user-menu-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} />
          ) : (
            <span className="avatar-initials">{initials}</span>
          )}
          <span className="avatar-online-dot" />
        </div>

        <span className="user-name">{user?.name}</span>

        <svg
          className={`chevron ${isOpen ? 'rotated' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M3 5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <span className="avatar-initials">{initials}</span>
              )}
            </div>
            <div>
              <div className="dropdown-name">{user?.name}</div>
              <div className="dropdown-email">{user?.email}</div>
            </div>
          </div>

          <div className="dropdown-divider" />

          <a
            href={dashboardHref}
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <span className="item-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </span>
            Dashboard
          </a>

          <a
            href="#profile"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <span className="item-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3 13c.7-2.1 2.6-3.2 4.5-3.2S11.3 10.9 12 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            My Profile
          </a>

          <div className="dropdown-divider" />

          <button className="dropdown-item logout" onClick={handleLogout}>
            <span className="item-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M5.5 2H3a1 1 0 00-1 1v9a1 1 0 001 1h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M10 10l3-2.5L10 5M13 7.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}