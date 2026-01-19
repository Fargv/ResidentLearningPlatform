import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Typography
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { formatDayMonthYear } from '../../utils/date';

interface Actividad {
  nombre?: string;
  estado?: 'pendiente' | 'completado' | 'rechazado' | 'validado';
  fecha?: string;
  fechaValidacion?: string;
  fechaRechazo?: string;
  comentariosResidente?: string;
  comentariosTutor?: string;
  comentariosRechazo?: string;
  firmaDigital?: string;
  adjuntos?: Array<{ _id: string; nombreArchivo: string }>;
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
    hospital?: { nombre?: string } | null;
    sociedad?: { titulo?: string } | null;
  };
  faseActual?: { _id: string; nombre?: string; numero?: number } | null;
  progreso: { total: number; validadas: number; porcentaje: number };
  pendientesValidacion: number;
  ultimaActualizacion?: string | null;
  estadoGeneral: string;
}

const SeguimientoDetalle: React.FC = () => {
  const { userId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [progresos, setProgresos] = useState<ProgresoFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const statusLabels = useMemo(
    () => ({
      pendiente: t('followUp.activityStatus.pending'),
      completado: t('followUp.activityStatus.completed'),
      validado: t('followUp.activityStatus.validated'),
      rechazado: t('followUp.activityStatus.rejected')
    }),
    [t]
  );

  const statusColors = useMemo(
    () => ({
      pendiente: 'warning' as const,
      completado: 'info' as const,
      validado: 'success' as const,
      rechazado: 'error' as const
    }),
    []
  );

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
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {value}
        </Typography>
      </Box>
    );
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
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {summary.user.nombre} {summary.user.apellidos}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {summary.user.email}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="subtitle2">{t('followUp.detail.currentPhase')}</Typography>
              <Typography variant="body2">
                {summary.faseActual
                  ? t('followUp.phaseLabel', {
                      number: summary.faseActual.numero,
                      name: summary.faseActual.nombre
                    })
                  : t('followUp.status.noActivity')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">{t('followUp.detail.progress')}</Typography>
              <Typography variant="body2">
                {summary.progreso.validadas}/{summary.progreso.total} ({summary.progreso.porcentaje}%)
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">{t('followUp.detail.pending')}</Typography>
              <Typography variant="body2">{summary.pendientesValidacion}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">{t('followUp.detail.lastUpdate')}</Typography>
              <Typography variant="body2">
                {summary.ultimaActualizacion
                  ? formatDayMonthYear(summary.ultimaActualizacion)
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {progresos.length === 0 && (
        <Alert severity="info">{t('followUp.detail.noActivity')}</Alert>
      )}

      {progresos.map((progreso) => (
        <Paper key={progreso._id} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">
              {t('followUp.phaseLabel', {
                number: progreso.fase.numero,
                name: progreso.fase.nombre
              })}
            </Typography>
            <Chip label={progreso.estadoGeneral} variant="outlined" />
          </Box>
          <Divider sx={{ my: 2 }} />

          {progreso.actividades.map((actividad, index) => (
            <Paper key={`${progreso._id}-${index}`} sx={{ p: 2, mb: 2 }} variant="outlined">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1">{actividad.nombre}</Typography>
                <Chip
                  label={statusLabels[actividad.estado || 'pendiente']}
                  color={statusColors[actividad.estado || 'pendiente']}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="body2">
                  {t('followUp.detail.dates.created')}: {actividad.fecha ? formatDayMonthYear(actividad.fecha) : '-'}
                </Typography>
                <Typography variant="body2">
                  {t('followUp.detail.dates.validated')}:{' '}
                  {actividad.fechaValidacion ? formatDayMonthYear(actividad.fechaValidacion) : '-'}
                </Typography>
                <Typography variant="body2">
                  {t('followUp.detail.dates.rejected')}:{' '}
                  {actividad.fechaRechazo ? formatDayMonthYear(actividad.fechaRechazo) : '-'}
                </Typography>
              </Box>

              {renderComment(t('followUp.detail.comments.user'), actividad.comentariosResidente)}
              {renderComment(t('followUp.detail.comments.tutor'), actividad.comentariosTutor)}
              {renderComment(t('followUp.detail.comments.rejection'), actividad.comentariosRechazo)}

              {actividad.firmaDigital && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">{t('followUp.detail.signature')}</Typography>
                  <Box
                    component="img"
                    src={actividad.firmaDigital}
                    alt={t('followUp.detail.signature')}
                    sx={{ maxWidth: 220, border: '1px solid', borderColor: 'divider', mt: 1 }}
                  />
                </Box>
              )}

              {actividad.adjuntos && actividad.adjuntos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">{t('followUp.detail.attachments')}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    {actividad.adjuntos.map((adjunto) => (
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
            </Paper>
          ))}
        </Paper>
      ))}
    </Box>
  );
};

export default SeguimientoDetalle;
