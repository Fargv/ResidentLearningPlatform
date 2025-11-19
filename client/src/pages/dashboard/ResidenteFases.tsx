import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
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
  Backdrop,
  Autocomplete,
  MenuItem,
  Paper,
  Stack,
  FormControlLabel,
  IconButton
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import Switch, { SwitchProps } from '@mui/material/Switch';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, alpha, styled } from '@mui/material/styles';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Sociedad } from '../../types/Sociedad';
import { formatMonthYear, formatDayMonthYear } from '../../utils/date';
import { useTranslation } from 'react-i18next';

const CompletionSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 48,
  height: 28,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '200ms',
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`,
      border: `1px solid ${theme.palette.primary.main}`
    },
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: theme.palette.common.white,
      '& .MuiSwitch-thumb': {
        boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.35)}`
      },
      '& + .MuiSwitch-track': {
        backgroundColor:
          theme.palette.mode === 'light'
            ? theme.palette.primary.main
            : alpha(theme.palette.primary.light, 0.55),
        borderColor: 'transparent',
        opacity: 1
      }
    }
  },
  '& .MuiSwitch-thumb': {
    width: 24,
    height: 24,
    boxSizing: 'border-box',
    borderRadius: '50%',
    backgroundColor: theme.palette.common.white,
    boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.3)}`,
    position: 'relative',
    '&:before': {
      content: "''",
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`
    }
  },
  '& .MuiSwitch-track': {
    borderRadius: 999,
    backgroundColor:
      theme.palette.mode === 'light'
        ? alpha(theme.palette.text.primary, 0.15)
        : alpha(theme.palette.common.white, 0.25),
    border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
    opacity: 1,
    boxSizing: 'border-box'
  }
}));

