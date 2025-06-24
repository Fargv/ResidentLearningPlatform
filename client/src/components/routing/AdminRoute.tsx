import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (process.env.NODE_ENV === 'development') {
    console.log('🟢 AdminRoute mounted');
    console.log('🔍 isAuthenticated:', isAuthenticated);
    console.log('🔍 loading:', loading);
    console.log('🔍 user:', user);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⛔ Usuario no autenticado, redirigiendo a login');
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.rol !== 'administrador') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⛔ Usuario no es administrador, redirigiendo a dashboard');
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Usuario administrador autenticado → renderizando hijos');
  }
  return <>{children}</>;
};

export default AdminRoute;
