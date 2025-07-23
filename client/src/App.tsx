import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Contexto de autenticación
import { AuthProvider } from './context/AuthContext';

// Componentes de enrutamiento
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';
import FormadorRoute from './components/routing/FormadorRoute';
import ResidenteRoute from './components/routing/ResidenteRoute';

// Páginas públicas
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

// Páginas del dashboard
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/dashboard/DashboardHome';
import ResidenteProgreso from './pages/dashboard/ResidenteProgreso';
import FormadorValidaciones from './pages/dashboard/FormadorValidaciones';
import Usuarios from './pages/dashboard/Usuarios';
import AdminHospitales from './pages/dashboard/AdminHospitales';
import AdminFases from './pages/dashboard/AdminFases';
import AdminValidaciones from './pages/dashboard/AdminValidaciones';
import Perfil from './pages/dashboard/Perfil';
import Notificaciones from './pages/dashboard/Notificaciones';
import DebugDashboard from './pages/DebugDashboard';
import AdminSociedades from "./pages/dashboard/AdminSociedades";

// Tema personalizado con colores de Abex e Intuitive
const theme = createTheme({
  palette: {
    primary: {
      main: '#1E5B94', // Azul Abex
      light: '#4c7fb3',
      dark: '#153e67',
    },
    secondary: {
      main: '#6AB023', // Verde Abex
      light: '#8cc94f',
      dark: '#4a7b18',
    },
    background: {
      default: '#f5f5f5',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#1A2B3C', // Azul oscuro Intuitive
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

declare global {
  interface Window {
    REACT_APP_ENV?: string;
  }
}

function App() {
  useEffect(() => {
    console.log("REACT_APP_API_URL cargada:", process.env.REACT_APP_API_URL);
  }, []);

  const env = process.env.REACT_APP_ENV || window.REACT_APP_ENV;
  const isDev = env === 'dev';

  useEffect(() => {
    document.title = isDev ? 'DEV Academic Prog' : 'Academic Program';
  }, [isDev]);

  const wrapperStyle: React.CSSProperties | undefined =
    isDev ? { backgroundColor: '#fdd', minHeight: '100vh' } : undefined;

  return (
    <div style={wrapperStyle}>
      {isDev && (
        <div
          style={{
            background: 'red',
            color: 'white',
            textAlign: 'center',
            padding: '0.5rem',
            fontWeight: 'bold',
          }}
        >
          ⚠️ ESTÁS EN ENTORNO DE DESARROLLO ⚠️
        </div>
      )}

      <ThemeProvider theme={theme}>
      <CssBaseline />
        <Router>
          <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Ruta raíz redirige a dashboard o login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard/*" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }>

              <Route index element={<DashboardHome />} />

              {/* Rutas para residentes */}
              <Route path="progreso" element={
                <ResidenteRoute>
                  <ResidenteProgreso />
                </ResidenteRoute>
              } />

              {/* Rutas para formadores */}
              <Route path="validaciones" element={
                <FormadorRoute>
                  <FormadorValidaciones />
                </FormadorRoute>
              } />
              {/* Rutas para formadores y administradores */}
              <Route path="usuarios" element={
                <FormadorRoute>
                  <Usuarios />
                </FormadorRoute>
              } />

              {/* Rutas solo para administradores */}
              <Route path="hospitales" element={
                <AdminRoute>
                  <AdminHospitales />
                </AdminRoute>
              } />
              <Route path="fases" element={
                <AdminRoute>
                  <AdminFases />
                </AdminRoute>
              } />
              <Route path="validaciones-admin" element={
                <AdminRoute>
                  <AdminValidaciones />
                </AdminRoute>
              } />
              <Route path="sociedades" element={
                  <AdminRoute>
                    <AdminSociedades />
                  </AdminRoute>
                }
              />

              {/* Rutas comunes */}
              <Route path="perfil" element={<Perfil />} />
              <Route path="notificaciones" element={<Notificaciones />} />

              {/* Ruta de depuración */}
              <Route path="debug" element={<DebugDashboard />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  </div>
  );
}

export default App;
