import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

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
  rol: 'administrador' | 'formador' | 'instructor' | 'residente' | 'alumno';
  hospital?: {
    _id: string;
    nombre: string;
  };
  avatar?: string;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

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

        const userWithToken = { ...res.data.data, token };
        setUser(userWithToken);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userWithToken));
      } catch (err: any) {
        localStorage.removeItem('token');
        
        setError(err.response?.data?.error || 'Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/auth/login', { email, password });
      const token = res.data.token;

      localStorage.setItem('token', token);

      const userRes = await api.get('/auth/me');
      const userWithToken = { ...userRes.data.data, token };

      setUser(userWithToken);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userWithToken));

      navigate('/dashboard');
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
      const userWithToken = { ...userRes.data.data, token };

      setUser(userWithToken);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userWithToken));

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

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
