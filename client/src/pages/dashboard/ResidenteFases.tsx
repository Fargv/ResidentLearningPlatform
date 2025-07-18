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
  Tooltip 
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

const ResidenteFases: React.FC = () => {
  const { user } = useAuth();
  const [progresos, setProgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProgresoId, setSelectedProgresoId] = useState<string | null>(null);
  const [selectedActividadIndex, setSelectedActividadIndex] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [fecha, setFecha] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);
  const [sociedadInfo, setSociedadInfo] = useState<Sociedad | null>(null);

  const dateFieldMap: Record<number, keyof Sociedad> = {
    1: 'fechaConvocatoria',
    2: 'fechaPresentacion',
    3: 'fechaModulosOnline',
    4: 'fechaSimulacion',
    5: 'fechaAtividadesFirstAssistant',
    6: 'fechaModuloOnlineStepByStep',
    7: 'fechaHandOn'
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


  useEffect(() => {
    if (!user || !user._id) return;
  
    const fetchProgresos = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/progreso/residente/${user._id}`);
        const data = response.data.data || [];
  
      // (debug) Aquí se listaban los progresos recibidos

        setProgresos(data);
      } catch (err: any) {
        console.error("Error cargando progreso:", err);
        setError(err.response?.data?.error || 'Error al cargar el progreso');
      } finally {
        setLoading(false);
      }
    };
  
    fetchProgresos();
  }, [user]);

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
  
    // Mover el console.log al final para que acceda a los parámetros directamente
  
    setDialogOpen(true);
  };

  const botonConfirmarHabilitado =
  Boolean(selectedProgresoId) &&
  selectedActividadIndex !== null &&
  Boolean(fecha);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    } else {
      setArchivo(null);
    }
  };


  const handleCompletarActividad = async () => {
    
    if (!selectedProgresoId || selectedActividadIndex === null) {
      setSnackbarError(true);
      setSnackbarMsg('Error interno: No se ha seleccionado ninguna actividad.');
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
        setSnackbarMsg('No se pudo completar la actividad.');
        setSnackbarOpen(true);
        return;
      }

      setProgresos(prev =>
        prev.map((prog) =>
          prog._id === selectedProgresoId ? data.data : prog
        )
      );

      setSnackbarError(false);
      setSnackbarMsg('✅ Actividad registrada con éxito');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error actualizando actividad:', err);
      setSnackbarError(true);
      setSnackbarMsg('Error al guardar la actividad.');
      setSnackbarOpen(true);
    } finally {
      setDialogOpen(false);
      setArchivo(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Mis Fases Formativas</Typography>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mis Fases Formativas</Typography>
      
      {Array.isArray(progresos) && progresos.length > 0 ? (
  progresos.map((item, index) => {

    return (
      <Accordion key={item._id} defaultExpanded={item.estadoGeneral === 'en progreso'}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Fase {item.fase?.numero || '—'}: {item.fase?.nombre || 'Sin título'}
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
              label={item.estadoGeneral || '—'}
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
                Fecha límite: {getSociedadDateShort(item.fase.numero)}
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
                  Progreso validado: {porcentaje}%
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
  primary={act.nombre || 'Actividad sin nombre'}
  secondary={
    <>
      {act.comentariosResidente && (
        <Typography variant="body2" color="text.secondary">
          Comentario: {act.comentariosResidente}
        </Typography>
      )}
      {act.fecha && (
        <Typography variant="body2" color="text.secondary">
          Fecha completada: {formatDayMonthYear(act.fecha)}
        </Typography>
      )}
       {act.comentariosFormador && (
        <Typography variant="body2" color="text.secondary">
          Comentario formador: {act.comentariosFormador}
        </Typography>
      )}
      {act.estado === 'rechazado' && act.comentariosRechazo && (
        <Typography variant="body2" color="error">
          Motivo rechazo: {act.comentariosRechazo}
        </Typography>
      )}
      {act.fechaValidacion && (
        <Typography variant="body2" color="text.secondary">
          Validado el: {formatDayMonthYear(act.fechaValidacion)}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
  Estado: {
    act.estado === 'validado' ? 'Validado' :
    act.estado === 'rechazado' ? 'Rechazado' :
    act.estado === 'completado' ? 'Pendiente de validación' :
    'No completada'
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
                      Marcar como completada
                    </Button>
                  )}
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No hay actividades disponibles" />
                </ListItem>
              )}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Fase bloqueada
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    );
  })
) : (
  <Alert severity="info">No hay progreso formativo disponible.</Alert>
)}



      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Marcar actividad como completada</DialogTitle>
        <DialogContent>
          <TextField
            label="Fecha de realización"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            Seleccionar archivo
            <input
              type="file"
              hidden
              accept="application/pdf,image/png,image/jpeg"
              onChange={handleFileChange}
            />
          </Button>
          <Typography variant="caption" color="text.secondary">
    progresoId: {selectedProgresoId || '—'} | actividadIndex: {selectedActividadIndex ?? '—'}
  </Typography>
        </DialogContent>
        <DialogActions>
  <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
  <Tooltip
  title={
    !selectedProgresoId
      ? 'Falta el ID del progreso'
      : selectedActividadIndex === null
      ? 'No se ha seleccionado ninguna actividad'
      : !fecha
      ? 'Selecciona una fecha de realización'
      : ''
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
      Confirmar
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
