import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardActionArea,
  CardContent
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  BugReport as BugReportIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  useEffect(() => {
    setLoading(false);
  }, [user]);

  const navigate = useNavigate();

  type Action = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const actions: Action[] = [];


  if (user?.rol === 'residente' || user?.rol === 'alumno') {
    actions.push(
      { label: 'Mi Progreso', path: '/dashboard/progreso', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
      { label: 'Fases Formativas', path: '/dashboard/fases', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> }
    );
  }

  if (user?.rol === 'formador' || user?.rol === 'instructor') {
    actions.push({ label: 'Validaciones', path: '/dashboard/validaciones', icon: <SchoolIcon sx={{ fontSize: 40 }} /> });
  }

  if (user?.rol === 'administrador') {
    actions.push(
      { label: 'Validaciones', path: '/dashboard/validaciones-admin', icon: <SchoolIcon sx={{ fontSize: 40 }} /> },
      { label: 'Usuarios', path: '/dashboard/usuarios', icon: <PeopleIcon sx={{ fontSize: 40 }} /> },
      { label: 'Hospitales', path: '/dashboard/hospitals', icon: <HospitalIcon sx={{ fontSize: 40 }} /> },
      { label: 'Sociedades', path: '/dashboard/sociedades', icon: <GroupIcon sx={{ fontSize: 40 }} /> },
      { label: 'Programa Residentes', path: '/dashboard/fases', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
      { label: 'Programa Sociedades', path: '/dashboard/fases-soc', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
      { label: 'Access Codes', path: '/dashboard/access-codes', icon: <SettingsIcon sx={{ fontSize: 40 }} /> },
      { label: 'Debug', path: '/dashboard/debug', icon: <BugReportIcon sx={{ fontSize: 40 }} /> }
    );
  }

  actions.push(
    { label: 'Mi Perfil', path: '/dashboard/perfil', icon: <PersonIcon sx={{ fontSize: 40 }} /> },
    { label: 'Notificaciones', path: '/dashboard/notificaciones', icon: <NotificationsIcon sx={{ fontSize: 40 }} /> }
  );

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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
  {actions.map((action) => (
    <Box
      key={action.label}
      sx={{
        width: {
          xs: '100%',
          sm: '48%',
          md: '31%',
          lg: '23%'
        }
      }}
    >
      <Card>
        <CardActionArea onClick={() => navigate(action.path)}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            {action.icon}
            <Typography variant="subtitle1" sx={{ mt: 1, textAlign: 'center' }}>
              {action.label}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  ))}
</Box>

      {renderContent()}
    </Box>
  );
};

export default DashboardHome;
