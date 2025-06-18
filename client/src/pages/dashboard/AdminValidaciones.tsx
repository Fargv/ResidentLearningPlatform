import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  LinearProgress,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../api';

interface Actividad {
  _id: string;
  nombre: string;
  estado: string;
}

interface Fase {
  _id: string;
  nombre: string;
  estadoGeneral: string;
  actividades: Actividad[];
}

interface ProgresoResidente {
  _id: string;
  residente: {
    _id: string;
    nombre: string;
    apellidos: string;
    hospital?: {
      _id: string;
      nombre: string;
    };
  };
  fases: Fase[];
}

const estadoColors: Record<string, string> = {
  incompleto: 'error.main',
  completado: 'warning.main',
  validado: 'success.main',
};

const AdminValidaciones: React.FC = () => {
  const [progresos, setProgresos] = useState<ProgresoResidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospitales, setHospitales] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    hospital: '',
    estado: '',
    nombre: '',
    search: '',
  });

  const fetchProgresos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/progresos', {
        params: {
          hospital: filtros.hospital,
          estado: filtros.estado,
          nombre: filtros.nombre,
          q: filtros.search,
        },
      });
      setProgresos(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los progresos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cargarHospitales = async () => {
      try {
        const res = await api.get('/hospitals');
        setHospitales(res.data.data || []);
      } catch (e) {
        /* empty */
      }
    };
    cargarHospitales();
    fetchProgresos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [field]: value }));
  };

  const handleActualizarEstadoActividad = async (
    progresoId: string,
    faseId: string,
    actividadId: string,
    estado: string,
  ) => {
    try {
      await api.patch(
        `/admin/progresos/${progresoId}/fase/${faseId}/actividad/${actividadId}`,
        { estado },
      );
      fetchProgresos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleActualizarEstadoFase = async (
    progresoId: string,
    faseId: string,
    estado: string,
  ) => {
    try {
      await api.patch(`/admin/progresos/${progresoId}/fase/${faseId}`, { estado });
      fetchProgresos();
    } catch (e) {
      console.error(e);
    }
  };

  const filtrados = progresos.filter((p) => {
    const coincideHospital =
      !filtros.hospital || p.residente.hospital?._id === filtros.hospital;
    const coincideNombre =
      !filtros.search ||
      `${p.residente.nombre} ${p.residente.apellidos}`
        .toLowerCase()
        .includes(filtros.search.toLowerCase());
    return coincideHospital && coincideNombre;
  });

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Validaciones Administrador
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel id="filtro-hospital-label">Hospital</InputLabel>
          <Select
            labelId="filtro-hospital-label"
            value={filtros.hospital}
            label="Hospital"
            onChange={(e) => handleFiltroChange('hospital', e.target.value)}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            {hospitales.map((h) => (
              <MenuItem key={h._id} value={h._id}>
                {h.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Buscar por nombre"
          size="small"
          value={filtros.search}
          onChange={(e) => handleFiltroChange('search', e.target.value)}
        />
      </Box>

      {filtrados.map((res) => (
        <Accordion key={res._id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              {res.residente.nombre} {res.residente.apellidos} -{' '}
              {res.residente.hospital?.nombre || 'Sin hospital'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {res.fases.map((fase) => (
              <Accordion key={fase._id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography>
                      {fase.nombre}
                    </Typography>
                    <FormControl size="small">
                      <Select
                        value={fase.estadoGeneral}
                        onChange={(e) =>
                          handleActualizarEstadoFase(
                            res._id,
                            fase._id,
                            e.target.value as string,
                          )
                        }
                        sx={{
                          '& .MuiSelect-select': {
                            color: estadoColors[fase.estadoGeneral] || 'inherit',
                          },
                        }}
                      >
                        {['incompleto', 'completado', 'validado'].map((op) => (
                          <MenuItem key={op} value={op}>
                            {op}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {fase.actividades.map((act) => (
                    <Box
                      key={act._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography sx={{ flexGrow: 1 }}>{act.nombre}</Typography>
                      <FormControl size="small">
                        <Select
                          value={act.estado}
                          onChange={(e) =>
                            handleActualizarEstadoActividad(
                              res._id,
                              fase._id,
                              act._id,
                              e.target.value as string,
                            )
                          }
                          sx={{
                            '& .MuiSelect-select': {
                              color: estadoColors[act.estado] || 'inherit',
                            },
                          }}
                        >
                          {['incompleto', 'completado', 'validado'].map((op) => (
                            <MenuItem key={op} value={op}>
                              {op}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default AdminValidaciones;
