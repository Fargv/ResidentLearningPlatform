import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../../api';
import PhaseProgressChart from '../../components/PhaseProgressChart';

interface Actividad {
  estado: 'pendiente' | 'completado' | 'rechazado' | 'validado';
}

interface ProgresoFase {
  _id: string;
  fase: { nombre: string };
  estadoGeneral: string;
  actividades: Actividad[];
}

interface Usuario {
  nombre: string;
  apellidos: string;
}

const AdminInformeUsuario: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [progresos, setProgresos] = useState<ProgresoFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get(`/users/${id}`);
        setUsuario(userRes.data.data || userRes.data);

        const progRes = await api.get(`/progreso/residente/${id}`);
        setProgresos(progRes.data.data || progRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar el progreso');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
        Progreso de {usuario?.nombre} {usuario?.apellidos}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {progresos.map((p) => {
          const counts = { pendiente: 0, completado: 0, rechazado: 0, validado: 0 };
          p.actividades.forEach((a) => {
            if (a.estado === 'pendiente') counts.pendiente += 1;
            if (a.estado === 'completado') counts.completado += 1;
            if (a.estado === 'rechazado') counts.rechazado += 1;
            if (a.estado === 'validado') counts.validado += 1;
          });
          return (
            <Paper key={p._id} sx={{ p: 2 }}>
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

export default AdminInformeUsuario;
