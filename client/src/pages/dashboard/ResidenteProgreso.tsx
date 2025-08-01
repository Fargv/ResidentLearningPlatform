import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Paper, Button, CircularProgress } from '@mui/material';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import PhaseProgressChart from '../../components/PhaseProgressChart';
import { useTranslation } from 'react-i18next';

interface Actividad {
  estado: 'pendiente' | 'completado' | 'rechazado' | 'validado';
}

interface ProgresoFase {
  _id: string;
  fase: {
    _id: string;
    nombre: string;
  };
  estadoGeneral: string;
  actividades: Actividad[];
}

const ResidenteProgreso: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [progresos, setProgresos] = useState<ProgresoFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get(`/progreso/residente/${user._id}`);
        setProgresos(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || t('residentProgress.errorLoad'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDescargarCertificado = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/certificado/${user._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificado.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error || t('residentProgress.downloadError'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;

  const phaseStats = progresos.map(p => {
    const counts = { pendiente: 0, completado: 0, rechazado: 0, validado: 0 };
    p.actividades.forEach(a => {
      if (a.estado === 'pendiente') counts.pendiente += 1;
      if (a.estado === 'completado') counts.completado += 1;
      if (a.estado === 'rechazado') counts.rechazado += 1;
      if (a.estado === 'validado') counts.validado += 1;
    });
    return { faseNombre: p.fase.nombre, estadoGeneral: p.estadoGeneral, counts };
  });

  const allValidado = phaseStats.every(p => p.estadoGeneral === 'validado');

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('residentProgress.title')}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {phaseStats.map(p => (
          <Paper key={p.faseNombre} sx={{ p: 2 }}>
            <PhaseProgressChart
              phaseName={p.faseNombre}
              pendiente={p.counts.pendiente}
              completado={p.counts.completado}
              rechazado={p.counts.rechazado}
              validado={p.counts.validado}
            />
          </Paper>
        ))}
      </Box>
      {allValidado && (
        <Box textAlign="center" mt={2}>
          <Button variant="contained" onClick={handleDescargarCertificado}>
            {t('residentProgress.downloadCertificate')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ResidenteProgreso;
