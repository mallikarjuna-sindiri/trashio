import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState(() => localStorage.getItem('trashio_theme_mode') || 'dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const baseUrl = import.meta.env.BASE_URL || '/';

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    localStorage.setItem('trashio_theme_mode', mode);
  }, [mode]);

  function toggleMode() {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={`nav${menuOpen ? ' nav-open' : ''}`}>
      <div className="nav-inner container">
        <Link className="brand brand-logo" to="/">
          <img className="brand-img" src={`${baseUrl}image.png`} alt="Trashio" />
          <span className="brand-text">Trashio</span>
          <span className="brand-dot" aria-hidden="true" />
        </Link>
        <nav className="links nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>

          {!user && (
            <div className="nav-auth">
              <NavLink to="/login">Login</NavLink>
              <NavLink className="nav-signup" to="/register">Sign Up</NavLink>
            </div>
          )}

          {user?.role === 'citizen' && (
            <>
              <NavLink to="/report">Report Garbage</NavLink>
              <NavLink to="/my-reports">My Reports</NavLink>
              <NavLink to="/rewards">Rewards</NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin">Admin</NavLink>
              <NavLink to="/admin/create-user">Create Admin</NavLink>
            </>
          )}

          {user?.role === 'cleaner' && (
            <NavLink to="/cleaner">Cleaner</NavLink>
          )}
        </nav>

        {!user && (
          <NavLink className="btn nav-mobile-login" to="/login">
            Login
          </NavLink>
        )}

        <div className="nav-theme-mobile">
          <button
            className={`btn theme-toggle ${mode}`}
            onClick={toggleMode}
            type="button"
            aria-label="Toggle theme"
            aria-pressed={mode === 'light'}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-icon theme-toggle-sun">☀️</span>
              <span className="theme-toggle-icon theme-toggle-moon">🌙</span>
              <span className="theme-toggle-thumb" />
            </span>
            <span className="theme-toggle-label">{mode === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        <button
          className="btn nav-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <img className="nav-toggle-icon" src={`${baseUrl}menu.png`} alt="" aria-hidden="true" />
        </button>

        <div className="nav-actions">
          <button
            className={`btn theme-toggle ${mode}`}
            onClick={toggleMode}
            type="button"
            aria-label="Toggle theme"
            aria-pressed={mode === 'light'}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-icon theme-toggle-sun">☀️</span>
              <span className="theme-toggle-icon theme-toggle-moon">🌙</span>
              <span className="theme-toggle-thumb" />
            </span>
            <span className="theme-toggle-label">{mode === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
          {user && (
            <button className="btn" onClick={logout} type="button">
              Logout
            </button>
          )}
        </div>

        <nav className="links nav-mobile-menu">
          {!user && (
            <div className="nav-mobile-grid">
              <NavLink to="/" onClick={closeMenu}>Home</NavLink>
              <NavLink to="/about" onClick={closeMenu}>About</NavLink>
              <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
              <NavLink className="nav-signup" to="/register" onClick={closeMenu}>Sign Up</NavLink>
            </div>
          )}

          {user?.role === 'citizen' && (
            <>
              <NavLink to="/report" onClick={closeMenu}>Report Garbage</NavLink>
              <NavLink to="/my-reports" onClick={closeMenu}>My Reports</NavLink>
              <NavLink to="/rewards" onClick={closeMenu}>Rewards</NavLink>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>
              <NavLink to="/admin/create-user" onClick={closeMenu}>Create Admin</NavLink>
            </>
          )}

          {user?.role === 'cleaner' && (
            <NavLink to="/cleaner" onClick={closeMenu}>Cleaner</NavLink>
          )}

          <div className="nav-mobile-actions">
            {user && (
              <button
                className="btn"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                type="button"
              >
                Logout
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
