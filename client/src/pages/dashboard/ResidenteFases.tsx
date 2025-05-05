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
  AccordionDetails
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

  useEffect(() => {
    if (!user?._id) return;

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
        progresos.map((item, index) => (
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
                      {act.estado === 'pendiente' && <HourglassEmptyIcon sx={{ color: 'gray', mr: 1 }} />}
                      {act.estado === 'rechazado' && <CancelIcon sx={{ color: 'red', mr: 1 }} />}
                      <ListItemText
                        primary={act.nombre || 'Actividad sin nombre'}
                        secondary={act.comentariosResidente || ''}
                      />
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
        ))
      ) : (
        <Alert severity="info">No hay progreso formativo disponible.</Alert>
      )}
    </Box>
  );
};

export default ResidenteFases;