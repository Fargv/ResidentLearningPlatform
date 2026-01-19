import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDayMonthYear } from '../../utils/date';

interface Actividad {
  nombre?: string;
  tipo?: string;
  estado?: 'pendiente' | 'completado' | 'rechazado' | 'validado';
  fecha?: string;
  fechaValidacion?: string;
  fechaRechazo?: string;
  comentariosResidente?: string;
  comentariosTutor?: string;
  comentariosRechazo?: string;
  adjuntos?: Array<{ _id: string; nombreArchivo: string }>;
  requiereAdjunto?: boolean;
}

interface ProgresoFase {
  _id: string;
  fase: { _id: string; numero: number; nombre: string };
  estadoGeneral: string;
  actividades: Actividad[];
}

interface SummaryResponse {
  user: {
    _id: string;
    nombre: string;
    apellidos: string;
    email: string;
    tipo?: string;
    hospital?: { _id?: string; nombre?: string; zona?: string } | null;
    sociedad?: { _id?: string; titulo?: string } | null;
  };
  faseActual?: { _id: string; nombre?: string; numero?: number } | null;
  progreso: { total: number; validadas: number; porcentaje: number };
  pendientesValidacion: number;
  ultimaActualizacion?: string | null;
  estadoGeneral: string;
}

const formatActivityType = (type?: string): string => {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const SeguimientoDetalle: React.FC = () => {
  const theme = useTheme();
  const { userId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [progresos, setProgresos] = useState<ProgresoFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'validate' | 'reject';
    progresoId: string;
    index: number;
    activityName: string;
  } | null>(null);
  const [actionComments, setActionComments] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const getActivityStatusData = useCallback(
    (estado?: Actividad['estado']) => {
      switch (estado) {
        case 'validado':
          return {
            label: t('status.validado'),
            color: 'success' as const,
            icon: <VerifiedIcon fontSize="small" />
          };
        case 'rechazado':
          return {
            label: t('status.rechazado'),
            color: 'error' as const,
            icon: <CancelIcon fontSize="small" />
          };
        case 'completado':
          return {
            label: t('status.pendingValidation'),
            color: 'warning' as const,
            icon: <CheckCircleOutlineIcon fontSize="small" />
          };
        case 'pendiente':
        default:
          return {
            label: t('status.pendiente'),
            color: 'info' as const,
            icon: <HourglassEmptyIcon fontSize="small" />
          };
      }
    },
    [t]
  );

  const phaseStatusKey = useCallback((status: string) => (
    status === 'en progreso' ? 'enProgreso' : status
  ), []);

  const summaryStatus = useMemo(() => {
    switch (summary?.estadoGeneral) {
      case 'al_dia':
        return { label: t('followUp.status.upToDate'), color: 'success' as const };
      case 'pendiente_validacion':
        return { label: t('followUp.status.pendingValidation'), color: 'warning' as const };
      case 'bloqueado':
        return { label: t('followUp.status.blocked'), color: 'error' as const };
      case 'sin_actividad':
        return { label: t('followUp.status.noActivity'), color: 'default' as const };
      default:
        return { label: '-', color: 'default' as const };
    }
  }, [summary?.estadoGeneral, t]);

  const canValidate = useMemo(() => {
    if (!user || !summary) return false;
    if (user.rol === 'administrador') return true;
    if (user.rol === 'csm') {
      if (!user.zona || !summary.user.hospital?.zona) return false;
      return user.zona.toUpperCase() === summary.user.hospital.zona.toUpperCase();
    }
    if (user.rol === 'tutor') {
      return Boolean(
        user.hospital?._id &&
          summary.user.hospital?._id &&
          user.hospital._id === summary.user.hospital._id
      );
    }
    if (user.rol === 'profesor') {
      if (summary.user.tipo === 'Programa Residentes') {
        return Boolean(
          user.hospital?._id &&
            summary.user.hospital?._id &&
            user.hospital._id === summary.user.hospital._id
        );
      }
      const userSociedadId =
        typeof user.sociedad === 'string' ? user.sociedad : user.sociedad?._id;
      return Boolean(userSociedadId && summary.user.sociedad?._id === userSociedadId);
    }
    return false;
  }, [summary, user]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, progressRes] = await Promise.all([
        api.get('/progreso/seguimiento', { params: { userId } }),
        api.get(`/progreso/residente/${userId}`)
      ]);

      const summaryData = summaryRes.data?.data?.[0] || null;
      setSummary(summaryData);
      setProgresos(progressRes.data?.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || t('followUp.detail.error'));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadAdjunto = async (adjuntoId: string, nombreArchivo: string) => {
    try {
      setDownloading(adjuntoId);
      const res = await api.get(`/adjuntos/${adjuntoId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreArchivo || 'adjunto');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // no-op, handled by UI
    } finally {
      setDownloading(null);
    }
  };

  const renderComment = (label: string, value?: string) => {
    if (!value) return null;
    return (
      <Box sx={{ mt: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {label}
        </Typography>
        <Paper
          elevation={0}
          sx={{
            mt: 0.75,
            p: 1.5,
            borderRadius: 2,
            backgroundColor:
              theme.palette.mode === 'light'
                ? theme.palette.common.white
                : theme.palette.grey[800],
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body2" color="text.primary">
            {value}
          </Typography>
        </Paper>
      </Box>
    );
  };

  const openActionDialog = (
    type: 'validate' | 'reject',
    progresoId: string,
    index: number,
    activityName: string
  ) => {
    setActionDialog({ type, progresoId, index, activityName });
    setActionComments('');
    setActionError(null);
  };

  const closeActionDialog = () => {
    if (actionProcessing) return;
    setActionDialog(null);
    setActionComments('');
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (!actionDialog) return;
    try {
      setActionProcessing(true);
      const endpoint =
        actionDialog.type === 'validate'
          ? `/progreso/${actionDialog.progresoId}/actividad/${actionDialog.index}/validar`
          : `/progreso/${actionDialog.progresoId}/actividad/${actionDialog.index}/rechazar`;
      const signatureValue = user
        ? `${user.nombre} ${user.apellidos} - ${formatDayMonthYear(new Date().toISOString())}`
        : '';
      const payload =
        actionDialog.type === 'validate'
          ? { comentarios: actionComments, firmaDigital: signatureValue }
          : { comentarios: actionComments };
      await api.post(endpoint, payload);
      closeActionDialog();
      fetchData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || t('followUp.detail.error'));
    } finally {
      setActionProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Button variant="outlined" onClick={() => navigate('/dashboard/seguimiento')} sx={{ mb: 2 }}>
        {t('followUp.detail.back')}
      </Button>

      <Typography variant="h4" gutterBottom>
        {t('followUp.detail.title')}
      </Typography>

      {summary && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            backgroundColor:
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {summary.user.nombre} {summary.user.apellidos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary.user.email}
              </Typography>
            </Box>
            <Chip
              label={summaryStatus.label}
              color={summaryStatus.color}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[
              {
                label: t('followUp.detail.currentPhase'),
                value: summary.faseActual
                  ? t('followUp.phaseLabel', {
                      number: summary.faseActual.numero,
                      name: summary.faseActual.nombre
                    })
                  : t('followUp.status.noActivity')
              },
              {
                label: t('followUp.detail.progress'),
                value: `${summary.progreso.validadas}/${summary.progreso.total} (${summary.progreso.porcentaje}%)`
              },
              {
                label: t('followUp.detail.pending'),
                value: `${summary.pendientesValidacion}`
              },
              summary.ultimaActualizacion
                ? {
                    label: t('followUp.detail.lastUpdate'),
                    value: formatDayMonthYear(summary.ultimaActualizacion)
                  }
                : null
            ]
              .filter(Boolean)
              .map((item) => (
                <Box key={(item as { label: string }).label}>
                  <Typography variant="subtitle2">{(item as { label: string }).label}</Typography>
                  <Typography variant="body2">{(item as { value: string }).value}</Typography>
                </Box>
              ))}
          </Box>
        </Paper>
      )}

      {progresos.length === 0 && (
        <Alert severity="info">{t('followUp.detail.noActivity')}</Alert>
      )}

      {progresos.map((progreso) => (
        <Accordion
          key={progreso._id}
          defaultExpanded={progreso.estadoGeneral === 'en progreso'}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                flex: 1
              }}
            >
              <Typography variant="h6">
                {t('followUp.phaseLabel', {
                  number: progreso.fase.numero,
                  name: progreso.fase.nombre
                })}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" alignItems="center" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={progreso.estadoGeneral ? t(`status.${phaseStatusKey(progreso.estadoGeneral)}`) : '—'}
                color={
                  progreso.estadoGeneral === 'validado'
                    ? 'success'
                    : progreso.estadoGeneral === 'completado'
                    ? 'primary'
                    : 'default'
                }
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('followUp.detail.progress')}: {' '}
                {progreso.actividades.filter((act) => act.estado === 'validado').length}/
                {progreso.actividades.length}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {progreso.actividades.map((actividad, index) => {
                const statusData = getActivityStatusData(actividad.estado);
                const dateEntries = [
                  actividad.fecha
                    ? {
                        label: t('followUp.detail.dates.created'),
                        value: formatDayMonthYear(actividad.fecha)
                      }
                    : null,
                  actividad.fechaValidacion
                    ? {
                        label: t('followUp.detail.dates.validated'),
                        value: formatDayMonthYear(actividad.fechaValidacion)
                      }
                    : null,
                  actividad.fechaRechazo
                    ? {
                        label: t('followUp.detail.dates.rejected'),
                        value: formatDayMonthYear(actividad.fechaRechazo)
                      }
                    : null
                ].filter(Boolean) as Array<{ label: string; value: string }>;
                const canShowActions = canValidate && actividad.estado === 'completado';
                const showAdjuntos =
                  actividad.estado === 'completado' &&
                  actividad.adjuntos &&
                  actividad.adjuntos.length > 0;

                return (
                  <Paper
                    key={`${progreso._id}-${index}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor:
                        theme.palette.mode === 'light'
                          ? theme.palette.grey[100]
                          : theme.palette.grey[900],
                      borderColor:
                        theme.palette.mode === 'light'
                          ? theme.palette.grey[300]
                          : theme.palette.grey[700],
                      boxShadow:
                        theme.palette.mode === 'light'
                          ? '0 4px 10px rgba(15, 23, 42, 0.08)'
                          : '0 4px 12px rgba(15, 23, 42, 0.35)',
                      flex: '1 1 320px',
                      minWidth: { xs: '100%', lg: 'calc(50% - 16px)' },
                      maxWidth: { xs: '100%', lg: 'calc(50% - 16px)' },
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        {formatActivityType(actividad.tipo) && (
                          <Chip
                            size="small"
                            label={formatActivityType(actividad.tipo)}
                            variant="outlined"
                            sx={{
                              fontWeight: 600,
                              backgroundColor:
                                theme.palette.mode === 'light'
                                  ? theme.palette.grey[100]
                                  : theme.palette.grey[800]
                            }}
                          />
                        )}
                        {actividad.requiereAdjunto && (
                          <Chip
                            size="small"
                            label={t('residentPhases.requiresAttachment')}
                            sx={{
                              fontWeight: 600,
                              backgroundColor:
                                theme.palette.mode === 'light'
                                  ? alpha(theme.palette.secondary.light, 0.25)
                                  : alpha(theme.palette.secondary.main, 0.35),
                              color:
                                theme.palette.mode === 'light'
                                  ? theme.palette.secondary.dark
                                  : theme.palette.secondary.light,
                              border: `1px solid ${
                                theme.palette.mode === 'light'
                                  ? alpha(theme.palette.secondary.main, 0.4)
                                  : alpha(theme.palette.secondary.light, 0.6)
                              }`
                            }}
                          />
                        )}
                        <Typography variant="subtitle1" fontWeight={600}>
                          {actividad.nombre || t('residentPhases.unnamedActivity')}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={statusData.label}
                        color={statusData.color}
                        icon={statusData.icon}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    {dateEntries.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {dateEntries.map((entry) => (
                          <Box key={entry.label}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                            >
                              {entry.label}
                            </Typography>
                            <Typography variant="body2">{entry.value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Box sx={{ mt: 2, flexGrow: 1 }}>
                      {renderComment(t('followUp.detail.comments.user'), actividad.comentariosResidente)}
                      {renderComment(t('followUp.detail.comments.tutor'), actividad.comentariosTutor)}
                      {renderComment(t('followUp.detail.comments.rejection'), actividad.comentariosRechazo)}

                      {showAdjuntos && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            {t('followUp.detail.attachments')}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                            {actividad.adjuntos?.map((adjunto) => (
                              <Button
                                key={adjunto._id}
                                variant="outlined"
                                size="small"
                                onClick={() => handleDownloadAdjunto(adjunto._id, adjunto.nombreArchivo)}
                                disabled={downloading === adjunto._id}
                                sx={{ alignSelf: 'flex-start' }}
                              >
                                {adjunto.nombreArchivo}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {canShowActions && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 2,
                          justifyContent: 'flex-end',
                          mt: 2
                        }}
                      >
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() =>
                            openActionDialog(
                              'validate',
                              progreso._id,
                              index,
                              actividad.nombre || t('residentPhases.unnamedActivity')
                            )
                          }
                        >
                          {t('common.validate')}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            openActionDialog(
                              'reject',
                              progreso._id,
                              index,
                              actividad.nombre || t('residentPhases.unnamedActivity')
                            )
                          }
                        >
                          {t('common.reject')}
                        </Button>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog open={Boolean(actionDialog)} onClose={closeActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog?.type === 'validate'
            ? t('tutorValidations.dialogs.validateTitle')
            : t('tutorValidations.dialogs.rejectTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {actionDialog?.type === 'validate'
              ? t('tutorValidations.dialogs.validateConfirm', {
                  activity: actionDialog.activityName,
                  resident: summary ? `${summary.user.nombre} ${summary.user.apellidos}` : ''
                })
              : t('tutorValidations.dialogs.rejectConfirm', {
                  activity: actionDialog?.activityName,
                  resident: summary ? `${summary.user.nombre} ${summary.user.apellidos}` : ''
                })}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={
              actionDialog?.type === 'validate'
                ? t('tutorValidations.dialogs.commentsOptional')
                : t('tutorValidations.dialogs.rejectReason')
            }
            value={actionComments}
            onChange={(event) => setActionComments(event.target.value)}
          />
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionDialog} disabled={actionProcessing}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color={actionDialog?.type === 'validate' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={actionProcessing}
          >
            {actionProcessing
              ? t('common.processing')
              : actionDialog?.type === 'validate'
              ? t('common.validate')
              : t('common.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeguimientoDetalle;
