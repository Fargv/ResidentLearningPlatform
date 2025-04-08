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
          <Grid item xs={12} md={8}>
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
          
          <Grid item xs={12} md={4}>
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
    
    // Dashboard para formadores
    if (user?.rol === 'formador') {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Estadísticas del Hospital
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{stats?.totalResidentes || 0}</Typography>
                      <Typography variant="body2">Residentes</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{stats?.totalFormadores || 0}</Typography>
                      <Typography variant="body2">Formadores</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{stats?.actividadesCompletadas || 0}</Typography>
                      <Typography variant="body2">Actividades Completadas</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{stats?.validacionesPendientes || 0}</Typography>
                      <Typography variant="body2">Validaciones Pendientes</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Validaciones Pendientes" 
                action={
                  <Button 
                    variant="contained" 
                    size="small" 
                    color="primary"
                    href="/dashboard/validaciones"
                  >
                    Ver Todas
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
                  {pendingValidations.length > 0 ? (
                    pendingValidations.map((validacion) => (
                      <React.Fragment key={validacion._id}>
                        <ListItem alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                              <PendingIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={validacion.actividad.nombre}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {validacion.residente.nombre} {validacion.residente.apellidos}
                                </Typography>
                                {` — ${new Date(validacion.fechaCreacion).toLocaleDateString()}`}
                              </>
                            }
                          />
                          <Button 
                            variant="outlined" 
                            size="small" 
                            color="primary"
                            href={`/dashboard/validaciones/${validacion._id}`}
                            sx={{ ml: 1 }}
                          >
                            Validar
                          </Button>
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No hay validaciones pendientes" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
    
    // Dashboard para administradores
    if (user?.rol === 'administrador') {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4">{stats?.totalUsuarios || 0}</Typography>
                    <Typography variant="body2">Usuarios Totales</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4">{stats?.totalHospitales || 0}</Typography>
                    <Typography variant="body2">Hospitales</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4">{stats?.totalResidentes || 0}</Typography>
                    <Typography variant="body2">Residentes</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h4">{stats?.totalFormadores || 0}</Typography>
                    <Typography variant="body2">Formadores</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Progreso General por Hospital
              </Typography>
              {stats?.hospitales?.map((hospital: any) => (
                <Box key={hospital._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {hospital.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {hospital.porcentajeCompletado}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={hospital.porcentajeCompletado} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Usuarios Recientes" 
                action={
                  <Button 
                    variant="contained" 
                    size="small" 
                    color="primary"
                    href="/dashboard/usuarios"
                  >
                    Ver Todos
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((usuario) => (
                      <React.Fragment key={usuario._id}>
                        <ListItem alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar>
                              {usuario.nombre.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${usuario.nombre} ${usuario.apellidos}`}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {usuario.email}
                                </Typography>
                                {` — ${new Date(usuario.fechaCreacion).toLocaleDateString()}`}
                                <Chip 
                                  size="small" 
                                  label={usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)} 
                                  color={usuario.rol === 'administrador' ? 'primary' : usuario.rol === 'formador' ? 'secondary' : 'default'}
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
                      <ListItemText primary="No hay usuarios recientes" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
    
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
