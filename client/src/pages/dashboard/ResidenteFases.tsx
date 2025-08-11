import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Skeleton,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Tooltip,
  CircularProgress,
  Backdrop
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Sociedad } from '../../types/Sociedad';
import { formatMonthYear, formatDayMonthYear } from '../../utils/date';
import { useTranslation } from 'react-i18next';

const ResidenteFases: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [progresos, setProgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProgresoId, setSelectedProgresoId] = useState<string | null>(null);
  const [selectedActividadIndex, setSelectedActividadIndex] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [fecha, setFecha] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoError, setArchivoError] = useState(false);
  const [archivoErrorMsg, setArchivoErrorMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);
  const [sociedadInfo, setSociedadInfo] = useState<Sociedad | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const dateFieldMap: Record<number, keyof Sociedad> = {
    1: 'fechaModulosOnline',
    2: 'fechaSimulacion',
    3: 'fechaAtividadesFirstAssistant',
    4: 'fechaModuloOnlineStepByStep',
    5: 'fechaHandOn'
  };


  const getSociedadDateObj = (fase: number): Date | null => {
    if (!sociedadInfo) return null;
    const field = dateFieldMap[fase];
    const value = field ? (sociedadInfo as any)[field] : null;
    return value ? new Date(value) : null;
  };

  const getSociedadDate = (fase: number): string => {
    const date = getSociedadDateObj(fase);
    return date ? formatMonthYear(date.toISOString()) : '';
  };

  const getSociedadDateShort = (fase: number): string => {
    const date = getSociedadDateObj(fase);
    return date ? formatDayMonthYear(date.toISOString()) : '';
  };

  const getDateColor = (fase: number, estado: string): string => {
    if (estado === 'completado' || estado === 'validado') {
      return 'success.main';
    }
    const current = getSociedadDateObj(fase);
    if (!current) return 'secondary.main';
    const prev = getSociedadDateObj(fase - 1);
    const now = new Date();
    if (now > current) {
      return 'error.main';
    }
    if (prev && now > prev && now <= current) {
      return 'warning.main';
    }
    return 'info.main';
  };

  const phaseStatusKey = (status: string): string =>
    status === 'en progreso' ? 'enProgreso' : status;


  useEffect(() => {
    if (!user || !user._id || (user.rol !== 'residente' && user.rol !== 'participante')) return;
  
    const fetchProgresos = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/progreso/residente/${user._id}`);
        const data = response.data.data || [];
  
      // (debug) Aquí se listaban los progresos recibidos

        setProgresos(data);
      } catch (err: any) {
        console.error('Error cargando progreso:', err);
        setError(err.response?.data?.error || t('residentPhases.errorLoad'));
      } finally {
        setLoading(false);
      }
    };
  
    fetchProgresos();
  }, [user, t]);

  useEffect(() => {
    const loadSociedad = async () => {
      if (user?.tipo !== 'Programa Sociedades') {
        setSociedadInfo(null);
        return;
      }
      const sociedadId = (user as any)?.sociedad?._id || (user as any)?.sociedad;
      if (!sociedadId) return;
      try {
        const res = await api.get(`/sociedades/${sociedadId}`);
        const data = res.data.data || res.data;
        setSociedadInfo(data);
      } catch (err) {
        console.error('Error cargando sociedad', err);
      }
    };

    loadSociedad();
  }, [user]);

  const handleOpenDialog = (progresoId: string, index: number) => {
    setSelectedProgresoId(progresoId);
    setSelectedActividadIndex(index);
    setComentario('');
    setFecha(new Date().toISOString().split('T')[0]);
    setArchivo(null);
    setArchivoError(false);
    setArchivoErrorMsg('');
  
    // Mover el console.log al final para que acceda a los parámetros directamente
  
    setDialogOpen(true);
  };

  const botonConfirmarHabilitado =
    Boolean(selectedProgresoId) &&
    selectedActividadIndex !== null &&
    Boolean(fecha) &&
    !archivoError;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setArchivo(null);
        setArchivoError(true);
        setArchivoErrorMsg(t('residentPhases.dialog.fileTooLarge'));
      } else {
        setArchivo(file);
        setArchivoError(false);
        setArchivoErrorMsg('');
      }
    } else {
      setArchivo(null);
      setArchivoError(false);
      setArchivoErrorMsg('');
    }
  };



  const handleCompletarActividad = async () => {
    
    if (!selectedProgresoId || selectedActividadIndex === null) {
      setSnackbarError(true);
      setSnackbarMsg(t('residentPhases.noActivitySelectedError'));
      setSnackbarOpen(true);
      return;
    }

   try {
      const form = new FormData();
      form.append('fechaRealizacion', fecha);
      form.append('comentariosResidente', comentario);
      if (archivo) form.append('adjunto', archivo);

      const { data } = await api.put(
        `/progreso/${selectedProgresoId}/actividad/${selectedActividadIndex}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (!data?.success) {
        setSnackbarError(true);
        setSnackbarMsg(t('residentPhases.activityFail'));
        setSnackbarOpen(true);
        return;
      }

      setProgresos(prev =>
        prev.map((prog) =>
          prog._id === selectedProgresoId ? data.data : prog
        )
      );

      setSnackbarError(false);
      setSnackbarMsg(t('residentPhases.activitySuccess'));
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error actualizando actividad:', err);
      setSnackbarError(true);
      setSnackbarMsg(t('residentPhases.activitySaveError'));
      setSnackbarOpen(true);
    } finally {
      setDialogOpen(false);
      setArchivo(null);
    }
  };

  const handleDescargarCertificado = async () => {
    if (!user?._id) return;
    setDownloadLoading(true);
    try {
      const res = await api.get(`/certificado/${user._id}?lang=${i18n.language}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificado.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error || t('residentProgress.downloadError'));
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>{t('residentPhases.title')}</Typography>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  const allValidado = progresos
    .filter(p => p.faseModel === 'Fase')
    .every(p => p.estadoGeneral === 'validado');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('residentPhases.title')}</Typography>
      
      {Array.isArray(progresos) && progresos.length > 0 ? (
  progresos.map((item, index) => {

    return (
      <Accordion key={item._id} defaultExpanded={item.estadoGeneral === 'en progreso'}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {t('residentPhases.phaseTitle', {
              number: item.fase?.numero || '—',
              name: item.fase?.nombre || t('residentPhases.noTitle')
            })}
          </Typography>
          {user?.tipo === 'Programa Sociedades' && item.fase?.numero && (
            <Typography
              sx={{ ml: 'auto', color: getDateColor(item.fase.numero, item.estadoGeneral) }}
            >
              {getSociedadDate(item.fase.numero)}
            </Typography>
          )}
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <Chip
              label={item.estadoGeneral ? t(`status.${phaseStatusKey(item.estadoGeneral)}`) : '—'}
              color={
                item.estadoGeneral === 'validado'
                  ? 'success'
                  : item.estadoGeneral === 'completado'
                  ? 'primary'
                  : 'default'
              }
            />
            {user?.tipo === 'Programa Sociedades' && item.fase?.numero && (
              <Typography sx={{ ml: 2, color: getDateColor(item.fase.numero, item.estadoGeneral) }}>
                {t('residentPhases.deadline')}: {getSociedadDateShort(item.fase.numero)}
              </Typography>
            )}
          </Box>

          {(() => {
            const total = item.actividades.length;
            const validadas = item.actividades.filter((a: any) => a.estado === 'validado').length;
            const porcentaje = total ? Math.round((validadas / total) * 100) : 0;
            return (
              <>
                <LinearProgress
                  variant="determinate"
                  value={porcentaje}
                  sx={{ height: 8, borderRadius: 5, mb: 1 }}
                />
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {t('residentPhases.validatedProgress', { percent: porcentaje })}
                </Typography>
              </>
            );
          })()}

          {item.estadoGeneral !== 'bloqueada' ? (
            <List>
              {Array.isArray(item.actividades) && item.actividades.length > 0 ? (
                item.actividades.map((act: any, idx: number) => (
                  <ListItem key={idx}>
                  {act.estado === 'validado' && <VerifiedIcon sx={{ color: 'green', mr: 1 }} />}
                  {act.estado === 'completado' && <CheckCircleOutlineIcon sx={{ color: 'blue', mr: 1 }} />}
                  {act.estado === 'rechazado' && <CancelIcon sx={{ color: 'red', mr: 1 }} />}
                  {act.estado === 'pendiente' && <HourglassEmptyIcon sx={{ color: 'gray', mr: 1 }} />}
                  <ListItemText
                    primary={act.nombre || t('residentPhases.unnamedActivity')}
                    secondary={
                      <>
                        {act.comentariosResidente && (
                          <Typography variant="body2" color="text.secondary">
                            {t('residentPhases.comment')}: {act.comentariosResidente}
                          </Typography>
                        )}
                        {act.fecha && (
                          <Typography variant="body2" color="text.secondary">
                            {t('residentPhases.completedOn')}: {formatDayMonthYear(act.fecha)}
                          </Typography>
                        )}
                        {act.comentariosFormador && (
                          <Typography variant="body2" color="text.secondary">
                            {t('residentPhases.tutorComment')}: {act.comentariosFormador}
                          </Typography>
                        )}
                        {act.estado === 'rechazado' && act.comentariosRechazo && (
                          <Typography variant="body2" color="error">
                            {t('residentPhases.rejectionReason')}: {act.comentariosRechazo}
                          </Typography>
                        )}
                        {act.fechaValidacion && (
                          <Typography variant="body2" color="text.secondary">
                            {t('residentPhases.validatedOn')}: {formatDayMonthYear(act.fechaValidacion)}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {t('residentPhases.status')}: {
                            act.estado === 'validado'
                              ? t('status.validado')
                              : act.estado === 'rechazado'
                              ? t('status.rechazado')
                              : act.estado === 'completado'
                              ? t('status.pendingValidation')
                              : t('status.noCompletada')
                          }
                        </Typography>
                      </>
                    }
                  />
                  {((!act.estado || act.estado === 'pendiente' || act.estado === 'rechazado') && item.estadoGeneral !== 'bloqueada') && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        handleOpenDialog(item._id, idx);
                      }}
                      sx={{ ml: 2 }}
                    >
                      {t('residentPhases.markAsCompleted')}
                    </Button>
                  )}
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary={t('residentPhases.noActivities')} />
                </ListItem>
              )}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('residentPhases.phaseLocked')}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    );
  })
) : (
  <Alert severity="info">{t('residentPhases.noProgress')}</Alert>
)}
      {allValidado && (
        <Box textAlign="center" mt={2}>
          <Button
            variant="contained"
            onClick={handleDescargarCertificado}
            disabled={downloadLoading}
          >
            {t('residentProgress.downloadCertificate')}
          </Button>
        </Box>
      )}

      <Backdrop
        open={downloadLoading}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>




      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{t('residentPhases.dialog.title')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('residentPhases.dialog.date')}
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t('residentPhases.dialog.comment')}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            {t('residentPhases.dialog.selectFile')}
            <input
              type="file"
              hidden
              accept="application/pdf,image/png,image/jpeg"
              onChange={handleFileChange}
            />
          </Button>

          {archivo && !archivoError && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {archivo.name} – {(archivo.size / (1024 * 1024)).toFixed(1)} MB
            </Typography>
          )}
          {archivoError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {archivoErrorMsg}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('residentPhases.dialog.cancel')}</Button>
          <Tooltip
            title={
              archivoError
                ? archivoErrorMsg
                : !selectedProgresoId
                ? t('residentPhases.dialog.missingProgressId')
                : selectedActividadIndex === null
                ? t('residentPhases.dialog.noActivitySelected')
                : !fecha
                ? t('residentPhases.dialog.selectDate')
                : t('residentPhases.dialog.optionalFileHint')
            }
            arrow
            disableHoverListener={botonConfirmarHabilitado}
          >
            <span>
              <Button
                onClick={handleCompletarActividad}
                variant="contained"
                disabled={!botonConfirmarHabilitado}
              >
                {t('residentPhases.dialog.confirm')}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>

      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={snackbarMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: { bgcolor: snackbarError ? 'error.main' : 'success.main', color: 'white' }
        }}
      />
    </Box>
  );
};

export default ResidenteFases;
