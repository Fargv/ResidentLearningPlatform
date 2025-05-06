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
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);

  useEffect(() => {
    if (!user || !user._id) return;

    const fetchProgresos = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/progreso/residente/${user._id}`);
        setProgresos(response.data.data || []);
      } catch (err: any) {
        console.error("Error cargando progreso:", err);
        setError(err.response?.data?.error || 'Error al cargar el progreso');
      } finally {
        setLoading(false);
      }
    };

    fetchProgresos();
  }, [user]);

  const handleOpenDialog = (progresoId: string, index: number) => {
    setSelectedProgresoId(progresoId);
    setSelectedActividadIndex(index);
    setComentario('');
    setFecha(new Date().toISOString().split('T')[0]);
  
    // Mover el console.log al final para que acceda a los parámetros directamente
    console.log('🧠 DEBUG → progresoId:', progresoId, 'actividadIndex:', index);
  
    setDialogOpen(true);
  };

  const botonConfirmarHabilitado =
  Boolean(selectedProgresoId) &&
  selectedActividadIndex !== null &&
  Boolean(fecha);


  const handleCompletarActividad = async () => {
    console.log('✅ Confirmando actividad:', {
      selectedProgresoId,
      selectedActividadIndex,
      fecha,
      comentario
    });

    if (!selectedProgresoId || selectedActividadIndex === null) {
      setSnackbarError(true);
      setSnackbarMsg('Error interno: No se ha seleccionado ninguna actividad.');
      setSnackbarOpen(true);
      return;
    }

    try {
      const { data } = await axios.put(`${process.env.REACT_APP_API_URL}/progreso/${selectedProgresoId}/actividad/${selectedActividadIndex}`, {
        estado: 'completado',
        fechaRealizacion: fecha,
        comentariosResidente: comentario
      });

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
    console.log('%c🔍 [ResidenteFases] Renderizando progreso item', 'color: cyan; font-weight: bold;', item);

    return (
      <Accordion key={index} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Fase {item.fase?.numero || '—'}: {item.fase?.nombre || 'Sin título'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Chip
            label={item.estadoGeneral || '—'}
            color={
              item.estadoGeneral === 'validado'
                ? 'success'
                : item.estadoGeneral === 'completado'
                ? 'primary'
                : 'default'
            }
            sx={{ mb: 2 }}
          />

          {(() => {
            const total = item.actividades.length;
            const completadas = item.actividades.filter((a: any) => a.completada).length;
            const porcentaje = total ? Math.round((completadas / total) * 100) : 0;
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
                    secondary={act.comentariosResidente || ''}
                  />
                  {act.estado === 'pendiente' && item.estadoGeneral !== 'bloqueada' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        console.log(
                          '%c📦 [ResidenteFases] handleOpenDialog → item._id:',
                          'color: lime; font-weight: bold;',
                          item._id,
                          'idx:',
                          idx
                        );
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
