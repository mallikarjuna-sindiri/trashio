import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuth } from '../auth/AuthContext';

export default function Register() {
  const nav = useNavigate();
  const { setRoleHint } = useAuth();
  const [params] = useSearchParams();
  const roleHint = useMemo(() => {
    const r = params.get('role');
    if (r === 'admin' || r === 'cleaner' || r === 'citizen') return r;
    return null;
  }, [params]);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    pincodeDigits: Array(6).fill(''),
    password: '',
    confirm_password: '',
    role: 'citizen',
  });
  const pinRefs = useRef([]);
  const role = form.role || roleHint || 'citizen';
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'cleaner' ? 'Cleaner' : 'Citizen';
  const roleImage = role === 'admin' ? '/canvas.png' : role === 'cleaner' ? '/trash.png' : '/citizen.webp';
  const roleDesc =
    role === 'admin'
      ? 'Supervisors who verify reports, assign cleaners, and manage city-wide progress.'
      : role === 'cleaner'
        ? 'Field workers who clean reported locations and submit proof of completion.'
        : 'Residents who report garbage spots to keep neighborhoods clean and safe.';
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function update(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
    if (k === 'role') setRoleHint(v);
  }

  function setPincodeDigit(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setForm((s) => {
      const next = [...s.pincodeDigits];
      next[index] = digit;
      return { ...s, pincodeDigits: next };
    });
    if (digit && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  }

  function handlePincodeKeyDown(index, event) {
    if (event.key === 'Backspace' && !form.pincodeDigits[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  }

  function handlePincodePaste(event) {
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    event.preventDefault();
    setForm((s) => {
      const next = Array(6).fill('');
      text.split('').forEach((digit, idx) => {
        next[idx] = digit;
      });
      return { ...s, pincodeDigits: next };
    });
    const lastIndex = Math.min(text.length, 6) - 1;
    if (lastIndex >= 0) {
      pinRefs.current[lastIndex]?.focus();
    }
  }

  useEffect(() => {
    if (!roleHint) return;
    setForm((s) => ({ ...s, role: roleHint }));
    setRoleHint(roleHint);
  }, [roleHint, setRoleHint]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');

    if (role === 'cleaner') {
      if (!form.address.trim()) {
        setErr('Address is required for cleaners.');
        return;
      }
      const pin = form.pincodeDigits.join('');
      if (pin.length !== 6) {
        setErr('Pincode must be 6 digits for cleaners.');
        return;
      }
    }

    if (form.password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirm_password: form.confirm_password,
        role: form.role,
        ...(role === 'cleaner'
          ? {
              address: form.address,
              pincode: form.pincodeDigits.join(''),
            }
          : {}),
      };

      await registerUser(payload);
      nav('/login');
    } catch (ex) {
      const detail = ex?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setErr(detail.map((d) => d.msg).join(', '));
      } else {
        setErr(detail || 'Registration failed');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container auth-shell">
        <section className={`auth-hero role-${role}`}>
          <div className="auth-hero-inner">
            <span className="role-pill">{roleLabel} Registration</span>
            <h1 className="auth-title">Join the clean city mission</h1>
            <p className="auth-desc">{roleDesc}</p>
            <div className="role-figure" aria-hidden="true">
              <img src={roleImage} alt={`${roleLabel} illustration`} />
            </div>
            <div className="auth-metrics">
              <div className="metric">
                <div className="metric-value">Instant</div>
                <div className="metric-label">Report tracking</div>
              </div>
              <div className="metric">
                <div className="metric-value">Secure</div>
                <div className="metric-label">Protected access</div>
              </div>
              <div className="metric">
                <div className="metric-value">Community</div>
                <div className="metric-label">Impact rewards</div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form card">
          <div className="auth-form-head">
            <h2>Create account</h2>
            <p className="muted">Start with a {roleLabel.toLowerCase()} profile and help your community.</p>
          </div>
          {role === 'admin' && (
            <div className="notice" role="status">
              Admin registration is managed internally. Please contact
              <a href="mailto:trashio2025@gmail.com"> trashio2025@gmail.com</a> to request access.
            </div>
          )}
          <form onSubmit={onSubmit} className="auth-form-grid">
            <label className="span-2">
              Type of user
              <select value={form.role} onChange={(e) => update('role', e.target.value)}>
                <option value="citizen">Citizen</option>
                <option value="cleaner">Cleaner</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="span-2">
              User name
              <input
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                required
                disabled={role === 'admin'}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                disabled={role === 'admin'}
              />
            </label>
            <label>
              Phone no
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                required
                disabled={role === 'admin'}
              />
            </label>
            {role === 'cleaner' && (
              <>
                <label className="span-2">
                  Address
                  <input value={form.address} onChange={(e) => update('address', e.target.value)} required />
                </label>
                <label className="span-2">
                  Pincode
                  <div className="pin-inputs" onPaste={handlePincodePaste}>
                    {form.pincodeDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          pinRefs.current[index] = el;
                        }}
                        className="pin-input"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => setPincodeDigit(index, e.target.value)}
                        onKeyDown={(e) => handlePincodeKeyDown(index, e)}
                        aria-label={`Pincode digit ${index + 1}`}
                        required
                      />
                    ))}
                  </div>
                </label>
              </>
            )}
            <label className="span-2">
              Password
              <div className="input-eye">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  disabled={role === 'admin'}
                />
              </div>
            </label>
            <label className="span-2">
              Confirm password
              <div className="input-eye">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => update('confirm_password', e.target.value)}
                  required
                  disabled={role === 'admin'}
                />
              </div>
            </label>
            <div className="pass-togg">
              <label className="span-2 show-password-toggle">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={role === 'admin'}
                />
                Show password
              </label>
            </div>

            {err && <div className="error span-2">{err}</div>}

            <button className="btn primary span-2" disabled={busy || role === 'admin'} type="submit">
              {role === 'admin' ? 'Admin registration disabled' : busy ? 'Creating...' : 'Register'}
            </button>
            <div className="muted span-2">
              Already have an account? <Link to={roleHint ? `/login?role=${roleHint}` : '/login'}>Login</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
