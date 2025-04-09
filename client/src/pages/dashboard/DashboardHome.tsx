import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Divider,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingValidations, setPendingValidations] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener estadísticas según el rol del usuario
        if (user?.rol === 'residente') {
          const statsRes = await axios.get(`/api/progreso/stats/residente/${user._id}`);
          setStats(statsRes.data.data);
          
          // Obtener actividades recientes
          const actividadesRes = await axios.get(`/api/progreso/residente/${user._id}`);
          setRecentActivity(actividadesRes.data.data.slice(0, 5));
        } else if (user?.rol === 'formador') {
          // Obtener estadísticas del hospital
          const statsRes = await axios.get(`/api/hospitals/${user.hospital}/stats`);
          setStats(statsRes.data.data);
          
          // Obtener validaciones pendientes
          const validacionesRes = await axios.get('/api/progreso?estado=pendiente');
          setPendingValidations(validacionesRes.data.data.slice(0, 5));
        } else if (user?.rol === 'administrador') {
          // Obtener estadísticas generales
          const statsRes = await axios.get('/api/users/stats');
          setStats(statsRes.data.data);
          
          // Obtener últimos usuarios registrados
          const usuariosRes = await axios.get('/api/users?sort=-fechaCreacion&limit=5');
          setRecentActivity(usuariosRes.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Renderizar contenido según el rol del usuario
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    // Dashboard para residentes
    if (user?.rol === 'residente') {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} component="div" sx={{ p: 2 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Progreso General
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.porcentajeTotal || 0} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.porcentajeTotal || 0}%
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Progreso por Fases
              </Typography>
              {stats?.fases?.map((fase: any) => (
                <Box key={fase.fase._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Fase {fase.fase.numero}: {fase.fase.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fase.completadas}/{fase.totalActividades} actividades
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={fase.porcentajeCompletado} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {fase.porcentajeCompletado}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4} component="div" sx={{ p: 2 }}>
            <Card sx={{ height: '100%' }}>
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
          </Grid>
        </Grid>
      );
    }

    // Continue with the rest of the conditions for 'formador' and 'administrador' roles...

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
