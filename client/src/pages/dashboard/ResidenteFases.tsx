import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Alert, List, ListItem, ListItemText, Checkbox, Chip, Skeleton } from '@mui/material';
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
        const response = await axios.get(`/api/progreso/residente/${user._id}`);
        console.log("Respuesta del backend:", response.data);
        setProgresos(response.data.data);
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
  
      {/* 🔍 Panel de depuración */}
      <Box sx={{ mb: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Depuración (progresos):</Typography>
        <pre style={{ maxHeight: 300, overflow: 'auto', fontSize: '0.75rem' }}>
          {JSON.stringify(progresos, null, 2)}
        </pre>
      </Box>
  
      {Array.isArray(progresos) && progresos.length > 0 ? (
        progresos.map((fase, index) => (
          <Card key={index} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">Fase {fase.fase?.numero}: {fase.fase?.nombre}</Typography>
              <Chip
                label={fase.estadoGeneral}
                color={
                  fase.estadoGeneral === 'validado'
                    ? 'success'
                    : fase.estadoGeneral === 'completado'
                    ? 'primary'
                    : 'default'
                }
                sx={{ mt: 1, mb: 2 }}
              />
              <List>
                {Array.isArray(fase.actividades) &&
                  fase.actividades.map((act: any, idx: number) => (
                    <ListItem key={idx}>
                      <Checkbox checked={act.completada} disabled />
                      <ListItemText
                        primary={act.nombre}
                        secondary={act.comentariosResidente || ''}
                      />
                    </ListItem>
                  ))}
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
