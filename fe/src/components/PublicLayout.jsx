import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';

export default function PublicLayout({ children, auth, onLogout, theme, onToggleTheme }) {
  const userForMenu = auth?.user
    ? {
        name: auth.displayName || auth.user?.name || auth.email || 'User',
        email: auth.email || auth.user?.email || '',
        avatarUrl: auth.user?.avatarUrl || auth.user?.avatar || null,
        role: auth.role || auth.user?.role || 'user',
      }
    : null;

  return (
    <div className="page-container">
      <div className="navbar">
        <div className="navbar-brand">
          <a className="brand-logo" href="#home">IW</a>
          <div>
            <h3 style={{ margin: 0 }}>Inkwell</h3>
          </div>
        </div>

        <div className="navbar-links home-nav-links">
          <button
            type="button"
            className={`theme-switch ${theme}`}
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-switch__track">
              <span className="theme-switch__thumb" />
            </span>
          </button>

          <a href="#contact">Contact</a>
          <a href="#about">About</a>
          <a href="#plans">Become a Member</a>

          {userForMenu ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NotificationBell />
              <UserMenu user={userForMenu} onLogout={onLogout} />
            </div>
          ) : (
            <>
              <a className="btn btn-outline btn-sm" href="#auth">Log In</a>
              <a className="btn btn-primary btn-sm" href="#auth">Sign Up</a>
            </>
          )}
        </div>
      </div>

      {children}

      <div className="footer-card card" style={{ gridColumn: '1 / -1' }}>
        <div className="footer-grid">
          <div>
            <h4>Inkwell</h4>
            <p className="small-text">
              The AI-first platform for modern writers, editors and communities.
            </p>
          </div>

          <div>
            <h4>Discover</h4>
            <a href="#home">Blog</a>
            <a href="#plans">Pricing</a>
            <a href="#contact">Partners</a>
          </div>

          <div>
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#contact">Careers</a>
            <a href="#contact">Legal</a>
          </div>

          <div>
            <h4>Support</h4>
            <a href="#contact">Help Center</a>
            <a href="#contact">Contact</a>
            <a href="#home">Community</a>
          </div>
        </div>

        <div className="footer-note">
          © 2026 Inkwell. Designed for premium multi-author publishing experiences.
        </div>
      </div>
    </div>
  );
}