import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminCreateUser } from '../api/reports';

export default function AdminCreateUser() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'admin',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pincodeDigits, setPincodeDigits] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
    return () => document.documentElement.removeAttribute('data-theme');
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage('');
    const pincode = pincodeDigits.join('');
    if (pincodeDigits.some((d) => d === '') || pincode.length !== 6) {
      setMessage('Please enter a 6-digit pincode.');
      return;
    }
    if (form.password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await adminCreateUser({ ...form, pincode });
      setMessage('Admin user created successfully.');
      setForm({ full_name: '', email: '', phone: '', address: '', password: '', role: 'admin' });
      setConfirmPassword('');
      setPincodeDigits(['', '', '', '', '', '']);
    } catch (ex) {
      setMessage(ex?.response?.data?.detail || 'Failed to create admin user.');
    } finally {
      setBusy(false);
    }
  }

  function updatePincode(index, value) {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    setPincodeDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
  }

  return (
    <div className="dashboard-wrapper admin-theme">
      <div className="container">
        <div className="admin-create-header">
          <div>
            <div className="admin-create-kicker">ADMIN</div>
            <h1 className="admin-create-title">Create New Admin User</h1>
            <p className="admin-create-subtitle">Add a new admin account for dashboard access.</p>
          </div>
          <Link className="btn admin-create-back" to="/admin">Back to Admin</Link>
        </div>

        <div className="admin-create-card">
          <form className="admin-create-form" onSubmit={onSubmit}>
            <label>
              Username
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                required
              />
            </label>
            <label>
              Pincode
              <div className="admin-pin-grid">
                {pincodeDigits.map((digit, index) => (
                  <input
                    key={index}
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => updatePincode(index, e.target.value)}
                    aria-label={`Pincode digit ${index + 1}`}
                  />
                ))}
              </div>
            </label>
            <label>
              Password
              <div className="admin-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
                <button
                  className="admin-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label>
              Confirm password
              <div className="admin-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </label>
            <button className="btn primary admin-create-submit" type="submit" disabled={busy}>
              {busy ? 'Creating...' : 'Create Admin User'}
            </button>
          </form>
          {message && <div className="admin-create-message">{message}</div>}
        </div>
      </div>

      <style>{`
        .admin-create-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 12px;
          border: 1px solid rgba(239, 83, 80, 0.45);
          background: rgba(239, 83, 80, 0.18);
          margin-bottom: 18px;
        }

        .admin-create-kicker {
          font-weight: 700;
          letter-spacing: 1px;
          opacity: 0.9;
          font-size: 0.85rem;
        }

        .admin-create-title {
          margin: 6px 0 4px;
          font-size: 2rem;
        }

        .admin-create-subtitle {
          margin: 0;
          opacity: 0.8;
        }

        .admin-create-back {
          white-space: nowrap;
        }

        .admin-create-card {
          padding: 22px;
          border-radius: 12px;
          border: 1px solid rgba(239, 83, 80, 0.35);
          background: rgba(239, 83, 80, 0.12);
        }

        .admin-create-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-create-form label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-weight: 600;
        }

        .admin-create-form input {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(239, 83, 80, 0.5);
          background: rgba(0, 0, 0, 0.3);
          color: rgba(255, 255, 255, 0.92);
        }

        .admin-password-field {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-password-field input {
          flex: 1;
        }

        .admin-password-toggle {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(239, 83, 80, 0.5);
          background: rgba(239, 83, 80, 0.2);
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-pin-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
        }

        .admin-pin-grid input {
          text-align: center;
          padding: 10px 0;
        }


        .admin-create-submit {
          grid-column: 1 / -1;
          justify-content: center;
        }

        .admin-create-message {
          margin-top: 12px;
          opacity: 0.85;
        }

        @media (max-width: 768px) {
          .admin-create-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .admin-create-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
