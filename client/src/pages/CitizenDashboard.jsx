import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useEffect } from 'react';

export default function CitizenDashboard() {
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'citizen');
    return () => document.documentElement.removeAttribute('data-theme');
  }, []);

  return (
    <div className="dashboard-wrapper citizen-theme">
      <div className="container">
        {/* Hero Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>CITIZEN</span>
            </div>
            <h1 className="dashboard-title">Welcome back{user?.full_name ? `, ${user.full_name}` : ''}!</h1>
            <p className="dashboard-subtitle">Community member reporting garbage spots to make our surroundings cleaner</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card blue-gradient">
            <div className="stat-icon">🗑️</div>
            <div className="stat-content">
              <div className="stat-value">Create Report</div>
              <div className="stat-label">Share location + photo</div>
            </div>
          </div>
          <div className="stat-card blue-gradient">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">Track Progress</div>
              <div className="stat-label">Monitor your reports</div>
            </div>
          </div>
          <div className="stat-card blue-gradient">
            <div className="stat-icon">🎁</div>
            <div className="stat-content">
              <div className="stat-value">Earn Rewards</div>
              <div className="stat-label">Get incentives</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="action-grid">
          <Link to="/report" className="action-card blue-card">
            <div className="action-icon-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="action-content">
              <h3 className="action-title">Report Garbage</h3>
              <p className="action-description">Capture photo of garbage spot, add location details, and submit your report to help clean our community.</p>
              <div className="action-link">
                Create New Report
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/my-reports" className="action-card blue-card">
            <div className="action-icon-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="action-content">
              <h3 className="action-title">My Reports</h3>
              <p className="action-description">View all your submitted reports, track their status from pending to completed, and see before/after photos.</p>
              <div className="action-link">
                View All Reports
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/rewards" className="action-card blue-card">
            <div className="action-icon-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7"/>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
              </svg>
            </div>
            <div className="action-content">
              <h3 className="action-title">Rewards</h3>
              <p className="action-description">Check your earned rewards and incentives for valid reports. Every contribution matters for a cleaner environment!</p>
              <div className="action-link">
                View Rewards
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        .citizen-theme {
          background: linear-gradient(135deg, rgba(25, 118, 210, 0.03) 0%, rgba(13, 71, 161, 0.05) 100%);
          min-height: auto;
          padding: 20px 0 0;
        }
        
        .dashboard-header {
          margin-bottom: 32px;
          padding: 32px;
          background: linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.08) 100%);
          border: 1px solid rgba(25, 118, 210, 0.2);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }

        .dashboard-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(25, 118, 210, 0.15) 0%, transparent 70%);
          border-radius: 50%;
        }

        .header-content {
          position: relative;
          z-index: 1;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(25, 118, 210, 0.25);
          border: 1px solid rgba(25, 118, 210, 0.4);
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 16px;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 900;
          margin: 0 0 12px 0;
          background: linear-gradient(135deg, #ffffff 0%, rgba(25, 118, 210, 1) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
          max-width: 600px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(25, 118, 210, 0.2);
          background: rgba(25, 118, 210, 0.08);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(25, 118, 210, 0.4);
          box-shadow: 0 8px 24px rgba(25, 118, 210, 0.2);
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .action-card {
          padding: 28px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(25, 118, 210, 0.2);
          border-radius: 20px;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, rgba(25, 118, 210, 0.8), rgba(13, 71, 161, 0.8));
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .action-card:hover::before {
          transform: scaleX(1);
        }

        .action-card:hover {
          transform: translateY(-4px);
          border-color: rgba(25, 118, 210, 0.5);
          background: rgba(25, 118, 210, 0.1);
          box-shadow: 0 12px 32px rgba(25, 118, 210, 0.25);
        }

        .action-icon-wrapper {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, rgba(25, 118, 210, 0.25), rgba(13, 71, 161, 0.25));
          border: 2px solid rgba(25, 118, 210, 0.3);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(25, 118, 210, 1);
        }

        .action-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: rgba(255, 255, 255, 0.95);
        }

        .action-description {
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 16px 0;
        }

        .action-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: rgba(25, 118, 210, 1);
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 1.8rem;
          }
          .action-grid {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
