import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import Role from '../types/roles';

//const API = process.env.REACT_APP_API_URL;

// Función de decodificación manual del JWT
function decodeJwt(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

interface User {
  _id: string;
  nombre: string;
  apellidos: string;
  email: string;
  token: string;
  rol: Role;
  hospital?: {
    _id: string;
    nombre: string;
  };
  especialidad?: string;
  zona?: string;
  tipo?: string; // ← Añadido para usuarios tipo "Programa Sociedades"
  sociedad?: string | { _id: string }; // ← Añadido para compatibilidad flexible
  avatar?: string;
  tutor?: { _id: string; nombre: string; apellidos: string } | null;
  activo: boolean;
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const INACTIVITY_LIMIT_MS = 25 * 60 * 1000; // 25 minutos

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    clearInactivityTimer();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [clearInactivityTimer, navigate]);

  const scheduleInactivityLogout = useCallback(() => {
    clearInactivityTimer();
    inactivityTimeoutRef.current = window.setTimeout(logout, INACTIVITY_LIMIT_MS);
  }, [clearInactivityTimer, logout]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }


        try {
          const decoded = decodeJwt(token);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            
            setLoading(false);
            return;
          }
        } catch (err) {
          localStorage.removeItem('token');
          
          setLoading(false);
          return;
        }

        const res = await api.get('/auth/me');
        const userData = res.data.data;
        const userWithToken: User = {
          ...userData,
          especialidad: userData.especialidad,
          tutor: userData.tutor ?? null,
          token
        };
        setUser(userWithToken);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userWithToken));
        scheduleInactivityLogout();
      } catch (err: any) {
        localStorage.removeItem('token');

        setError(err.response?.data?.error || 'Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [scheduleInactivityLogout]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Limpiar cualquier sesión previa antes de intentar iniciar sesión con nuevas credenciales
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);

      const res = await api.post('/auth/login', { email, password });
      const token = res.data.token;

      localStorage.setItem('token', token);

      const userRes = await api.get('/auth/me');
      const userData = userRes.data.data;
      const userWithToken: User = {
        ...userData,
        especialidad: userData.especialidad,
        tutor: userData.tutor ?? null,
        token
      };

      setUser(userWithToken);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userWithToken));

      navigate('/dashboard');
      scheduleInactivityLogout();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
  try {
    setLoading(true);
    setError(null);

    const res = await api.post('/auth/register', userData);
    const token = res.data.token;

    localStorage.setItem('token', token);

    const userRes = await api.get('/auth/me');
    const apiUserData = userRes.data.data; // ← nuevo nombre
    const userWithToken: User = {
      ...apiUserData,
      especialidad: apiUserData.especialidad,
      tutor: apiUserData.tutor ?? null,
      token
    };

    setUser(userWithToken);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userWithToken));

    navigate('/dashboard');
    scheduleInactivityLogout();
  } catch (err: any) {
    setError(err.response?.data?.error || 'Error al registrarse');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!isAuthenticated) {
      clearInactivityTimer();
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => scheduleInactivityLogout();

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [clearInactivityTimer, isAuthenticated, scheduleInactivityLogout]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    scheduleInactivityLogout();
  }, [isAuthenticated, scheduleInactivityLogout]);

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
