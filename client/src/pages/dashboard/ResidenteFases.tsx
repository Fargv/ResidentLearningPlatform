import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, LinearProgress, Alert, List, ListItem, ListItemText, Checkbox, Chip } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ResidenteFases: React.FC = () => {
  const { user } = useAuth();
  const [progresos, setProgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgresos = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/progresoresidentes/${user?._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProgresos(res.data.data);
      } catch (err: any) {
        setError('Error al cargar los progresos del residente');
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) fetchProgresos();
  }, [user]);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mis Fases Formativas</Typography>
      {progresos.map((fase, index) => (
        <Card key={index} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6">Fase {fase.fase?.numero}: {fase.fase?.titulo}</Typography>
            <Chip label={fase.estadoGeneral} color={fase.estadoGeneral === 'validado' ? 'success' : fase.estadoGeneral === 'completado' ? 'primary' : 'default'} sx={{ mt: 1, mb: 2 }} />
            <List>
              {fase.actividades.map((act: any, idx: number) => (
                <ListItem key={idx}>
                  <Checkbox checked={act.completada} disabled />
                  <ListItemText primary={act.nombre} secondary={act.comentariosResidente || ''} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ResidenteFases;
