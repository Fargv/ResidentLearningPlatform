import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;


// Función de decodificación manual del JWT
function decodeJwt(token: string): any {
  const base64Url = token.split('.')[1];  // Parte del token que contiene el payload
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Ajuste para que sea un Base64 válido
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);  // Devuelve el payload como un objeto
}

interface User {
  _id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: 'administrador' | 'formador' | 'residente';
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

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        
        // Verificar si hay un token en localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Configurar el token en los headers de axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verificar si el token es válido
        try {
          const decoded = decodeJwt(token);  // Usando la función de decodificación manual
          
          // Verificar si el token ha expirado
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setLoading(false);
            return;
          }
        } catch (err) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setLoading(false);
          return;
        }
        
        // Obtener información del usuario
        const res = await axios.get(`${API}/auth/me`);
        
        setUser(res.data.data);
        setIsAuthenticated(true);
      } catch (err: any) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setError(err.response?.data?.error || 'Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API}/auth/login`, { email, password });
      
      // Guardar token en localStorage
      localStorage.setItem('token', res.data.token);
      
      // Configurar el token en los headers de axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      // Obtener información del usuario
      const userRes = await axios.get(`${API}/auth/me`);
      
      setUser(userRes.data.data);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userRes.data.data));
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función para registrarse
  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API}/auth/register`, userData);
      
      // Guardar token en localStorage
      localStorage.setItem('token', res.data.token);
      
      // Configurar el token en los headers de axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      // Obtener información del usuario
      const userRes = await axios.get(`${API}/auth/me`);
      
      setUser(userRes.data.data);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userRes.data.data));
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    // Eliminar token de localStorage
    localStorage.removeItem('token');
    
    // Eliminar token de los headers de axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Limpiar estado
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirigir a la página de login
    navigate('/login');
  };

  // Función para limpiar errores
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
