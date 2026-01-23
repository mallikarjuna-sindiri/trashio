import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe } from '../api/auth';
import { parseJwt } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('trashio_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function applyThemeForRole(role) {
    const r = role || 'citizen';
    document.documentElement.dataset.theme = r;
  }

  function setRoleHint(role) {
    if (!role) return;
    localStorage.setItem('trashio_role_hint', role);
    if (!user) applyThemeForRole(role);
  }

  async function refresh() {
    const t = localStorage.getItem('trashio_token');
    setToken(t);
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Quick role/subject from JWT (client-side decode only)
    const decoded = parseJwt(t);

    try {
      const me = await getMe();
      setUser({ ...me, role: me.role || decoded?.role });
    } catch {
      // If token invalid / server down
      setUser(decoded ? { role: decoded.role, _id: decoded.sub } : null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Prefer authenticated role; otherwise keep last selected portal (landing/login/register)
    const preferred = user?.role || localStorage.getItem('trashio_role_hint') || 'citizen';
    applyThemeForRole(preferred);
  }, [user?.role]);

  function loginWithToken(accessToken) {
    localStorage.setItem('trashio_token', accessToken);
    setToken(accessToken);
    setLoading(true);
    refresh();
  }

  function logout() {
    localStorage.removeItem('trashio_token');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, loginWithToken, logout, refresh, setRoleHint }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
