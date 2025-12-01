import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Theme handled via ColorModeProvider
//import { Box } from '@mui/material';
//import { useTranslation } from 'react-i18next';
//import LanguageSelector from './components/LanguageSelector';

// Contexto de autenticación
import { AuthProvider } from './context/AuthContext';

// Componentes de enrutamiento
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';
import TutorRoute from './components/routing/TutorRoute';

// Páginas públicas
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterInvite from './pages/RegisterInvite';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Páginas del dashboard
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/dashboard/DashboardHome';
import TutorValidaciones from './pages/dashboard/TutorValidaciones';
import Usuarios from './pages/dashboard/Usuarios';
import AdminHospitales from './pages/dashboard/AdminHospitales';
import AdminFases from './pages/dashboard/AdminFases';
import Perfil from './pages/dashboard/Perfil';
import Notificaciones from './pages/dashboard/Notificaciones';
import AdminSociedades from "./pages/dashboard/AdminSociedades";
import AdminProgresoDetalle from './pages/dashboard/AdminProgresoDetalle';
import AdminInformes from './pages/dashboard/AdminInformes';
import InstallPrompt from './components/InstallPrompt';


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
      <InstallPrompt />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/:token" element={<RegisterInvite />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/politica-privacidad" element={<PrivacyPolicy />} />

            {/* Ruta raíz redirige a dashboard o login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard/*" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }>

              <Route index element={<DashboardHome />} />

              {/* Rutas para residentes */}


              {/* Rutas para tutores */}
              <Route path="validaciones" element={
                <TutorRoute>
                  <TutorValidaciones />
                </TutorRoute>
              } />
              {/* Rutas para tutores y administradores */}
              <Route path="usuarios" element={
                <TutorRoute>
                  <Usuarios />
                </TutorRoute>
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
              <Route path="progreso-usuarios" element={
                <AdminRoute>
                  <Navigate to="/dashboard/usuarios" />
                </AdminRoute>
              } />
              <Route path="progreso-usuario/:userId" element={
                <AdminRoute>
                  <AdminProgresoDetalle />
                </AdminRoute>
              } />
              <Route path="sociedades" element={
                  <AdminRoute>
                    <AdminSociedades />
                  </AdminRoute>
                }
              />
              <Route path="informes" element={
                <AdminRoute>
                  <AdminInformes />
                </AdminRoute>
              } />

              {/* Rutas comunes */}
              <Route path="perfil" element={<Perfil />} />
              <Route path="notificaciones" element={<Notificaciones />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="/politica-privacidad" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
  </div>
  );
}

export default App;
