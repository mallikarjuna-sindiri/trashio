import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReport } from '../api/reports';

export default function ReportGarbage() {
  const nav = useNavigate();
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => {
        // user denied or unavailable -> manual entry
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!file) {
      setErr('Please upload a before image.');
      return;
    }
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      setErr('Please provide a valid latitude and longitude.');
      return;
    }

    setBusy(true);
    try {
      await createReport({ description, lat: latNum, lng: lngNum, beforeFile: file });
      nav('/my-reports');
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to submit report');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container narrow">
      <h2>Report Garbage</h2>
      <form className="card" onSubmit={onSubmit}>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>

        <div className="row">
          <label style={{ flex: 1 }}>
            Latitude
            <input value={lat} onChange={(e) => setLat(e.target.value)} required />
          </label>
          <label style={{ flex: 1 }}>
            Longitude
            <input value={lng} onChange={(e) => setLng(e.target.value)} required />
          </label>
        </div>

        <label>
          Before Photo (camera only)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>

        {err && <div className="error">{err}</div>}
        <button className="btn primary" disabled={busy} type="submit">
          {busy ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
