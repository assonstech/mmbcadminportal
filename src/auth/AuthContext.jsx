// src/auth/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // used to avoid showing "session expired" on initial unauthenticated page load
  const initialAuthChecked = useRef(false);

  // checkAuth: ask server who I am (returns 200+user or 401)
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admins/login/check');
      setUser(res.data?.data ?? null);
      setIsAuthenticated(true)
    } catch (err) {
      setUser(null);
      // do NOT set sessionExpired here — initial request may be unauthenticated
    } finally {
      setLoading(false);
      initialAuthChecked.current = true;
    }
  }, []);

  useEffect(() => {
    // set up interceptor *once*
    const interceptor = api.interceptors.response.use(
      response => response,
      (error) => {
        // if backend returns 401, propagate state to app
        if (error.response && error.response.status === 401) {
          setUser(null);

          // only show session expired dialog if we've previously established the initial auth state
          // (i.e., user was previously checked and then later the token expired)
          if (initialAuthChecked.current) {
            setSessionExpired(true);
          }
        }
        return Promise.reject(error);
      }
    );

    // cleanup on unmount
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    // initial auth check on mount
    checkAuth();
  }, [checkAuth]);

  // signIn: logs in (server should set cookie or return token)
  const signIn = async (identifier, password) => {
    try {
      const payload = identifier.includes('@')
        ? { email: identifier, password }
        : { username: identifier, password };

      const res = await api.post('/admins/login', payload);
      if (res.data?.success) {
        await checkAuth(); // refresh user info
        setIsAuthenticated(true)
        return { success: true, message: 'Logged in' };
      }
      return { success: false, message: res.data?.message ?? 'Login failed' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? 'Login failed' };
    }
  };

  // signOut: tell backend to clear cookie and clear client state
  const signOut = async () => {
    try {
      await api.post('/admins/logout');
    } catch (err) {
      // ignore errors — either way clear local state
      console.error('logout error', err?.response?.data ?? err.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false)
      setSessionExpired(false);
    }
  };


  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    signIn,
    signOut,
    sessionExpired,
    setSessionExpired,
    checkAuth
  }), [user, isAuthenticated, loading, sessionExpired, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
