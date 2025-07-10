import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  useEffect(() => {
    setLoading(false);
  }, [user]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) return <Alert severity="error">{error}</Alert>;

    return null;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bienvenido, {user?.nombre}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {user?.rol === 'administrador' 
            ? 'Panel de Administración' 
            : user?.rol === 'formador' 
              ? `Formador en ${user?.hospital?.nombre || 'Hospital'}` 
              : `Residente en ${user?.hospital?.nombre || 'Hospital'}`}
        </Typography>
      </Box>
      {renderContent()}
    </Box>
  );
};

export default DashboardHome;