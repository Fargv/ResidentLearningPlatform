import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Chip,
  Skeleton
} from '@mui/material';
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
          <Card key={index} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">
                Fase {item.fase?.numero || '—'}: {item.fase?.nombre || 'Sin título'}
              </Typography>
              <Chip
                label={item.estadoGeneral || '—'}
                color={
                  item.estadoGeneral === 'validado'
                    ? 'success'
                    : item.estadoGeneral === 'completado'
                    ? 'primary'
                    : 'default'
                }
                sx={{ mt: 1, mb: 2 }}
              />
              <List>
                {Array.isArray(item.actividades) && item.actividades.length > 0 ? (
                  item.actividades.map((act: any, idx: number) => (
                    <ListItem key={idx}>
                      <Checkbox checked={act.completada} disabled />
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
            </CardContent>
          </Card>
        ))
      ) : (
        <Alert severity="info">No hay progreso formativo disponible.</Alert>
      )}
    </Box>
  );
};

export default ResidenteFases;