import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../api';
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

const AdminProgresoDetalle: React.FC = () => {
  const { userId } = useParams();
  const [progresos, setProgresos] = useState<ProgresoFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/progreso/residente/${userId}`);
        setProgresos(res.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar el progreso');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

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
      <Typography variant="h4" gutterBottom>
        Progreso del Usuario
      </Typography>
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
