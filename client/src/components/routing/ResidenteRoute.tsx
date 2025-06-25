import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ResidenteRouteProps {
  children: React.ReactNode;
}

const ResidenteRoute: React.FC<ResidenteRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login y guardar la ubicación actual para redirigir después de login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario es residente o tiene permisos superiores
  if (
    user?.rol !== 'residente' &&
    user?.rol !== 'alumno' &&
    user?.rol !== 'formador' &&
    user?.rol !== 'administrador'
  ) {
    // Redirigir al dashboard si no tiene permisos
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ResidenteRoute;