const formatActivityType = (type?: string): string => {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

type SurgeryOption = { _id: string; name: string; inputValue?: string };
const surgeryFilter = createFilterOptions<SurgeryOption>();

const ResidenteFases: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const placeholderToken = '___';

  const getLabelFromTranslation = (key: string, params: Record<string, string>) => {
    const raw = t(key as any, params);
    return raw
      .replace(new RegExp(`${placeholderToken}`, 'g'), '')
      .replace(/[:：]\s*$/, '')
      .replace(/[%％]\s*$/, '')
      .trim();
  };
  const [progresos, setProgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProgresoId, setSelectedProgresoId] = useState<string | null>(null);
  const [selectedActividadIndex, setSelectedActividadIndex] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [fecha, setFecha] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [archivoError, setArchivoError] = useState(false);
  const [archivoErrorMsg, setArchivoErrorMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);
  const [sociedadInfo, setSociedadInfo] = useState<Sociedad | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [surgeryTypes, setSurgeryTypes] = useState<any[]>([]);
  const [cirugia, setCirugia] = useState<any | null>(null);
  const [otraCirugia, setOtraCirugia] = useState('');
  const [surgeryInputValue, setSurgeryInputValue] = useState('');
  const [nombreCirujano, setNombreCirujano] = useState('');
  const [porcentaje, setPorcentaje] = useState<number>(0);
  const [esCirugia, setEsCirugia] = useState(false);
  const [mostrarErroresCirugia, setMostrarErroresCirugia] = useState(false);
  const [otraCirugiaSeleccionada, setOtraCirugiaSeleccionada] = useState(false);
  const [completionToggles, setCompletionToggles] = useState<Record<string, boolean>>({});
  const [activeToggleKey, setActiveToggleKey] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'complete' | 'edit'>('complete');
  const [adjuntosExistentes, setAdjuntosExistentes] = useState<any[]>([]);
  const [adjuntosEliminados, setAdjuntosEliminados] = useState<string[]>([]);
  const actividadSeleccionada = useMemo(() => {
    if (!selectedProgresoId || selectedActividadIndex === null) return null;
    const progresoActual = progresos.find(p => p._id === selectedProgresoId);
    return progresoActual?.actividades?.[selectedActividadIndex] || null;
  }, [progresos, selectedActividadIndex, selectedProgresoId]);
  const actividadRequiereAdjunto = Boolean(actividadSeleccionada?.requiereAdjunto);
  const [attachmentDownloading, setAttachmentDownloading] = useState<string | null>(null);

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
    const fetchSurgeryTypes = async () => {
      try {
        const res = await api.get('/surgery-types');
        const data = res.data.data || res.data;
        setSurgeryTypes(data);
      } catch (err) {
        console.error('Error cargando tipos de cirugía', err);
      }
    };
    fetchSurgeryTypes();
  }, []);

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

  const handleOpenDialog = (
    progresoId: string,
    index: number,
    toggleKey?: string,
    mode: 'complete' | 'edit' = 'complete'
  ) => {
    setDialogMode(mode);
    setSelectedProgresoId(progresoId);
    setSelectedActividadIndex(index);
    setActiveToggleKey(mode === 'complete' ? toggleKey ?? null : null);

    const progreso = progresos.find(p => p._id === progresoId);
    const actividad = progreso?.actividades?.[index];
    const esCirugiaActividad = actividad?.tipo === 'cirugia';
    setEsCirugia(!!esCirugiaActividad);
    setMostrarErroresCirugia(false);

    const fechaBase = actividad?.fecha || actividad?.fechaRealizacion;
    const fechaInicial = fechaBase
      ? new Date(fechaBase).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setFecha(fechaInicial);

    setComentario(mode === 'edit' ? actividad?.comentariosResidente || '' : '');
    setArchivoError(false);
    setArchivoErrorMsg('');

    if (mode === 'edit' && esCirugiaActividad) {
      if (actividad?.cirugia) {
        setCirugia(actividad.cirugia);
        setSurgeryInputValue(actividad.cirugia.name || '');
        setOtraCirugia('');
        setOtraCirugiaSeleccionada(false);
      } else if (actividad?.otraCirugia) {
        setCirugia(null);
        setOtraCirugia(actividad.otraCirugia);
        setOtraCirugiaSeleccionada(true);
        setSurgeryInputValue(actividad.otraCirugia);
      } else {
        setCirugia(null);
        setOtraCirugia('');
        setOtraCirugiaSeleccionada(false);
        setSurgeryInputValue('');
      }
      setNombreCirujano(actividad?.nombreCirujano || '');
      setPorcentaje(
        typeof actividad?.porcentajeParticipacion === 'number'
          ? actividad.porcentajeParticipacion
          : 0
      );
    } else {
      setCirugia(null);
      setOtraCirugia('');
      setOtraCirugiaSeleccionada(false);
      setSurgeryInputValue('');
      setNombreCirujano('');
      setPorcentaje(0);
    }

    setArchivos([]);
    setAdjuntosEliminados([]);
    setArchivoError(false);
    setArchivoErrorMsg('');
    setAdjuntosExistentes(mode === 'edit' ? actividad?.adjuntos || [] : []);

    setDialogOpen(true);
  };

  const handleToggleComplete = (progresoId: string, index: number, toggleKey: string) => {
    setCompletionToggles(prev => ({ ...prev, [toggleKey]: true }));
    handleOpenDialog(progresoId, index, toggleKey);
  };

  const handleEditActividad = (progresoId: string, index: number) => {
    handleOpenDialog(progresoId, index, undefined, 'edit');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const existentesVisibles = adjuntosExistentes.filter(
      adj => !adjuntosEliminados.includes(adj._id)
    );
    const remainingSlots = MAX_FILES - (existentesVisibles.length + archivos.length);

    if (remainingSlots <= 0) {
      setArchivoError(true);
      setArchivoErrorMsg(t('residentPhases.dialog.maxFilesReached'));
      e.target.value = '';
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);

    const invalidFile = filesToAdd.find(file => file.size > MAX_FILE_SIZE);
    if (invalidFile) {
      setArchivoError(true);
      setArchivoErrorMsg(t('residentPhases.dialog.fileTooLarge'));
      e.target.value = '';
      return;
    }

    if (filesToAdd.length === 0) {
      e.target.value = '';
      return;
    }

    setArchivos(prev => [...prev, ...filesToAdd]);
    setArchivoError(false);
    setArchivoErrorMsg('');
    e.target.value = '';
  };

  const handleRemoveNuevoArchivo = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAdjuntoExistente = (id: string) => {
    setAdjuntosEliminados(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const adjuntosExistentesVisibles = adjuntosExistentes.filter(
    adj => !adjuntosEliminados.includes(adj._id)
  );
  const totalAdjuntosSeleccionados =
    adjuntosExistentesVisibles.length + archivos.length;
  const adjuntosObligatoriosCompletos =
    !actividadRequiereAdjunto || totalAdjuntosSeleccionados > 0;
  const botonConfirmarHabilitado =
    Boolean(selectedProgresoId) &&
    selectedActividadIndex !== null &&
    Boolean(fecha) &&
    !archivoError &&
    adjuntosObligatoriosCompletos;
  const tooltipMessage = (() => {
    if (archivoError) return archivoErrorMsg;
    if (!selectedProgresoId) return t('residentPhases.dialog.missingProgressId');
    if (selectedActividadIndex === null) return t('residentPhases.dialog.noActivitySelected');
    if (!fecha) return t('residentPhases.dialog.selectDate');
    if (esCirugia && !(cirugia || otraCirugia.trim())) return t('residentPhases.dialog.surgeryRequired');
    if (esCirugia && !nombreCirujano.trim()) return t('residentPhases.dialog.surgeonNameRequired');
    if (esCirugia && porcentaje === 0) return t('residentPhases.dialog.participationRequired');
    if (!adjuntosObligatoriosCompletos) return t('residentPhases.dialog.attachmentRequired');
    return actividadRequiereAdjunto
      ? t('residentPhases.dialog.mandatoryFileHint', { max: 5 })
      : t('residentPhases.dialog.optionalFileHint', { max: 5 });
  })();

  const handleCloseDialog = () => {
    setDialogOpen(false);
    if (activeToggleKey) {
      setCompletionToggles(prev => ({ ...prev, [activeToggleKey]: false }));
      setActiveToggleKey(null);
    }
    setCirugia(null);
    setOtraCirugia('');
    setSurgeryInputValue('');
    setNombreCirujano('');
    setPorcentaje(0);
    setEsCirugia(false);
    setOtraCirugiaSeleccionada(false);
    setMostrarErroresCirugia(false);
    setArchivos([]);
    setAdjuntosExistentes([]);
    setAdjuntosEliminados([]);
    setDialogMode('complete');
    setArchivoError(false);
    setArchivoErrorMsg('');
  };



  const handleCompletarActividad = async () => {
    if (!selectedProgresoId || selectedActividadIndex === null) {
      setSnackbarError(true);
      setSnackbarMsg(t('residentPhases.noActivitySelectedError'));
      setSnackbarOpen(true);
      return;
    }
    const progreso = progresos.find(p => p._id === selectedProgresoId);
    const actividad = progreso?.actividades?.[selectedActividadIndex!];
    const esCirugiaActividad = actividad?.tipo === 'cirugia';
    const requiereAdjuntoActividad = Boolean(actividad?.requiereAdjunto);

    if (esCirugiaActividad) {
      setMostrarErroresCirugia(true);
      const otraCirugiaLimpia = otraCirugia.trim();
      const faltaCirugia = !(cirugia || otraCirugiaLimpia);
      const faltaNombreCirujano = !nombreCirujano.trim();
      const faltaPorcentaje = porcentaje === 0;

      if (faltaCirugia || faltaNombreCirujano || faltaPorcentaje) {
        setSnackbarError(true);
        setSnackbarMsg(t('residentPhases.dialog.requiredSurgeryFields'));
        setSnackbarOpen(true);
        return;
      }
    }

    if (requiereAdjuntoActividad && totalAdjuntosSeleccionados === 0) {
      setSnackbarError(true);
      setSnackbarMsg(t('residentPhases.dialog.attachmentRequired'));
      setSnackbarOpen(true);
      return;
    }

    try {
      const form = new FormData();
      form.append('fechaRealizacion', fecha);
      form.append('comentariosResidente', comentario);

      if (esCirugiaActividad) {
        if (cirugia) {
          form.append('cirugia', cirugia._id);
        } else if (otraCirugia.trim()) {
          form.append('otraCirugia', otraCirugia.trim());
        }
        if (nombreCirujano) form.append('nombreCirujano', nombreCirujano);
        form.append('porcentajeParticipacion', String(porcentaje));
      }

      if (adjuntosEliminados.length > 0) {
        form.append('adjuntosAEliminar', JSON.stringify(adjuntosEliminados));
      }

      archivos.forEach(file => {
        form.append('adjunto', file);
      });

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
      handleCloseDialog();
      setArchivos([]);
    }
  };

  const handleDownloadAdjunto = async (adjuntoId: string, nombreArchivo: string) => {
    try {
      setAttachmentDownloading(adjuntoId);
      const res = await api.get(`/adjuntos/${adjuntoId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreArchivo || 'adjunto');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error descargando adjunto:', err);
      setSnackbarError(true);
      setSnackbarMsg(t('residentPhases.downloadAttachmentError'));
      setSnackbarOpen(true);
    } finally {
      setAttachmentDownloading(null);
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

  const handleDescargarInformeCirugias = async (
    progresoId: string,
    nombreFase: string,
  ) => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informe-cirugias/${progresoId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const nombreUsuario = (user as any)?.nombre || (user as any)?.email || 'usuario';
      link.href = url;
      link.setAttribute(
        'download',
        `informe-cirugias-${nombreFase}_${nombreUsuario}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setSnackbarMsg(t('residentProgress.downloadSurgeryReportError'));
      setSnackbarError(true);
      setSnackbarOpen(true);
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

  const residentPhases = progresos.filter((p) => p.faseModel === 'Fase');
  const allValidado =
    residentPhases.length > 0 &&
    residentPhases.every((p) => p.estadoGeneral === 'validado');

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
            Array.isArray(item.actividades) && item.actividades.length > 0 ? (
              <Box
                display="grid"
                gap={2}
                gridTemplateColumns={{ xs: '1fr', lg: '1fr 1fr' }}
                alignItems="stretch"
                sx={{ gridAutoRows: '1fr' }}
              >
                {item.actividades.map((act: any, idx: number) => {
                  const statusData = (() => {
                    switch (act.estado) {
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
                        return {
                          label: t('status.pendiente'),
                          color: 'info' as const,
                          icon: <HourglassEmptyIcon fontSize="small" />
                        };
                      default:
                        return {
                          label: t('status.noCompletada'),
                          color: 'default' as const,
                          icon: undefined
                        };
                    }
                  })();

                  const showCompleteButton =
                    (!act.estado || act.estado === 'pendiente' || act.estado === 'rechazado') &&
                    item.estadoGeneral !== 'bloqueada';

                  const canEditPending =
                    act.estado === 'completado' && item.estadoGeneral !== 'bloqueada';

                  const toggleKey = `${item._id}-${idx}`;

                  const completionDate = act.fecha || act.fechaRealizacion;
                  const validationDate = act.fechaValidacion || act.validadoEl;

                  const statusDate =
                    act.estado === 'validado'
                      ? validationDate
                      : act.estado === 'completado'
                      ? completionDate
                      : null;

                  const formattedStatusDate = statusDate ? formatDayMonthYear(statusDate) : null;

                  const surgeryDetails: Array<{ label: string; value: React.ReactNode }> = [];

                  if (act.tipo === 'cirugia') {
                    if (act.cirugia?.name || act.otraCirugia) {
                      surgeryDetails.push({
                        label: getLabelFromTranslation('residentPhases.surgeryType', { type: placeholderToken }),
                        value: act.cirugia?.name || act.otraCirugia
                      });
                    }

                    if (act.nombreCirujano) {
                      surgeryDetails.push({
                        label: getLabelFromTranslation('residentPhases.surgeonName', { name: placeholderToken }),
                        value: act.nombreCirujano
                      });
                    }

                    if (typeof act.porcentajeParticipacion === 'number') {
                      surgeryDetails.push({
                        label: getLabelFromTranslation('residentPhases.participation', { percent: placeholderToken }),
                        value: `${act.porcentajeParticipacion}%`
                      });
                    }
                  }

                  const renderCommentSection = (
                    label: string,
                    value: React.ReactNode,
                    options?: { color?: string; borderColor?: string }
                  ) => (
                    <Box key={label} sx={{ mt: 2, width: '100%' }}>
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
                          border: `1px solid ${
                            options?.borderColor || theme.palette.divider
                          }`
                        }}
                      >
                        <Typography variant="body2" color={options?.color || 'text.primary'}>
                          {value}
                        </Typography>
                      </Paper>
                    </Box>
                  );

                  return (
                    <Paper
                      key={act._id || idx}
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
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1.5}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {formatActivityType(act.tipo) && (
                            <Chip
                              size="small"
                              label={formatActivityType(act.tipo)}
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                backgroundColor:
                                  theme.palette.mode === 'light'
                                    ? theme.palette.grey[100]
                                    : theme.palette.grey[800],
                                color: theme.palette.text.primary
                              }}
                            />
                          )}
                          {act.requiereAdjunto && (
                            <Chip
                              size="small"
                              color="warning"
                              icon={<AttachFileIcon fontSize="small" />}
                              label={t('residentPhases.requiresAttachment')}
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                            {act.nombre || t('residentPhases.unnamedActivity')}
                          </Typography>
                        </Stack>
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
                          gap={0.5}
                        >
                          <Chip
                            size="small"
                            label={statusData.label}
                            color={statusData.color}
                            icon={statusData.icon}
                            sx={{
                              fontWeight: 600,
                              alignSelf: { xs: 'flex-start', sm: 'flex-end' }
                            }}
                          />
                          {formattedStatusDate && (
                            <Typography variant="caption" color="text.secondary">
                              {formattedStatusDate}
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      <Box sx={{ mt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        {act.comentariosResidente &&
                          renderCommentSection(t('residentPhases.comment'), act.comentariosResidente)}

                        {surgeryDetails.length > 0 && (
                          <Box
                            sx={{
                              mt: act.comentariosResidente ? 2 : 1,
                              display: 'grid',
                              gap: 2,
                              gridTemplateColumns: {
                                xs: '1fr',
                                sm: `repeat(${Math.min(surgeryDetails.length, 3)}, 1fr)`
                              }
                            }}
                          >
                            {surgeryDetails.map((detail, detailIdx) => (
                              <Box key={`${detail.label}-${detailIdx}`}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={600}
                                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                                >
                                  {detail.label}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {detail.value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}

                        {act.comentariosTutor &&
                          renderCommentSection(t('residentPhases.tutorComment'), act.comentariosTutor)}

                        {act.estado === 'rechazado' && act.comentariosRechazo &&
                          renderCommentSection(t('residentPhases.rejectionReason'), act.comentariosRechazo, {
                            color: theme.palette.error.main,
                            borderColor: theme.palette.error.light
                          })}

                        {act.estado === 'completado' && act.adjuntos?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={600}
                              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                            >
                              {t('residentPhases.pendingAttachment')}
                            </Typography>
                            <Stack spacing={1} sx={{ mt: 1 }}>
                              {act.adjuntos.map((adjunto: any) => (
                                <Button
                                  key={adjunto._id}
                                  variant="text"
                                  size="small"
                                  startIcon={
                                    attachmentDownloading === adjunto._id ? (
                                      <CircularProgress size={16} color="inherit" />
                                    ) : (
                                      <DownloadIcon fontSize="small" />
                                    )
                                  }
                                  onClick={() =>
                                    handleDownloadAdjunto(adjunto._id, adjunto.nombreArchivo)
                                  }
                                  disabled={attachmentDownloading === adjunto._id}
                                  sx={{ justifyContent: 'flex-start' }}
                                >
                                  {adjunto.nombreArchivo}
                                </Button>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Box>

                      {(showCompleteButton || canEditPending) && (
                        <Box
                          display="flex"
                          flexDirection={{ xs: 'column', sm: 'row' }}
                          justifyContent={{ xs: 'center', sm: 'flex-end' }}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          gap={2}
                          mt={3}
                        >
                          {showCompleteButton && (
                            <FormControlLabel
                              control={
                                <CompletionSwitch
                                  checked={completionToggles[toggleKey] || false}
                                  onChange={(_, checked) => {
                                    if (checked) {
                                      handleToggleComplete(item._id, idx, toggleKey);
                                    }
                                  }}
                                  inputProps={{
                                    'aria-label': t('residentPhases.markAsCompleted') as string
                                  }}
                                />
                              }
                              label={
                                <Typography variant="body2" fontWeight={600}>
                                  {t('residentPhases.markAsCompleted')}
                                </Typography>
                              }
                              sx={{
                                mx: 0,
                                gap: 1.5,
                                alignSelf: { xs: 'stretch', sm: 'flex-end' },
                                alignItems: 'center',
                                '& .MuiSwitch-root': {
                                  display: 'flex'
                                },
                                '& .MuiFormControlLabel-label': {
                                  color:
                                    theme.palette.mode === 'light'
                                      ? theme.palette.primary.main
                                      : theme.palette.primary.light
                                }
                              }}
                            />
                          )}

                          {canEditPending && (
                            <Button
                              variant="outlined"
                              onClick={() => handleEditActividad(item._id, idx)}
                              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
                            >
                              {t('residentPhases.editActivity')}
                            </Button>
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('residentPhases.noActivities')}
              </Typography>
            )
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('residentPhases.phaseLocked')}
            </Typography>
          )}
          {item.estadoGeneral === 'validado' &&
            item.actividades.some((a: any) => a.tipo === 'cirugia') && (
              <Box textAlign="center" mt={2}>
                <Button
                  variant="contained"
                  onClick={() =>
                    handleDescargarInformeCirugias(
                      item._id,
                      `${t('adminPhases.phase')} ${item.fase?.numero}`,
                    )
                  }
                  disabled={downloadLoading}
                >
                  {t('residentProgress.downloadSurgeryReport', {
                    phase: item.fase?.nombre,
                  })}
                </Button>
              </Box>
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
            color="secondary"
            onClick={handleDescargarCertificado}
            disabled={downloadLoading}
            startIcon={<WorkspacePremiumIcon />}
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




      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogMode === 'edit'
            ? t('residentPhases.dialog.editTitle')
            : t('residentPhases.dialog.title')}
        </DialogTitle>
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
          {esCirugia && (
            <>
              <Autocomplete
                options={surgeryTypes as SurgeryOption[]}
                filterOptions={(options, params) => {
                  const filtered = surgeryFilter(options, params);
                  const trimmed = params.inputValue.trim();
                  const alreadyExists = options.some(
                    (option) =>
                      option.name?.toLowerCase() === trimmed.toLowerCase()
                  );

                  if (trimmed && !alreadyExists) {
                    filtered.push({
                      inputValue: trimmed,
                      _id: 'custom',
                      name: t('residentPhases.dialog.surgeryAddCustom', {
                        value: trimmed
                      })
                    });
                  }

                  return filtered;
                }}
                isOptionEqualToValue={(opt, val) =>
                  typeof val === 'string'
                    ? opt.name === val
                    : opt._id === (val as any)?._id
                }
                getOptionLabel={(option: any) => {
                  if (typeof option === 'string') return option;
                  if (option.inputValue) return option.inputValue;
                  return option.name;
                }}
                value={otraCirugiaSeleccionada ? otraCirugia : cirugia}
                inputValue={surgeryInputValue}
                onChange={(_, value) => {
                  if (typeof value === 'string') {
                    const trimmedValue = value.trim();
                    setCirugia(null);
                    setOtraCirugia(trimmedValue);
                    setOtraCirugiaSeleccionada(!!trimmedValue);
                    setSurgeryInputValue(trimmedValue);
                  } else if (value && (value as SurgeryOption).inputValue) {
                    const customValue = (value as SurgeryOption).inputValue || '';
                    setCirugia(null);
                    setOtraCirugia(customValue);
                    setOtraCirugiaSeleccionada(!!customValue);
                    setSurgeryInputValue(customValue);
                  } else if (!value) {
                    setCirugia(null);
                    setOtraCirugia('');
                    setOtraCirugiaSeleccionada(false);
                    setSurgeryInputValue('');
                  } else {
                    setCirugia(value);
                    setOtraCirugia('');
                    setOtraCirugiaSeleccionada(false);
                    setSurgeryInputValue(value.name || '');
                  }
                }}
                onInputChange={(_, newValue, reason) => {
                  setSurgeryInputValue(newValue);
                  if (otraCirugiaSeleccionada && reason === 'input')
                    setOtraCirugia(newValue);
                }}
                renderOption={(props, option) => {
                  const typedOption = option as SurgeryOption;
                  return (
                    <li
                      {...props}
                      key={
                        typedOption._id ??
                        typedOption.inputValue ??
                        typedOption.name
                      }
                    >
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{typedOption.name}</Typography>
                        {typedOption.inputValue && (
                          <Typography variant="caption" color="text.secondary">
                            {t('residentPhases.dialog.otherSurgeryTooltip')}
                          </Typography>
                        )}
                      </Stack>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('residentPhases.dialog.surgery')}
                    margin="normal"
                    required
                    placeholder={t('residentPhases.dialog.surgeryHelper')}
                    error={
                      mostrarErroresCirugia &&
                      esCirugia &&
                      !(cirugia || otraCirugia.trim())
                    }
                    helperText={
                      mostrarErroresCirugia && esCirugia && !(cirugia || otraCirugia.trim())
                        ? t('residentPhases.dialog.surgeryRequired')
                        : otraCirugiaSeleccionada
                        ? t('residentPhases.dialog.otherSurgeryTooltip')
                        : t('residentPhases.dialog.surgeryHelper')
                    }
                  />
                )}
                fullWidth
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
              />
              <TextField
                label={t('residentPhases.dialog.surgeonName')}
                value={nombreCirujano}
                onChange={(e) => setNombreCirujano(e.target.value)}
                fullWidth
                margin="normal"
                required
                error={mostrarErroresCirugia && esCirugia && !nombreCirujano.trim()}
                helperText={
                  mostrarErroresCirugia && esCirugia && !nombreCirujano.trim()
                    ? t('residentPhases.dialog.surgeonNameRequired')
                    : ''
                }
              />
              <TextField
                select
                label={t('residentPhases.dialog.participation')}
                value={porcentaje}
                onChange={(e) => setPorcentaje(Number(e.target.value))}
                fullWidth
                margin="normal"
                required
                error={mostrarErroresCirugia && esCirugia && porcentaje === 0}
                helperText={
                  mostrarErroresCirugia && esCirugia && porcentaje === 0
                    ? t('residentPhases.dialog.participationRequired')
                    : ''
                }
              >
                {[0, 25, 50, 75, 100].map((val) => (
                  <MenuItem key={val} value={val}>
                    {val}%
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('residentPhases.dialog.requiredFieldsNote')}
              </Typography>
            </>
          )}
          {actividadRequiereAdjunto && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('residentPhases.dialog.attachmentMandatory')}
            </Alert>
          )}
          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            {t('residentPhases.dialog.selectFile')}
            <input
              type="file"
              hidden
              multiple
              accept="application/pdf,image/*"
              onChange={handleFileChange}
            />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {actividadRequiereAdjunto
              ? t('residentPhases.dialog.mandatoryFileHint', { max: 5 })
              : t('residentPhases.dialog.optionalFileHint', { max: 5 })}
          </Typography>

          {adjuntosExistentes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {t('residentPhases.dialog.currentFiles')}
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {adjuntosExistentesVisibles.map(adjunto => (
                  <Paper
                    key={adjunto._id}
                    elevation={0}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderRadius: 1.5,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {adjunto.nombreArchivo}
                    </Typography>
                    <Tooltip title={t('residentPhases.downloadAttachment')}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDownloadAdjunto(adjunto._id, adjunto.nombreArchivo)
                          }
                          disabled={attachmentDownloading === adjunto._id}
                        >
                          {attachmentDownloading === adjunto._id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <DownloadIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t('residentPhases.dialog.removeAttachment')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveAdjuntoExistente(adjunto._id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
                {adjuntosExistentesVisibles.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t('residentPhases.dialog.allMarkedForRemoval')}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          {archivos.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {t('residentPhases.dialog.newAttachments')}
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {archivos.map((file, index) => (
                  <Paper
                    key={`${file.name}-${file.size}-${index}`}
                    elevation={0}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderRadius: 1.5,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {file.name} – {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </Typography>
                    <Tooltip title={t('residentPhases.dialog.removeAttachment')}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveNuevoArchivo(index)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {archivoError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {archivoErrorMsg}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('residentPhases.dialog.cancel')}</Button>
          <Tooltip
            title={tooltipMessage}
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
