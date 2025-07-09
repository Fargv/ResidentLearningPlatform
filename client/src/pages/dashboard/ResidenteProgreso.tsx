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
  TextField,
  Skeleton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

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
interface Actividad {
  _id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  fase?: {
    _id: string;
  };
  orden: number;
}

interface Fase {
  _id: string;
  nombre: string;
  descripcion: string;
  numero: number;
}

interface ProgresoItem {
  _id: string;
  actividad: {
    _id: string;
  };
  estado: 'pendiente' | 'validado' | 'rechazado';
}

interface Stats {
  porcentajeTotal: number;
  fases: {
    completadas: number;
    pendientes: number;
    rechazadas: number;
  }[];
}

const ResidenteProgreso: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [progreso, setProgreso] = useState<ProgresoItem[]>([]);  
  const [stats, setStats] = useState<Stats | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [comentarios, setComentarios] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [selectedProgresoId, setSelectedProgresoId] = useState<string | null>(null);
  const [selectedActividadIndex, setSelectedActividadIndex] = useState<number | null>(null);
  const allValidado = progreso.length > 0 && progreso.every(p => p.estado === 'validado');

useEffect(() => {
  if (!user?._id) return;

  const fetchData = async () => {
    try {
      setLoading(true);

      const fasesRes = await api.get('/fases');
      const actividadesRes = await api.get('/actividades');
      const progresoRes = await api.get(`/progreso/residente/${user._id}`);
      const statsRes = await api.get(`/progreso/stats/residente/${user._id}`);
      setStats(statsRes.data.data);

      setFases(fasesRes.data.data);
      setActividades(actividadesRes.data.data);
      setProgreso(progresoRes.data.data);

      if (Array.isArray(fasesRes.data.data) && fasesRes.data.data.length > 0) {
        setTabValue(0);
      }
    } catch (err: any) {
      console.error("Error al cargar datos de progreso:", err);
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

  const handleOpenDialog = (
    actividad: Actividad,
    progresoId: string | undefined,
    index: number
  ) => {
    if (!progresoId || index === -1) return;
    setSelectedActividad(actividad);
    setSelectedProgresoId(progresoId);
    setSelectedActividadIndex(index);
    setComentarios('');
    setOpenDialog(true);
  };
  
  

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedActividad(null);
    setComentarios('');
    setSelectedProgresoId(null);
    setSelectedActividadIndex(null);
  };
  

  const handleRegistrarProgreso = async () => {
    if (!selectedProgresoId || selectedActividadIndex === null || !user?._id) return;
  
    try {
      setRegistrando(true);
  
      const res = await api.put(`/progreso/${selectedProgresoId}/actividad/${selectedActividadIndex}`, {
        estado: 'completado',
        comentariosResidente: comentarios,
        fechaRealizacion: new Date(),
      });
  
      const actualizado = progreso.map((p, i) =>
        i === selectedActividadIndex ? res.data.data : p
      );
  
      setProgreso(actualizado);
  
      const statsRes = await api.get(`/progreso/stats/residente/${user._id}`);
      setStats(statsRes.data.data);
  
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al marcar como completada');
    } finally {
      setRegistrando(false);
    }
  };
  
  const handleDescargarCertificado = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/certificado/${user._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificado.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al descargar certificado');
    }
  };



  const getActividadEstado = (actividadId: string) => {
    const actividadProgreso = progreso.find(p => p.actividad._id === actividadId);
    return actividadProgreso ? actividadProgreso.estado : null;
  };

  const tieneProgreso = (actividadId: string) => {
    return progreso.some(p => p.actividad._id === actividadId);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>Mi Progreso</Typography>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

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
                {stats?.fases?.reduce((acc, fase) => acc + fase.completadas, 0) ?? 0}
                </Typography>
                <Typography variant="body2">Completadas</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
            <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">
                {stats?.fases?.reduce((acc, fase) => acc + fase.pendientes, 0) ?? 0}

                </Typography>
                <Typography variant="body2">Pendientes</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
            <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">
                {stats?.fases?.reduce((acc, fase) => acc + fase.rechazadas, 0) ?? 0}

                </Typography>
                <Typography variant="body2">Rechazadas</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
        {allValidado && (
          <Box textAlign="center" mt={2}>
            <Button variant="contained" onClick={handleDescargarCertificado}>
              Descargar certificado
            </Button>
          </Box>
        )}
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
                        {(() => {
  const progresoItem = progreso.find(p => p.actividad._id === actividad._id);
  const index = progreso.findIndex(p => p.actividad._id === actividad._id);
  return (
    <Button
      variant="contained"
      color="primary"
      disabled={tieneProgreso(actividad._id)}
      onClick={() => handleOpenDialog(actividad, progresoItem?._id, index)}
    >
      {tieneProgreso(actividad._id) ? 'Completada' : 'Registrar'}
    </Button>
  );
})()}

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
