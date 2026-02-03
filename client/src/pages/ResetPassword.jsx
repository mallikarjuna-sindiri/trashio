import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');

    if (!token) {
      setErr('Reset token missing. Please use the link from your email.');
      return;
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => nav('/login'), 1200);
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Unable to reset password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container auth-shell">
        <section className="auth-hero">
          <div className="auth-hero-inner">
            <span className="role-pill">Secure Reset</span>
            <h1 className="auth-title">Set a new password</h1>
            <p className="auth-desc">Create a new password to use email login going forward.</p>
          </div>
        </section>

        <section className="auth-form card">
          <div className="auth-form-head">
            <h2>New password</h2>
            <p className="muted">Choose a strong password you can remember.</p>
          </div>
          <form onSubmit={onSubmit}>
            <label>
              New password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <label>
              Confirm password
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </label>
            {err && <div className="error">{err}</div>}
            {done && <div className="success">Password updated. Redirecting to login...</div>}
            <button className="btn primary" disabled={busy} type="submit">
              {busy ? 'Saving...' : 'Update password'}
            </button>
            <div className="muted">
              <Link to="/login">Back to login</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
