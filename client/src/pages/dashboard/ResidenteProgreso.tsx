import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Button,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  List,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fase-tabpanel-${index}`}
      aria-labelledby={`fase-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ResidenteProgreso: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fases, setFases] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [progreso, setProgreso] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<any>(null);
  const [comentarios, setComentarios] = useState('');
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const fasesRes = await axios.get('/api/fases');
        setFases(fasesRes.data.data);

        const actividadesRes = await axios.get('/api/actividades');
        setActividades(actividadesRes.data.data);

        const progresoRes = await axios.get(`/api/progreso/residente/${user._id}`);
        setProgreso(progresoRes.data.data);

        const statsRes = await axios.get(`/api/progreso/stats/residente/${user._id}`);
        setStats(statsRes.data.data);

        if (Array.isArray(fasesRes.data.data) && fasesRes.data.data.length > 0) {
          setTabValue(0);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (actividad: any) => {
    setSelectedActividad(actividad);
    setComentarios('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedActividad(null);
    setComentarios('');
  };

  const handleRegistrarProgreso = async () => {
    if (!selectedActividad || !user?._id) return;

    try {
      setRegistrando(true);

      const res = await axios.post('/api/progreso', {
        residente: user._id,
        actividad: selectedActividad._id,
        comentarios
      });

      setProgreso([...progreso, res.data.data]);

      const statsRes = await axios.get(`/api/progreso/stats/residente/${user._id}`);
      setStats(statsRes.data.data);

      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar progreso');
    } finally {
      setRegistrando(false);
    }
  };

  const getActividadEstado = (actividadId: string) => {
    const actividadProgreso = progreso.find(p => p.actividad._id === actividadId);
    return actividadProgreso ? actividadProgreso.estado : null;
  };

  const tieneProgreso = (actividadId: string) => {
    return progreso.some(p => p.actividad._id === actividadId);
  };

  if (loading) return <Box sx={{ width: '100%', mt: 4 }}><LinearProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Mi Progreso</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Progreso General</Typography>
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

        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
          <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
            <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">
                  {Array.isArray(stats?.fases) ? stats.fases.reduce((acc: number, fase: any) => acc + fase.completadas, 0) : 0}
                </Typography>
                <Typography variant="body2">Completadas</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
            <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">
                  {Array.isArray(stats?.fases) ? stats.fases.reduce((acc: number, fase: any) => acc + fase.pendientes, 0) : 0}
                </Typography>
                <Typography variant="body2">Pendientes</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
            <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">
                  {Array.isArray(stats?.fases) ? stats.fases.reduce((acc: number, fase: any) => acc + fase.rechazadas, 0) : 0}
                </Typography>
                <Typography variant="body2">Rechazadas</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            aria-label="fases tabs"
          >
            {Array.isArray(fases) && fases.map((fase, index) => (
              <Tab 
                key={fase._id} 
                label={`Fase ${fase.numero}: ${fase.nombre}`} 
                id={`fase-tab-${index}`}
                aria-controls={`fase-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {Array.isArray(fases) && fases.map((fase, index) => (
          <TabPanel key={fase._id} value={tabValue} index={index}>
            <Typography variant="h6" gutterBottom>{fase.nombre}</Typography>
            <Typography variant="body1" paragraph>{fase.descripcion}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>Actividades</Typography>
            <List>
              {Array.isArray(actividades) && actividades
                .filter(actividad => actividad.fase?._id === fase._id)
                .sort((a, b) => a.orden - b.orden)
                .map(actividad => {
                  const estado = getActividadEstado(actividad._id);
                  return (
                    <Paper key={actividad._id} sx={{ mb: 2, p: 2 }}>
                      <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                        <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '66.666%' } }}>
                          <Typography variant="h6">{actividad.nombre}</Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>{actividad.descripcion}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Chip size="small" label={actividad.tipo} color="primary" sx={{ mr: 1 }} />
                            {estado && (
                              <Chip
                                size="small"
                                icon={
                                  estado === 'validado' ? <CheckCircleIcon /> :
                                  estado === 'pendiente' ? <PendingIcon /> :
                                  <ErrorIcon />
                                }
                                label={
                                  estado === 'validado' ? 'Validado' :
                                  estado === 'pendiente' ? 'Pendiente de validación' :
                                  'Rechazado'
                                }
                                color={
                                  estado === 'validado' ? 'success' :
                                  estado === 'pendiente' ? 'warning' :
                                  'error'
                                }
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' }, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            color="primary"
                            disabled={tieneProgreso(actividad._id)}
                            onClick={() => handleOpenDialog(actividad)}
                          >
                            {tieneProgreso(actividad._id) ? 'Completada' : 'Registrar'}
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
            </List>
          </TabPanel>
        ))}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Registrar Actividad</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Estás registrando la actividad: <strong>{selectedActividad?.nombre}</strong>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="comentarios"
            label="Comentarios o notas"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Cancelar</Button>
          <Button onClick={handleRegistrarProgreso} color="primary" disabled={registrando}>
            {registrando ? 'Registrando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidenteProgreso;
