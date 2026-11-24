import { createContext, useContext, useEffect, useState } from 'react';
import api, { unwrap } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { if (localStorage.getItem('wanderly_token')) setUser(await unwrap(api.get('/auth/me'))); }
      catch { localStorage.removeItem('wanderly_token'); }
      finally { setLoading(false); }
    })();
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', user?.preferences?.theme === 'dark'); }, [user]);

  const start = (d) => { localStorage.setItem('wanderly_token', d.token); setUser(d.user); };
  const login = async (email, password) => start(await unwrap(api.post('/auth/login', { email, password })));
  const sendSetupCode = (data) => unwrap(api.post('/auth/setup/send-code', data));
  const verifySetup = async (data) => start(await unwrap(api.post('/auth/setup/verify', data)));
  const forgotSendCode = (email) => unwrap(api.post('/auth/forgot/send-code', { email }));
  const forgotVerify = (email, code) => unwrap(api.post('/auth/forgot/verify', { email, code }));
  const forgotReset = async (data) => start(await unwrap(api.post('/auth/forgot/reset', data)));
  const logout = () => { localStorage.removeItem('wanderly_token'); setUser(null); };
  const updateProfile = async (data) => setUser(await unwrap(api.put('/auth/profile', data)));
  const changePassword = (currentPassword, newPassword) => unwrap(api.put('/auth/password', { currentPassword, newPassword }));
  const needsSetup = () => unwrap(api.get('/auth/setup-status'));

  return (
    <AuthContext.Provider value={{
      user, loading, login, sendSetupCode, verifySetup, forgotSendCode, forgotVerify, forgotReset,
      logout, updateProfile, changePassword, needsSetup, units: user?.preferences?.units || 'metric',
    }}>
      {children}
    </AuthContext.Provider>
  );
}