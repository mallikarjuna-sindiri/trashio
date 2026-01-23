import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { getMyReports } from '../api/reports';
import ReportCard from '../components/ReportCard';

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const apiOrigin = useMemo(() => API_BASE_URL.replace(/\/api\/?$/, ''), []);

  async function load() {
    setErr('');
    setLoading(true);
    try {
      const data = await getMyReports();
      setReports(data);
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <div className="row space">
        <h2>My Reports</h2>
        <button className="btn" onClick={load} type="button">Refresh</button>
      </div>

      {loading && <div className="muted">Loading...</div>}
      {err && <div className="error">{err}</div>}

      <div className="stack">
        {reports.map((r) => (
          <ReportCard key={r._id} report={r} apiOrigin={apiOrigin} />
        ))}
      </div>
    </div>
  );
}
