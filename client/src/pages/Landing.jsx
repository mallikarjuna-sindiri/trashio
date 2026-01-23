import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import CitizenDashboard from './CitizenDashboard';
import AdminDashboard from './AdminDashboard';
import CleanerDashboard from './CleanerDashboard';

export default function Landing() {
  const { user, setRoleHint } = useAuth();

  function hint(role) {
    return () => setRoleHint(role);
  }

  return (
    <div className="landing-page">
      <div className="container">
        <div className="hero landing-hero">
          <div className="landing-frame">
            <div className="landing-top">
              <div className="landing-title-wrap">
                <span className="landing-kicker">TRASHIO</span>
                <h1 className="landing-title">Make your surroundings cleaner</h1>
              </div>
            </div>

            {!user ? (
              <div className="role-grid" role="list">
                <div className="role-card role-citizen" role="listitem">
                  <div className="role-label">Citizen</div>
                  <div className="role-icon-wrap">
                    <svg className="role-icon" viewBox="0 0 64 64" aria-hidden="true">
                      <circle cx="32" cy="20" r="10" />
                      <path d="M14 54c0-10 8-18 18-18h0c10 0 18 8 18 18" />
                      <path d="M12 48c6 0 10-6 10-12" />
                      <path d="M52 48c-6 0-10-6-10-12" />
                    </svg>
                  </div>
                  <div className="role-meta">
                    <div className="role-meta-title">Description:</div>
                    <ul className="role-meta-list">
                      <li>Report garbage with location and photos.</li>
                      <li>Track status updates in real time.</li>
                      <li>Earn rewards for clean-up impact.</li>
                    </ul>
                  </div>
                  <div className="role-actions">
                    <Link className="btn primary" to="/register?role=citizen" onClick={hint('citizen')}>Register</Link>
                  </div>
                </div>

                <div className="role-card role-admin" role="listitem">
                  <div className="role-label">Admin</div>
                  <div className="role-icon-wrap">
                    <svg className="role-icon" viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M32 8l18 6v14c0 12-7 22-18 28-11-6-18-16-18-28V14z" />
                      <path d="M26 32h12" />
                      <path d="M32 26v12" />
                    </svg>
                  </div>
                  <div className="role-meta">
                    <div className="role-meta-title">Description:</div>
                    <ul className="role-meta-list">
                      <li>Verify incoming reports quickly.</li>
                      <li>Assign cleaners and set priorities.</li>
                      <li>Approve proof and close tasks.</li>
                    </ul>
                  </div>
                  <div className="role-actions">
                    <Link className="btn primary" to="/register?role=admin" onClick={hint('admin')}>Register</Link>
                  </div>
                </div>

                <div className="role-card role-cleaner" role="listitem">
                  <div className="role-label">Cleaner</div>
                  <div className="role-icon-wrap">
                    <svg className="role-icon" viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M20 20h18l6 8v18a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6z" />
                      <path d="M26 20v-4a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v4" />
                      <path d="M26 36h12" />
                      <path d="M32 30v12" />
                    </svg>
                  </div>
                  <div className="role-meta">
                    <div className="role-meta-title">Description:</div>
                    <ul className="role-meta-list">
                      <li>View assignments with directions.</li>
                      <li>Navigate to reported locations.</li>
                      <li>Upload after-clean photos.</li>
                    </ul>
                  </div>
                  <div className="role-actions">
                    <Link className="btn primary" to="/register?role=cleaner" onClick={hint('cleaner')}>Register</Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {user.role === 'citizen' && <CitizenDashboard />}
                {user.role === 'admin' && <AdminDashboard />}
                {user.role === 'cleaner' && <CleanerDashboard />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
