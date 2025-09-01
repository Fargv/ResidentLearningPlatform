import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import Role from '../../types/roles';

interface TutorRouteProps {
  children: React.ReactNode;
}

const TutorRoute: React.FC<TutorRouteProps> = ({ children }) => {
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

  // Verificar si el usuario es tutor, csm, profesor o administrador (los administradores pueden acceder a todo)
  if (
    user?.rol !== Role.TUTOR &&
    user?.rol !== Role.CSM &&
    user?.rol !== Role.PROFESOR &&
    user?.rol !== Role.ADMINISTRADOR
  ) {
    // Redirigir al dashboard si no tiene permisos
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default TutorRoute;
