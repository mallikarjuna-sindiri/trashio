import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Footer() {
  const { user } = useAuth();

  const roleLinks = {
    citizen: [
      { label: 'Report Garbage', to: '/report' },
      { label: 'My Reports', to: '/my-reports' },
      { label: 'Rewards', to: '/rewards' },
    ],
    admin: [
      { label: 'Admin Center', to: '/admin' },
    ],
    cleaner: [
      { label: 'Cleaner Tasks', to: '/cleaner' },
    ],
  };

  const quickLinks = user ? roleLinks[user.role] || [] : [];

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-left">
          <div className="site-footer-brand">
            <img className="footer-logo" src="/image.png" alt="Trashio" />
          </div>
          <p className="site-footer-copy">
            Trashio is a smart cleanliness reporting platform that helps citizens raise issues, allows admins to verify
            reports, and empowers cleaners to close tasks quickly. The website provides a simple role-based portal to
            keep neighborhoods clean and safe.
          </p>
          <div className="footer-mobile-row">
            <div className="footer-mobile-left">
              <span>Citizen • Admin • Cleaner</span>
              <a href="mailto:support@trashio.app">support@trashio.app</a>
            </div>
            <div className="footer-mobile-right">
              {user ? (
                <>
                  <Link to="/">Home</Link>
                  {quickLinks.map((item) => (
                    <Link key={item.to} to={item.to}>{item.label}</Link>
                  ))}
                </>
              ) : (
                <>
                  <Link to="/">About</Link>
                  <a href="mailto:support@trashio.app">Support</a>
                  <Link to="/register">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="site-footer-links">
          <div className="site-footer-col">
            <div className="site-footer-title">Explore</div>
            <Link to="/">Home</Link>
            <Link to="/">About</Link>
            <a href="mailto:support@trashio.app">Support</a>
            <a href="mailto:trashio2025@gmail.com">Contact</a>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-title">{user ? 'Quick Links' : 'Portals'}</div>
            {user ? (
              quickLinks.length ? (
                quickLinks.map((item) => (
                  <Link key={item.to} to={item.to}>{item.label}</Link>
                ))
              ) : (
                <Link to="/">Home</Link>
              )
            ) : (
              <>
                <Link to="/login?role=citizen">Citizen Portal</Link>
                <Link to="/login?role=admin">Admin Portal</Link>
                <Link to="/login?role=cleaner">Cleaner Portal</Link>
              </>
            )}
          </div>
          <div className="site-footer-col">
            <div className="site-footer-title">Account</div>
            {user ? <Link to="/">Home</Link> : <Link to="/register">Register</Link>}
          </div>
          <div className="site-footer-col">
            <div className="site-footer-title">Legal</div>
            <a href="/">Privacy Policy</a>
            <a href="/">Terms</a>
            <a href="/">Cookies</a>
          </div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© 2025 Trashio. All rights reserved.</span>
        <span>
          <a href="/">Privacy</a> • <a href="/">Terms</a> • <a href="/">Cookies</a>
        </span>
      </div>
    </footer>
  );
}
