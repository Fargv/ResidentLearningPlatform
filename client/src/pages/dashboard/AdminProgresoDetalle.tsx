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
import { useTranslation } from 'react-i18next';

const activityStatusMap: Record<string, string> = {
  pendiente: 'pending',
  completado: 'completed',
  rechazado: 'rejected',
  validado: 'validated'
};
const phaseStatusMap: Record<string, string> = {
  bloqueada: 'blocked',
  'en progreso': 'inProgress',
  completado: 'completed',
  validado: 'validated',
  pendiente: 'pending',
  rechazado: 'rejected'
};
interface Actividad {
  nombre?: string;
  estado?: 'pendiente' | 'completado' | 'rechazado' | 'validado';
  fecha?: string;
  fechaValidacion?: string;
  tipo: string;
  porcentajeParticipacion?: number;
  cirugia?: {
    name?: string;
  };
  otraCirugia?: string;
  nombreCirujano?: string;
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
  const { t } = useTranslation();
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
  const [bulkStatus, setBulkStatus] = useState<Record<string, string>>({});
  const [previousActivityStates, setPreviousActivityStates] = useState<Record<string, string[]>>({});

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
      setSnackbar({ open: true, message: t('adminProgressDetail.phaseUpdateSuccess'), severity: 'success' });
    } catch (err: any) {
      const message = err.response?.data?.error || t('adminProgressDetail.phaseUpdateError');
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
      setSnackbar({ open: true, message: t('adminProgressDetail.activityUpdateSuccess'), severity: 'success' });
    } catch (err: any) {
      const message = err.response?.data?.error || t('adminProgressDetail.activityUpdateError');
      setApiError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleBulkStatusChange = async (
    progresoId: string,
    estado: string
  ) => {
    if (!window.confirm(t('adminProgressDetail.confirmBulkChange'))) return;

    const progreso = progresos.find((p) => p._id === progresoId);
    const prevStates = progreso?.actividades.map((a) => a.estado || 'pendiente') || [];
    setPreviousActivityStates((prev) => ({ ...prev, [progresoId]: prevStates }));

    try {
      setApiError(null);
      const res = await api.post('/admin/cambiar-estados-actividades', {
        progresoId,
        estado
      });
      const updated = res.data.data;
      setProgresos((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      setBulkStatus((prev) => ({ ...prev, [progresoId]: '' }));
      setSnackbar({ open: true, message: t('adminProgressDetail.activityUpdateSuccess'), severity: 'success' });
    } catch (err: any) {
      const message = err.response?.data?.error || t('adminProgressDetail.activityUpdateError');
      setApiError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleBulkRevert = async (progresoId: string) => {
    const prevStates = previousActivityStates[progresoId];
    if (!prevStates) return;
    try {
      setApiError(null);
      let updated: ProgresoFase | null = null;
      for (let i = 0; i < prevStates.length; i++) {
        const res = await api.post('/admin/cambiar-estado-actividad', {
          progresoId,
          index: i,
          estado: prevStates[i]
        });
        updated = res.data.data;
      }
      if (updated) {
        setProgresos((prev) =>
          prev.map((p) => (p._id === updated!._id ? updated! : p))
        );
        setSnackbar({ open: true, message: t('adminProgressDetail.activityUpdateSuccess'), severity: 'success' });
      }
      setPreviousActivityStates((prev) => {
        const copy = { ...prev };
        delete copy[progresoId];
        return copy;
      });
      setBulkStatus((prev) => ({ ...prev, [progresoId]: '' }));
    } catch (err: any) {
      const message = err.response?.data?.error || t('adminProgressDetail.activityUpdateError');
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
            ? t('adminProgressDetail.titleWithName', {
                name: userInfo.nombre,
                surname: userInfo.apellidos
              })
            : t('adminProgressDetail.title')}
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          {t('adminProgressDetail.back')}
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
          const total = item.actividades?.length || 0;
          const validadas = item.actividades?.filter(a => a.estado === 'validado').length || 0;
          const porcentaje = total ? Math.round((validadas / total) * 100) : 0;
          return (
            <Accordion key={item._id} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {t('adminProgressDetail.phaseTitle', {
                    number: item.fase?.numero || '—',
                    name: item.fase?.nombre || t('adminProgressDetail.noTitle')
                  })}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                  <Chip
                    label={
                      item.estadoGeneral
                        ? t(`adminProgressDetail.phaseStatus.${phaseStatusMap[item.estadoGeneral]}`)
                        : '—'
                    }
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
                        {t('adminProgressDetail.phaseStatusLabel')}
                      </InputLabel>
                      <Select
                        labelId={`fase-${item._id}-estado-label`}
                        value={item.estadoGeneral}
                        label={t('adminProgressDetail.phaseStatusLabel')}
                        onChange={(e) =>
                          handlePhaseStatusChange(item._id, e.target.value as string)
                        }
                      >
                        <MenuItem value="bloqueada">
                          {t('adminProgressDetail.phaseStatus.blocked')}
                        </MenuItem>
                        <MenuItem value="en progreso">
                          {t('adminProgressDetail.phaseStatus.inProgress')}
                        </MenuItem>
                        <MenuItem value="completado">
                          {t('adminProgressDetail.phaseStatus.completed')}
                        </MenuItem>
                        <MenuItem value="validado">
                          {t('adminProgressDetail.phaseStatus.validated')}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>
                <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 8, borderRadius: 5, mb: 1 }} />
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {t('adminProgressDetail.validatedProgress', { percent: porcentaje })}
                </Typography>
                {isAdmin && (
                  <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 160, mr: 2 }}>
                      <InputLabel id={`bulk-${item._id}-estado-label`}>
                        {t('adminProgressDetail.masterStatusLabel')}
                      </InputLabel>
                      <Select
                        labelId={`bulk-${item._id}-estado-label`}
                        value={bulkStatus[item._id] || ''}
                        label={t('adminProgressDetail.masterStatusLabel')}
                        onChange={(e) =>
                          handleBulkStatusChange(item._id, e.target.value as string)
                        }
                      >
                        <MenuItem value="pendiente">
                          {t('adminProgressDetail.activityStatus.pending')}
                        </MenuItem>
                        <MenuItem value="completado">
                          {t('adminProgressDetail.activityStatus.completed')}
                        </MenuItem>
                        <MenuItem value="validado">
                          {t('adminProgressDetail.activityStatus.validated')}
                        </MenuItem>
                        <MenuItem value="rechazado">
                          {t('adminProgressDetail.activityStatus.rejected')}
                        </MenuItem>
                      </Select>
                    </FormControl>
                    {previousActivityStates[item._id] && (
                      <Button variant="outlined" onClick={() => handleBulkRevert(item._id)}>
                        {t('adminProgressDetail.revert')}
                      </Button>
                    )}
                  </Box>
                )}
                <List>
                  {item.actividades.map((act, idx) => (
                    <ListItem key={idx}>
                      {act.estado === 'validado' && <VerifiedIcon sx={{ color: 'green', mr: 1 }} />}
                      {act.estado === 'completado' && <CheckCircleOutlineIcon sx={{ color: 'blue', mr: 1 }} />}
                      {act.estado === 'rechazado' && <CancelIcon sx={{ color: 'red', mr: 1 }} />}
                      {act.estado === 'pendiente' && <HourglassEmptyIcon sx={{ color: 'gray', mr: 1 }} />}
                      <ListItemText
                        primary={act.nombre || t('adminProgressDetail.noActivityName')}
                        secondary={
                          <>
                            {act.fecha && (
                              <Typography variant="body2" color="text.secondary">
                                {t('adminProgressDetail.completedOn', {
                                  date: formatDayMonthYear(act.fecha)
                                })}
                              </Typography>
                            )}
                            {act.fechaValidacion && (
                              <Typography variant="body2" color="text.secondary">
                                {t('adminProgressDetail.validatedOn', {
                                  date: formatDayMonthYear(act.fechaValidacion)
                                })}
                              </Typography>
                            )}
                              {(act.cirugia?.name || act.otraCirugia || act.nombreCirujano) && (
                                <>
                                  {(act.cirugia?.name || act.otraCirugia) && (
                                    <Typography variant="body2" color="text.secondary">
                                      {t('adminProgressDetail.surgeryType', {
                                        type: act.cirugia?.name || act.otraCirugia
                                      })}
                                    </Typography>
                                  )}
                                  {act.nombreCirujano && (
                                    <Typography variant="body2" color="text.secondary">
                                      {t('adminProgressDetail.surgeonName', {
                                        name: act.nombreCirujano
                                      })}
                                    </Typography>
                                  )}
                                </>
                              )}
                            {act.tipo === 'cirugia' && typeof act.porcentajeParticipacion === 'number' && (
                              <Typography variant="body2" color="text.secondary">
                                {t('adminProgressDetail.participation', {
                                  percent: act.porcentajeParticipacion
                                })}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {t('adminProgressDetail.activityType', { type: act.tipo })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('adminProgressDetail.statusWithValue', {
                                status: t(
                                  `adminProgressDetail.activityStatus.${activityStatusMap[act.estado || 'pendiente']}`
                                )
                              })
                              }
                            </Typography>
                          </>
                        }
                      />
                      {isAdmin && (
                        <FormControl size="small" sx={{ ml: 2, minWidth: 140 }}>
                          <InputLabel id={`act-${item._id}-${idx}-estado-label`}>
                            {t('adminProgressDetail.activityStatusLabel')}
                          </InputLabel>
                          <Select
                            labelId={`act-${item._id}-${idx}-estado-label`}
                            value={act.estado}
                            label={t('adminProgressDetail.activityStatusLabel')}
                            onChange={(e) =>
                              handleActivityStatusChange(item._id, idx, e.target.value as string)
                            }
                          >
                            <MenuItem value="pendiente">
                              {t('adminProgressDetail.activityStatus.pending')}
                            </MenuItem>
                            <MenuItem value="completado">
                              {t('adminProgressDetail.activityStatus.completed')}
                            </MenuItem>
                            <MenuItem value="validado">
                              {t('adminProgressDetail.activityStatus.validated')}
                            </MenuItem>
                            <MenuItem value="rechazado">
                              {t('adminProgressDetail.activityStatus.rejected')}
                            </MenuItem>
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
        <Alert severity="info">{t('adminProgressDetail.noProgress')}</Alert>
      )}
    </Box>
  );
};

export default AdminProgresoDetalle;

