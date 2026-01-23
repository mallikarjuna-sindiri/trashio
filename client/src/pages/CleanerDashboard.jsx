import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { cleanerUploadAfter, getAssignedReports } from '../api/reports';
import ReportCard from '../components/ReportCard';

export default function CleanerDashboard() {
  const [reports, setReports] = useState([]);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');

  const apiOrigin = useMemo(() => API_BASE_URL.replace(/\/api\/?$/, ''), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'cleaner');
    return () => document.documentElement.removeAttribute('data-theme');
  }, []);

  async function load() {
    setErr('');
    try {
      const data = await getAssignedReports();
      setReports(data);
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to load assigned tasks');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(reportId, file) {
    setErr('');
    setBusyId(reportId);
    try {
      await cleanerUploadAfter(reportId, file);
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Upload failed');
    } finally {
      setBusyId('');
    }
  }

  const taskCounts = useMemo(() => {
    return {
      assigned: reports.filter((r) => r.status === 'Assigned').length,
      completed: reports.filter((r) => r.status !== 'Assigned').length,
      total: reports.length,
    };
  }, [reports]);

  return (
    <div className="dashboard-wrapper cleaner-theme">
      <div className="container">
        <div className="dashboard-header cleaner-header">
          <div className="header-content">
            <div className="header-badge cleaner-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7h-9M14 17H5M15 3v18M6 21h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
              </svg>
              <span>  CLEANER</span>
            </div>
            <h1 className="dashboard-title">Field Operations Dashboard</h1>
            <p className="dashboard-subtitle">
              Field worker responsible for cleaning assigned spots and uploading completion proof
            </p>
          </div>
        </div>

        <div className="cleaner-layout">
          <div className="cleaner-side">
            <div className="cleaner-side-cards">
              <div className="stat-card green-gradient">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-value">{taskCounts.total}</div>
                  <div className="stat-label">Total Assigned Tasks</div>
                </div>
              </div>
              <div className="stat-card green-gradient">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{taskCounts.assigned}</div>
                  <div className="stat-label">Active Tasks</div>
                </div>
              </div>
              <div className="stat-card green-gradient">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{taskCounts.completed}</div>
                  <div className="stat-label">Submitted Proofs</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cleaner-main">
            <div className="cleaner-controls">
              <div className="control-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Click task to view location. Upload proof after cleaning.</span>
              </div>
              <button className="btn-cleaner-refresh" onClick={load} type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh Tasks
              </button>
            </div>

            {err && <div className="error cleaner-error">{err}</div>}

            {reports.length === 0 && !err && (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3 className="empty-title">All Clear!</h3>
                <p className="empty-text">No tasks assigned at the moment. Great work!</p>
              </div>
            )}

            <div className="stack">
              {reports.map((r) => (
                <div key={r._id} className="card cleaner-task-card">
                  <ReportCard report={r} apiOrigin={apiOrigin} />
                  <div className="row wrap" style={{ marginTop: 12 }}>
                    <a
                      className="btn"
                      href={`https://www.google.com/maps?q=${r.location?.lat},${r.location?.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Maps
                    </a>

                    {r.status === 'Assigned' && (
                      <label className="btn filebtn">
                        Upload After Proof
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) upload(r._id, f);
                          }}
                          disabled={busyId === r._id}
                        />
                      </label>
                    )}

                    {r.status !== 'Assigned' && <div className="muted">Status: {r.status}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .cleaner-theme {
            background: linear-gradient(135deg, rgba(46, 125, 50, 0.03) 0%, rgba(27, 94, 32, 0.05) 100%);
            min-height: auto;
            padding: 20px 0 0;
          }

          .cleaner-header {
            background: linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(27, 94, 32, 0.08) 100%);
            border-color: rgba(46, 125, 50, 0.2);
            margin-bottom: 32px;
          }

          .cleaner-header::before {
            background: radial-gradient(circle, rgba(46, 125, 50, 0.15) 0%, transparent 70%);
          }

          .cleaner-badge {
            background: rgba(46, 125, 50, 0.25);
            border-color: rgba(46, 125, 50, 0.4);
            margin-bottom: 12px;
          }

          .cleaner-layout {
            display: grid;
            grid-template-columns: 280px minmax(0, 1fr);
            gap: 22px;
            align-items: start;
            margin-bottom: 28px;
          }

          .cleaner-side {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .cleaner-side-cards {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .cleaner-side-cards .stat-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
          }

          .cleaner-side-cards .stat-icon {
            font-size: 1.4rem;
          }

          .cleaner-side-cards .stat-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .cleaner-main {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .green-gradient {
            border-color: rgba(46, 125, 50, 0.2);
            background: rgba(46, 125, 50, 0.08);
          }

          .green-gradient:hover {
            border-color: rgba(46, 125, 50, 0.4);
            box-shadow: 0 8px 24px rgba(46, 125, 50, 0.2);
          }

          .cleaner-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 20px;
            background: rgba(46, 125, 50, 0.08);
            border: 1px solid rgba(46, 125, 50, 0.2);
            border-radius: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .control-info {
            display: flex;
            align-items: center;
            gap: 10px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.95rem;
          }

          .btn-cleaner-refresh {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: rgba(46, 125, 50, 0.2);
            border: 1px solid rgba(46, 125, 50, 0.4);
            border-radius: 10px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-cleaner-refresh:hover {
            background: rgba(46, 125, 50, 0.3);
            border-color: rgba(46, 125, 50, 0.6);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
          }

          .cleaner-error {
            background: rgba(211, 47, 47, 0.2);
            border-color: rgba(211, 47, 47, 0.5);
          }

          .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(46, 125, 50, 0.15);
            border-radius: 20px;
            margin: 40px 0;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }

          .empty-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: rgba(255, 255, 255, 0.9);
            margin-top: -5px;
            margin-bottom: 32px;
          }

          .empty-text {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.65);
          }

          .cleaner-task-card {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(46, 125, 50, 0.15);
            transition: all 0.3s ease;
            position: relative;
          }

          .cleaner-task-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, rgba(46, 125, 50, 0.8), rgba(27, 94, 32, 0.8));
            border-radius: 14px 0 0 14px;
          }

          .cleaner-task-card:hover {
            border-color: rgba(46, 125, 50, 0.3);
            box-shadow: 0 8px 24px rgba(46, 125, 50, 0.15);
            transform: translateX(4px);
          }

          @media (max-width: 768px) {
            .cleaner-layout {
              grid-template-columns: 1fr;
            }
            .cleaner-controls {
              flex-direction: column;
              align-items: stretch;
            }
            .control-info {
              text-align: center;
              justify-content: center;
              margin-bottom: 2px;
            }
            .btn-cleaner-refresh {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
