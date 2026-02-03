import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setDone(true);
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Unable to send reset email');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container auth-shell">
        <section className="auth-hero">
          <div className="auth-hero-inner">
            <span className="role-pill">Password Help</span>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-desc">
              Enter your account email and we will send you a secure reset link.
            </p>
          </div>
        </section>

        <section className="auth-form card">
          <div className="auth-form-head">
            <h2>Forgot password</h2>
            <p className="muted">Check your inbox after submitting.</p>
          </div>
          <form onSubmit={onSubmit}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {err && <div className="error">{err}</div>}
            {done && <div className="success">Reset link sent if the email exists.</div>}
            <button className="btn primary" disabled={busy} type="submit">
              {busy ? 'Sending...' : 'Send reset link'}
            </button>
            <div className="muted">
              Remembered your password? <Link to="/login">Back to login</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
