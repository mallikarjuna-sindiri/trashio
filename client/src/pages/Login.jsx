import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { parseJwt } from '../utils/jwt';

export default function Login() {
  const nav = useNavigate();
  const { loginWithToken, setRoleHint } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', role: 'citizen' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roleHint = useMemo(() => {
    const r = params.get('role');
    if (r === 'admin' || r === 'cleaner' || r === 'citizen') return r;
    return null;
  }, [params]);

  useEffect(() => {
    if (roleHint) {
      setForm((s) => ({ ...s, role: roleHint }));
      setRoleHint(roleHint);
    }
  }, [roleHint, setRoleHint]);

  const role = form.role || roleHint || 'citizen';
  const heading = role === 'admin' ? 'Admin Login' : role === 'cleaner' ? 'Cleaner Login' : 'Citizen Login';
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'cleaner' ? 'Cleaner' : 'Citizen';
  const roleImage = role === 'admin' ? '/canvas.png' : role === 'cleaner' ? '/trash.png' : '/citizen.webp';
  const roleDesc =
    role === 'admin'
      ? 'Supervisors who verify reports, assign cleaners, and track city-wide performance.'
      : role === 'cleaner'
        ? 'Field workers who clean reported locations and upload proof of completion.'
        : 'Residents who report garbage spots to keep neighborhoods clean and safe.';

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);

    try {
      const token = await loginUser(form);
      loginWithToken(token.access_token);

      const decoded = parseJwt(token.access_token);
      const role = decoded?.role;
      if (role === 'admin') nav('/admin');
      else if (role === 'cleaner') nav('/cleaner');
      else nav('/citizen');
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page auth-page-login">
      <div className="container auth-shell">
        <section className={`auth-hero role-${role}`}>
          <div className="auth-hero-inner">
            <span className="role-pill">{roleLabel} Portal</span>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-desc">{roleDesc}</p>
            <div className="role-figure" aria-hidden="true">
              <img src={roleImage} alt={`${roleLabel} illustration`} />
            </div>
            <div className="auth-metrics">
              <div className="metric">
                <div className="metric-value">24/7</div>
                <div className="metric-label">Live updates</div>
              </div>
              <div className="metric">
                <div className="metric-value">Fast</div>
                <div className="metric-label">Secure sign-in</div>
              </div>
              <div className="metric">
                <div className="metric-value">Smart</div>
                <div className="metric-label">Role-based access</div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form card">
          <div className="auth-form-head">
            <h2>{heading}</h2>
            <p className="muted">Sign in to continue to your dashboard.</p>
          </div>
          <form onSubmit={onSubmit}>
            <label>
              Type of user
              <select
                value={form.role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setForm((s) => ({ ...s, role: nextRole }));
                  setRoleHint(nextRole);
                }}
              >
                <option value="citizen">Citizen</option>
                <option value="cleaner">Cleaner</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
            </label>
            <label>
              Password
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  required
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            {err && <div className="error">{err}</div>}
            <button className="btn primary" disabled={busy} type="submit">
              {busy ? 'Signing in...' : 'Login'}
            </button>
            <div className="muted">
              New here? <Link to={role ? `/register?role=${role}` : '/register'}>Create account</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
