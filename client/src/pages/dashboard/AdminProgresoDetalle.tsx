import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDayMonthYear } from '../../utils/date';

interface Actividad {
  nombre?: string;
  estado?: 'pendiente' | 'completado' | 'rechazado' | 'validado';
  fecha?: string;
  fechaValidacion?: string;
}

interface ProgresoFase {
  _id: string;
  fase: { numero: number; nombre: string };
  estadoGeneral: string;
  actividades: Actividad[];
}

interface UserInfo {
  nombre: string;
  apellidos: string;
}

const AdminProgresoDetalle: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  const [progresos, setProgresos] = useState<ProgresoFase[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, progRes] = await Promise.all([
          api.get(`/users/${userId}`),
          api.get(`/progreso/residente/${userId}`)
        ]);
        setUserInfo(userRes.data.data || userRes.data);
        setProgresos(progRes.data.data || progRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar el progreso');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePhaseStatusChange = async (
    progresoId: string,
    estadoGeneral: string
  ) => {
    try {
      setApiError(null);
      const res = await api.post('/admin/cambiar-estado-fase', {
        progresoId,
        estadoGeneral
      });
      const updated = res.data.data;
      setProgresos((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      setSnackbar({ open: true, message: 'Fase actualizada correctamente', severity: 'success' });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al actualizar la fase';
      setApiError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleActivityStatusChange = async (
    progresoId: string,
    index: number,
    estado: string
  ) => {
    try {
      setApiError(null);
      const res = await api.post('/admin/cambiar-estado-actividad', {
        progresoId,
        index,
        estado
      });
      const updated = res.data.data;
      setProgresos((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      setSnackbar({ open: true, message: 'Actividad actualizada correctamente', severity: 'success' });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al actualizar actividad';
      setApiError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" gutterBottom>
          {userInfo
            ? `Progreso de ${userInfo.nombre} ${userInfo.apellidos}`
            : 'Progreso del Usuario'}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard/progreso-usuarios')}>
          Atrás
        </Button>
      </Box>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}
      {progresos.length ? (
        progresos.map((item) => {
          const total = item.actividades.length;
          const validadas = item.actividades.filter(a => a.estado === 'validado').length;
          const porcentaje = total ? Math.round((validadas / total) * 100) : 0;
          return (
            <Accordion key={item._id} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Fase {item.fase?.numero || '—'}: {item.fase?.nombre || 'Sin título'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                  <Chip
                    label={item.estadoGeneral || '—'}
                    color={
                      item.estadoGeneral === 'validado'
                        ? 'success'
                        : item.estadoGeneral === 'completado'
                        ? 'primary'
                        : 'default'
                    }
                  />
                  {isAdmin && (
                    <FormControl size="small" sx={{ ml: 2, minWidth: 160 }}>
                      <InputLabel id={`fase-${item._id}-estado-label`}>
                        Estado fase
                      </InputLabel>
                      <Select
                        labelId={`fase-${item._id}-estado-label`}
                        value={item.estadoGeneral}
                        label="Estado fase"
                        onChange={(e) =>
                          handlePhaseStatusChange(item._id, e.target.value as string)
                        }
                      >
                        <MenuItem value="bloqueada">Bloqueada</MenuItem>
                        <MenuItem value="en progreso">En progreso</MenuItem>
                        <MenuItem value="completado">Completado</MenuItem>
                        <MenuItem value="validado">Validado</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>
                <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 8, borderRadius: 5, mb: 1 }} />
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Progreso validado: {porcentaje}%
                </Typography>
                <List>
                  {item.actividades.map((act, idx) => (
                    <ListItem key={idx}>
                      {act.estado === 'validado' && <VerifiedIcon sx={{ color: 'green', mr: 1 }} />}
                      {act.estado === 'completado' && <CheckCircleOutlineIcon sx={{ color: 'blue', mr: 1 }} />}
                      {act.estado === 'rechazado' && <CancelIcon sx={{ color: 'red', mr: 1 }} />}
                      {act.estado === 'pendiente' && <HourglassEmptyIcon sx={{ color: 'gray', mr: 1 }} />}
                      <ListItemText
                        primary={act.nombre || 'Actividad sin nombre'}
                        secondary={
                          <>
                            {act.fecha && (
                              <Typography variant="body2" color="text.secondary">
                                Fecha completada: {formatDayMonthYear(act.fecha)}
                              </Typography>
                            )}
                            {act.fechaValidacion && (
                              <Typography variant="body2" color="text.secondary">
                                Validado el: {formatDayMonthYear(act.fechaValidacion)}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Estado: {act.estado}
                            </Typography>
                          </>
                        }
                      />
                      {isAdmin && (
                        <FormControl size="small" sx={{ ml: 2, minWidth: 140 }}>
                          <InputLabel id={`act-${item._id}-${idx}-estado-label`}>
                            Estado actividad
                          </InputLabel>
                          <Select
                            labelId={`act-${item._id}-${idx}-estado-label`}
                            value={act.estado}
                            label="Estado actividad"
                            onChange={(e) =>
                              handleActivityStatusChange(item._id, idx, e.target.value as string)
                            }
                          >
                            <MenuItem value="pendiente">Pendiente</MenuItem>
                            <MenuItem value="completado">Completado</MenuItem>
                            <MenuItem value="validado">Validado</MenuItem>
                            <MenuItem value="rechazado">Rechazado</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })
      ) : (
        <Alert severity="info">No hay progreso disponible.</Alert>
      )}
    </Box>
  );
};

export default AdminProgresoDetalle;
