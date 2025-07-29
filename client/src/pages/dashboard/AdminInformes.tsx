import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import api from '../../api';
import PhaseProgressChart from '../../components/PhaseProgressChart';

interface Actividad {
  estado: 'pendiente' | 'completado' | 'rechazado' | 'validado';
}

interface Progreso {
  _id: string;
  residente: {
    nombre: string;
    apellidos: string;
    hospital?: { nombre: string } | null;
  };
  fase: { nombre: string };
  estadoGeneral: string;
  actividades: Actividad[];
}

const AdminInformes: React.FC = () => {
  const [data, setData] = useState<Progreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/progreso');
        setData(res.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los informes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <Typography variant="h4" component="h1" gutterBottom>
        Informes de Progreso
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {data.map((p) => {
          const counts = { pendiente: 0, completado: 0, rechazado: 0, validado: 0 };
          p.actividades.forEach((a) => {
            if (a.estado === 'pendiente') counts.pendiente += 1;
            if (a.estado === 'completado') counts.completado += 1;
            if (a.estado === 'rechazado') counts.rechazado += 1;
            if (a.estado === 'validado') counts.validado += 1;
          });
          return (
            <Paper key={p._id} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {p.residente.nombre} {p.residente.apellidos} - {p.fase.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {p.residente.hospital?.nombre || 'Sin hospital'} - {p.estadoGeneral}
              </Typography>
              <PhaseProgressChart
                phaseName={p.fase.nombre}
                pendiente={counts.pendiente}
                completado={counts.completado}
                rechazado={counts.rechazado}
                validado={counts.validado}
              />
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default AdminInformes;
