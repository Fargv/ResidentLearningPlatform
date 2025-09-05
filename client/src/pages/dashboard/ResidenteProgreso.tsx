import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Paper, Button, CircularProgress, Backdrop } from '@mui/material';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import PhaseProgressChart from '../../components/PhaseProgressChart';
import { useTranslation } from 'react-i18next';

interface Actividad {
  estado: 'pendiente' | 'completado' | 'rechazado' | 'validado';
  tipo?: string;
}

interface ProgresoFase {
  _id: string;
  fase: {
    _id: string;
    nombre: string;
    numero?: number;
  };
  faseModel: string;
  estadoGeneral: string;
  actividades: Actividad[];
}

const ResidenteProgreso: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [progresos, setProgresos] = useState<ProgresoFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

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
  }, [user, t]);

  const handleDescargarCertificado = async () => {
    if (!user?._id) return;
    setDownloadLoading(true);
    try {
      const res = await api.get(`/certificado/${user._id}?lang=${i18n.language}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificado.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error || t('residentProgress.downloadError'));
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDescargarInformeCirugias = async (
    progresoId: string,
    nombreFase: string,
  ) => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informe-cirugias/${progresoId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const nombreUsuario = (user as any)?.nombre || (user as any)?.email || 'usuario';
      link.href = url;
      link.setAttribute(
        'download',
        `informe-cirugias-${nombreFase}_${nombreUsuario}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(t('residentProgress.downloadSurgeryReportError'));
    } finally {
      setDownloadLoading(false);
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

  const filteredProgresos = progresos.filter(p => p.faseModel === 'Fase');
  const phaseStats = filteredProgresos.map(p => {
    const counts = { pendiente: 0, completado: 0, rechazado: 0, validado: 0 };
    p.actividades.forEach(a => {
      if (a.estado === 'pendiente') counts.pendiente += 1;
      if (a.estado === 'completado') counts.completado += 1;
      if (a.estado === 'rechazado') counts.rechazado += 1;
      if (a.estado === 'validado') counts.validado += 1;
    });
    const hasSurgery = p.actividades.some(a => a.tipo === 'cirugia');
    return {
      progresoId: p._id,
      faseNombre: p.fase.nombre,
      faseNumero: p.fase.numero,
      estadoGeneral: p.estadoGeneral,
      counts,
      hasSurgery,
    };
  });

  const allValidado = filteredProgresos.every(p => p.estadoGeneral === 'validado');

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('residentProgress.title')}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {phaseStats.map(p => (
          <Paper key={p.progresoId} sx={{ p: 2 }}>
            <PhaseProgressChart
              phaseName={p.faseNombre}
              pendiente={p.counts.pendiente}
              completado={p.counts.completado}
              rechazado={p.counts.rechazado}
              validado={p.counts.validado}
            />
            {p.estadoGeneral === 'validado' && p.hasSurgery && (
              <Box textAlign="center" mt={2}>
                <Button
                  variant="contained"
                  onClick={() =>
                    handleDescargarInformeCirugias(
                      p.progresoId,
                      `${t('adminPhases.phase')} ${p.faseNumero}`,
                    )
                  }
                  disabled={downloadLoading}
                >
                  {t('residentProgress.downloadSurgeryReport', {
                    phase: p.faseNombre,
                  })}
                </Button>
              </Box>
            )}
          </Paper>
        ))}
      </Box>
      {allValidado && (
        <Box textAlign="center" mt={2}>
          <Button variant="contained" onClick={handleDescargarCertificado} disabled={downloadLoading}>
            {t('residentProgress.downloadCertificate')}
          </Button>
        </Box>
      )}
      <Backdrop open={downloadLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default ResidenteProgreso;
