import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import {
  adminAssignCleaner,
  adminListCleaners,
  adminListReports,
  adminUpdateReportStatus,
  adminDeleteReport,
  adminVerifyCleaning,
  adminVerifyReport,
} from '../api/reports';
import ReportCard from '../components/ReportCard';

export default function AdminDashboard() {
  const [status, setStatus] = useState('');
  const [reports, setReports] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');
  const [statusEdits, setStatusEdits] = useState({});

  const statusOptions = [
    'Pending',
    'Verified',
    'Assigned',
    'Cleaned',
    'Approved',
    'Completed',
    'Rejected',
  ];

  const apiOrigin = useMemo(() => API_BASE_URL.replace(/\/api\/?$/, ''), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
    return () => document.documentElement.removeAttribute('data-theme');
  }, []);

  async function load() {
    setErr('');
    try {
      const data = await adminListReports(status || undefined);
      setReports(data);
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to load reports');
    }
  }

  async function loadCleaners() {
    try {
      const data = await adminListCleaners();
      setCleaners(Array.isArray(data) ? data : []);
    } catch (ex) {
      // Non-fatal: admin can still use the app; assignment UI will show an error.
      setErr(ex?.response?.data?.detail || 'Failed to load cleaners');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    loadCleaners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doAction(reportId, fn) {
    setErr('');
    setBusyId(reportId);
    try {
      await fn();
      await load();
    } catch (ex) {
      const detail = ex?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setErr(detail.map((d) => d?.msg || String(d)).join('\n'));
      } else {
        setErr(detail || 'Action failed');
      }
    } finally {
      setBusyId('');
    }
  }

  async function updateReportStatus(reportId) {
    const selected = statusEdits[reportId];
    if (!selected) {
      setErr('Select a status to update.');
      return;
    }
    setErr('');
    setBusyId(reportId);
    try {
      await adminUpdateReportStatus(reportId, { status: selected });
      await load();
      setStatusEdits((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to update status');
    } finally {
      setBusyId('');
    }
  }

  async function deleteReport(reportId) {
    const ok = window.confirm('Delete this report permanently?');
    if (!ok) return;
    setErr('');
    setBusyId(reportId);
    try {
      await adminDeleteReport(reportId);
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to delete report');
    } finally {
      setBusyId('');
    }
  }


  const statusCounts = useMemo(() => {
    return {
      pending: reports.filter(r => r.status === 'Pending').length,
      verified: reports.filter(r => r.status === 'Verified').length,
      assigned: reports.filter(r => r.status === 'Assigned').length,
      cleaned: reports.filter(r => r.status === 'Cleaned').length,
    };
  }, [reports]);

  const emptyLabel = useMemo(() => {
    switch (status) {
      case 'Pending':
        return 'No Pending Reports';
      case 'Verified':
        return 'No Verified Reports';
      case 'Assigned':
        return 'No Assigned Reports';
      case 'Cleaned':
        return 'No Cleaned Reports';
      case 'Approved':
        return 'No Approved Reports';
      case 'Rejected':
        return 'No Rejected Reports';
      default:
        return 'No Reports Found';
    }
  }, [status]);

  return (
    <div className="dashboard-wrapper admin-theme">
      <div className="container">
        {/* Hero Header */}
        <div className="dashboard-header admin-header">
          <div className="header-content">
            <div className="header-badge admin-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span> ADMIN</span>
            </div>
            <h1 className="dashboard-title">Admin Control Center</h1>
            <p className="dashboard-subtitle">Supervisor managing report verification, cleaner assignments, and system oversight</p>
          </div>
        </div>

        <div className="admin-layout">
          {/* Stats Overview */}
          <div className="admin-side">
            <div className="admin-side-cards">
              <div className="stat-card red-gradient">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-value">{statusCounts.pending}</div>
                  <div className="stat-label">Pending Review</div>
                </div>
              </div>
              <div className="stat-card red-gradient">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <div className="stat-value">{statusCounts.verified}</div>
                  <div className="stat-label">Ready to Assign</div>
                </div>
              </div>
              <div className="stat-card red-gradient">
                <div className="stat-icon">👷</div>
                <div className="stat-content">
                  <div className="stat-value">{statusCounts.assigned}</div>
                  <div className="stat-label">In Progress</div>
                </div>
              </div>
              <div className="stat-card red-gradient">
                <div className="stat-icon">🧹</div>
                <div className="stat-content">
                  <div className="stat-value">{statusCounts.cleaned}</div>
                  <div className="stat-label">Awaiting Approval</div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-main">
            {/* Filter Controls */}
            <div className="admin-controls">
              <div className="control-group">
                <label className="control-label">Filter by Status:</label>
                <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All Reports</option>
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Cleaned">Cleaned</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <button className="btn-admin-refresh" onClick={load} type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Refresh
              </button>
              <Link className="btn-admin-refresh" to="/admin/create-user">
                Create Admin User
              </Link>
            </div>

            {err && <div className="error admin-error">{err}</div>}

            <div className="stack">
              {reports.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-title">{emptyLabel.toUpperCase()}</div>
                  <div className="admin-empty-subtitle">Try a different status or refresh.</div>
                </div>
              ) : (
                reports.map((r) => (
                  <div key={r._id} className="card admin-report-card">
                    <ReportCard report={r} apiOrigin={apiOrigin} />

                    <div className="row wrap" style={{ marginTop: 12 }}>
                      {r.status === 'Pending' && (
                        <>
                          <button
                            className="btn primary"
                            disabled={busyId === r._id}
                            onClick={() => doAction(r._id, () => adminVerifyReport(r._id, { action: 'approve' }))}
                            type="button"
                          >
                            Approve Report
                          </button>
                          <button
                            className="btn danger"
                            disabled={busyId === r._id}
                            onClick={() => doAction(r._id, () => adminVerifyReport(r._id, { action: 'reject', reason: 'Rejected by admin' }))}
                            type="button"
                          >
                            Reject Report
                          </button>
                        </>
                      )}

                      {r.status === 'Verified' && (
                        <AssignCleanerInline
                          cleaners={cleaners}
                          busy={busyId === r._id}
                          onAssign={(cleanerId) => doAction(r._id, () => adminAssignCleaner(r._id, { cleaner_id: cleanerId }))}
                        />
                      )}

                      {r.status === 'Cleaned' && (
                        <>
                          <button
                            className="btn primary"
                            disabled={busyId === r._id}
                            onClick={() => doAction(r._id, () => adminVerifyCleaning(r._id, { action: 'approve' }))}
                            type="button"
                          >
                            Approve Cleaning
                          </button>
                          <button
                            className="btn danger"
                            disabled={busyId === r._id}
                            onClick={() => doAction(r._id, () => adminVerifyCleaning(r._id, { action: 'reject', reason: 'Please re-clean and re-upload proof' }))}
                            type="button"
                          >
                            Reject Cleaning
                          </button>
                        </>
                      )}

                      {r.status === 'Approved' && (
                        <div className="muted">Approved. (Next step: create payments + mark Completed)</div>
                      )}
                    </div>

                    <div className="admin-inline-actions">
                      <label className="admin-inline-label">Edit Status</label>
                      <select
                        value={statusEdits[r._id] ?? r.status}
                        onChange={(e) =>
                          setStatusEdits((prev) => ({ ...prev, [r._id]: e.target.value }))
                        }
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <button
                        className="btn primary"
                        type="button"
                        disabled={busyId === r._id}
                        onClick={() => updateReportStatus(r._id)}
                      >
                        Update
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        disabled={busyId === r._id}
                        onClick={() => deleteReport(r._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
    </div>

    <style>{`
      .admin-theme {
        background: radial-gradient(900px 500px at 10% 0%, rgba(239, 83, 80, 0.18), transparent 60%),
          radial-gradient(900px 500px at 90% 10%, rgba(198, 40, 40, 0.16), transparent 60%),
          #0f1419;
        min-height: auto;
        padding: 20px 0 0;
      }
      
      .admin-header {
        background: linear-gradient(135deg, rgba(239, 83, 80, 0.28) 0%, rgba(198, 40, 40, 0.18) 100%);
        border-color: rgba(239, 83, 80, 0.45);
        margin-top: -2px;
        margin-bottom: 20px;
      }

      .admin-header::before {
        background: radial-gradient(circle, rgba(239, 83, 80, 0.35) 0%, transparent 70%);
      }

      .admin-layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 22px;
        align-items: start;
        margin-bottom: 28px;
      }

      .admin-side {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .admin-side-title {
        font-weight: 800;
        letter-spacing: 0.2px;
      }

      .admin-side-cards {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .admin-side-cards .stat-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
      }

      .admin-side-cards .stat-icon {
        font-size: 1.4rem;
      }

      .admin-side-cards .stat-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .admin-main {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }


      .admin-badge {
        background: rgba(239, 83, 80, 0.28);
        border-color: rgba(239, 83, 80, 0.55);
      }

      .red-gradient {
        border-color: rgba(239, 83, 80, 0.45);
        background: rgba(239, 83, 80, 0.16);
      }

      .red-gradient:hover {
        border-color: rgba(239, 83, 80, 0.7);
        box-shadow: 0 8px 24px rgba(239, 83, 80, 0.28);
      }

      .admin-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 20px;
        background: rgba(239, 83, 80, 0.14);
        border: 1px solid rgba(239, 83, 80, 0.35);
        border-radius: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .control-group {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .control-label {
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
        white-space: nowrap;
      }

      .admin-select {
        flex: 1;
        min-width: 200px;
        padding: 10px 14px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(239, 83, 80, 0.5);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .admin-select:hover {
        border-color: rgba(239, 83, 80, 0.7);
      }

      .admin-select:focus {
        outline: none;
        border-color: rgba(239, 83, 80, 0.8);
        box-shadow: 0 0 0 3px rgba(239, 83, 80, 0.22);
      }

      .btn-admin-refresh {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: rgba(239, 83, 80, 0.3);
        border: 1px solid rgba(239, 83, 80, 0.6);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .btn-admin-refresh:hover {
        background: rgba(239, 83, 80, 0.42);
        border-color: rgba(239, 83, 80, 0.75);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);
      }

      .admin-error {
        background: rgba(239, 83, 80, 0.3);
        border-color: rgba(239, 83, 80, 0.6);
        animation: shake 0.5s ease;
      }

      .admin-report-card {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(239, 83, 80, 0.3);
        transition: all 0.3s ease;
      }

      .admin-report-card:hover {
        border-color: rgba(239, 83, 80, 0.5);
        box-shadow: 0 8px 24px rgba(239, 83, 80, 0.28);
      }

      .admin-inline-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px dashed rgba(239, 83, 80, 0.35);
      }

      .admin-inline-label {
        font-weight: 600;
        opacity: 0.9;
      }

      .admin-inline-actions select {
        min-width: 160px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(239, 83, 80, 0.5);
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.92);
      }

      .admin-empty {
        border: 1px dashed rgba(239, 83, 80, 0.4);
        background: rgba(239, 83, 80, 0.12);
        padding: 28px;
        text-align: center;
        border-radius: 10px;
      }

      .admin-empty-title {
        font-weight: 800;
        letter-spacing: 0.6px;
        margin-bottom: 6px;
      }

      .admin-empty-subtitle {
        opacity: 0.75;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      @media (max-width: 768px) {
        .admin-layout {
          grid-template-columns: 1fr;
        }
        .admin-controls {
          flex-direction: column;
          align-items: stretch;
        }
        .control-group {
          flex-direction: column;
          align-items: stretch;
        }
        .btn-admin-refresh {
          width: 100%;
          justify-content: center;
        }
        .admin-inline-actions {
          flex-direction: column;
          align-items: stretch;
        }
        .admin-inline-actions select,
        .admin-inline-actions .btn {
          width: 100%;
        }
      }
    `}</style>
  </div>
  );
}

function AssignCleanerInline({ onAssign, busy, cleaners = [] }) {
  const [cleanerId, setCleanerId] = useState('');

  const selected = cleaners.find((c) => c?._id === cleanerId);

  return (
    <div className="row wrap">
      <select value={cleanerId} onChange={(e) => setCleanerId(e.target.value)}>
        <option value="">Select cleaner…</option>
        {cleaners.map((c) => (
          <option key={c._id} value={c._id}>
            {c.full_name} ({c.email})
          </option>
        ))}
      </select>
      <button
        className="btn primary"
        disabled={busy || !cleanerId}
        onClick={() => onAssign(cleanerId)}
        type="button"
      >
        Assign
      </button>
      <div className="muted">
        {selected ? `Assign to: ${selected.full_name}` : 'Pick a cleaner to assign this report.'}
      </div>
    </div>
  );
}
