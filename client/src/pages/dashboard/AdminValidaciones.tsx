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
  Button,
  TextField,
  LinearProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../api';

interface Actividad {
  nombre: string;
  estado: string;
}

interface Fase {
  _id: string;
  fase: {
    _id: string;
    nombre: string;
    numero: number;
  };
  estadoGeneral: string;
  actividades: Actividad[];
}

interface Usuario {
  _id: string;
  nombre: string;
  apellidos: string;
  activo: boolean;
  hospital?: {
    _id: string;
    nombre: string;
  };
}

const estadoColors: Record<string, string> = {
  pendiente: 'warning.main',
  completado: 'info.main',
  validado: 'success.main',
  rechazado: 'error.main',
  'en progreso': 'info.main',
  bloqueada: 'error.main',
};

const AdminValidaciones: React.FC = () => {
  const [residentes, setResidentes] = useState<Usuario[]>([]);
  const [selected, setSelected] = useState<Usuario | null>(null);
  const [progreso, setProgreso] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarResidentes = async () => {
      try {
        const res = await api.get('/users');
        const activos = (res.data.data || []).filter(
          (u: any) => u.rol === 'residente' && u.activo,
        );
        setResidentes(activos);
      } catch (e: any) {
        setError(e.response?.data?.error || 'Error al cargar usuarios');
      }
    };
    cargarResidentes();
  }, []);

  const fetchProgreso = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/progreso/residente/${id}`);
      setProgreso(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al cargar progreso');
    } finally {
      setLoading(false);
    }
  };

  const handleResidenteChange = (_: any, value: Usuario | null) => {
    setSelected(value);
    setProgreso([]);
    if (value) fetchProgreso(value._id);
  };

  const actualizarActividad = async (
    progresoId: string,
    index: number,
    estado: string,
  ) => {
    try {
      await api.post('/admin/cambiar-estado-actividad', {
        progresoId,
        index,
        estado,
      });
      if (selected) fetchProgreso(selected._id);
    } catch (e) {
      console.error(e);
    }
  };

  const actualizarFase = async (progresoId: string, estadoGeneral: string) => {
    try {
      await api.post('/admin/cambiar-estado-fase', { progresoId, estadoGeneral });
      if (selected) fetchProgreso(selected._id);
    } catch (e) {
      console.error(e);
    }
  };

  const crearProgreso = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      await api.post(`/progreso/crear/${selected._id}`);
      fetchProgreso(selected._id);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al crear progreso');
    } finally {
      setLoading(false);
    }
  };

  const faseInconsistente = (fase: Fase) =>
    fase.estadoGeneral === 'validado' &&
    fase.actividades.some((a) => a.estado !== 'validado');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Panel de Validaciones
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Autocomplete
        options={residentes}
        value={selected}
        onChange={handleResidenteChange}
        getOptionLabel={(option) =>
          `${option.nombre} ${option.apellidos} - ${option.hospital?.nombre || ''}`
        }
        renderInput={(params) => <TextField {...params} label="Buscar residente" />}
        sx={{ maxWidth: 350, mb: 2 }}
        isOptionEqualToValue={(o, v) => o._id === v._id}
      />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && !selected && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Seleccione un residente para ver su progreso
        </Typography>
      )}
      {!loading && selected && progreso.length === 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            No hay información de progreso para este residente
          </Typography>
          <Button variant="contained" onClick={crearProgreso}>
            Crear progreso formativo
          </Button>
        </Box>
      )}
      {progreso.map((fase) => (
        <Accordion
          key={fase._id}
          sx={{
            mb: 2,
            border: faseInconsistente(fase) ? '1px solid red' : undefined,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: '100%' }}>
              <Typography sx={{ flexGrow: 1 }}>
                Fase {fase.fase.numero}: {fase.fase.nombre}
              </Typography>
              <FormControl
                size="small"
                disabled={selected ? !selected.activo || fase.estadoGeneral !== 'en progreso' : true}
              >
                <Select
                  value={fase.estadoGeneral}
                  onChange={(e) =>
                    actualizarFase(fase._id, e.target.value as string)
                  }
                  sx={{ '& .MuiSelect-select': { color: estadoColors[fase.estadoGeneral] } }}
                >
                  {['bloqueada', 'en progreso', 'completado', 'validado'].map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {fase.actividades.map((act, index) => (
              <Box
                key={index}
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
              >
                <Typography sx={{ flexGrow: 1 }}>{act.nombre}</Typography>
                <FormControl
                  size="small"
                  disabled={selected ? !selected.activo || fase.estadoGeneral !== 'en progreso' : true}
                >
                  <Select
                    value={act.estado}
                    onChange={(e) =>
                      actualizarActividad(fase._id, index, e.target.value as string)
                    }
                    sx={{ '& .MuiSelect-select': { color: estadoColors[act.estado] } }}
                  >
                    {['pendiente', 'completado', 'validado', 'rechazado'].map((op) => (
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
    </Box>
  );
};

export default AdminValidaciones;
