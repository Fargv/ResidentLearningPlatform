import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  //Grid,
  Card,
  CardContent,
  CardHeader,
  //LinearProgress,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (user?.rol === 'residente') {
          const statsRes = await axios.get(`/api/progreso/stats/residente/${user._id}`);
          setStats(statsRes.data.data);
          const actividadesRes = await axios.get(`/api/progreso/residente/${user._id}`);
          setRecentActivity(actividadesRes.data.data.slice(0, 5));
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  const renderContent = () => {
    if (loading) {
      return <Typography>Cargando...</Typography>;
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    return (
      <Paper sx={{ p: 2, mb: 3 }}>
 <Box display="flex" flexWrap="wrap" gap={2}>
  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '50%' } }}>
    <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">{stats?.fasesTotales || 0}</Typography>
        <Typography variant="subtitle1">Fases totales</Typography>
      </CardContent>
    </Card>
  </Box>

  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '50%' } }}>
    <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">{stats?.actividadesCompletadas || 0}</Typography>
        <Typography variant="subtitle1">Actividades completadas</Typography>
      </CardContent>
    </Card>
  </Box>

  <Box sx={{ p: 2, flexBasis: '100%' }}>
    <Card>
      <CardHeader title="Actividad Reciente" />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        <List sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
          {recentActivity.length > 0 ? (
            recentActivity.map((actividad) => (
              <React.Fragment key={actividad._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: actividad.estado === 'validado' ? 'success.main' : actividad.estado === 'pendiente' ? 'warning.main' : 'error.main' }}>
                      {actividad.estado === 'validado' ? <CheckCircleIcon /> : actividad.estado === 'pendiente' ? <PendingIcon /> : <ErrorIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={actividad.actividad.nombre}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {actividad.actividad.fase.nombre}
                        </Typography>
                        {` — ${new Date(actividad.fechaCreacion).toLocaleDateString()}`}
                        <Chip 
                          size="small" 
                          label={actividad.estado === 'validado' ? 'Validado' : actividad.estado === 'pendiente' ? 'Pendiente' : 'Rechazado'} 
                          color={actividad.estado === 'validado' ? 'success' : actividad.estado === 'pendiente' ? 'warning' : 'error'}
                          sx={{ ml: 1 }}
                        />
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No hay actividades recientes" />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  </Box>
</Box>
      </Paper>
    );
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
