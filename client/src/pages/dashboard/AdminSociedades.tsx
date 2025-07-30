import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import api from '../../api';
import BackButton from '../../components/BackButton';

interface Sociedad {
  _id?: string;
  titulo: string;
  status?: string;
  fechaConvocatoria?: string;
  fechaPresentacion?: string;
  fechaModulosOnline?: string;
  fechaSimulacion?: string;
  fechaAtividadesFirstAssistant?: string;
  fechaModuloOnlineStepByStep?: string;
  fechaHandOn?: string;
}

const AdminSociedades = () => {
  const [sociedades, setSociedades] = useState<Sociedad[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof Sociedad>('titulo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<Sociedad>({
    titulo: '',
    status: 'ACTIVO',
    fechaConvocatoria: '',
    fechaPresentacion: '',
    fechaModulosOnline: '',
    fechaSimulacion: '',
    fechaAtividadesFirstAssistant: '',
    fechaModuloOnlineStepByStep: '',
    fechaHandOn: ''
  });

  const fetchSociedades = async () => {
    const res = await api.get('/sociedades');
    setSociedades(res.data);
  };

  useEffect(() => {
  fetchSociedades();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const handleOpen = (s?: Sociedad) => {
    if (s) {
      setFormData({
        ...s,
        status: s.status || 'ACTIVO',
        fechaConvocatoria: s.fechaConvocatoria?.slice(0, 10) || '',
        fechaPresentacion: s.fechaPresentacion?.slice(0, 10) || '',
        fechaModulosOnline: s.fechaModulosOnline?.slice(0, 10) || '',
        fechaSimulacion: s.fechaSimulacion?.slice(0, 10) || '',
        fechaAtividadesFirstAssistant: s.fechaAtividadesFirstAssistant?.slice(0, 10) || '',
        fechaModuloOnlineStepByStep: s.fechaModuloOnlineStepByStep?.slice(0, 10) || '',
        fechaHandOn: s.fechaHandOn?.slice(0, 10) || ''
      });
    } else {
      setFormData({
        titulo: '',
        status: 'ACTIVO',
        fechaConvocatoria: '',
        fechaPresentacion: '',
        fechaModulosOnline: '',
        fechaSimulacion: '',
        fechaAtividadesFirstAssistant: '',
        fechaModuloOnlineStepByStep: '',
        fechaHandOn: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      status: 'ACTIVO',
      fechaConvocatoria: '',
      fechaPresentacion: '',
      fechaModulosOnline: '',
      fechaSimulacion: '',
      fechaAtividadesFirstAssistant: '',
      fechaModuloOnlineStepByStep: '',
      fechaHandOn: ''
    });
    setOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<{ name?: string; value: unknown }> | any
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSave = async () => {
    if (formData._id) {
      await api.put(`/sociedades/${formData._id}`, formData);
    } else {
      await api.post('/sociedades', formData);
    }
    fetchSociedades();
    handleClose();
  };

  const handleSort = (field: keyof Sociedad) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/sociedades/${id}`);
    fetchSociedades();
  };

  const displaySociedades = sociedades
    .filter((s) => s.titulo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = (a as any)[sortField] || '';
      const bVal = (b as any)[sortField] || '';
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

 return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Sociedades
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BackButton sx={{ mr: 1 }} />
          <Button variant="contained" onClick={() => handleOpen()}>
            Nueva sociedad
          </Button>
        </Box>
      </Box>

      <TextField
        variant="outlined"
        placeholder="Buscar por Nombre"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort('titulo')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Título
                </TableCell>
                <TableCell
                  onClick={() => handleSort('status')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Estado
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaConvocatoria')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Convocatoria
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaPresentacion')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Presentación
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaModulosOnline')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Mod. Online
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaSimulacion')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Simulación
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaAtividadesFirstAssistant')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  First Assistant
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaModuloOnlineStepByStep')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Step By Step
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaHandOn')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  Hand On
                </TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'primary.light', color: 'common.white' }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displaySociedades.map((s) => (
                <TableRow key={s._id} hover>
                  <TableCell>{s.titulo}</TableCell>
                  <TableCell>{s.status || '-'}</TableCell>
                  <TableCell>{s.fechaConvocatoria?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaPresentacion?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaModulosOnline?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaSimulacion?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaAtividadesFirstAssistant?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaModuloOnlineStepByStep?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaHandOn?.slice(0, 10) || '-'}</TableCell>
                  <TableCell align="right">
                    <Button onClick={() => handleOpen(s)} size="small">
                      Editar
                    </Button>
                    <Button color="error" onClick={() => handleDelete(s._id!)} size="small">
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{formData._id ? 'Editar Sociedad' : 'Nueva Sociedad'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Título"
            name="titulo"
            fullWidth
            value={formData.titulo}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="status-label">Estado</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formData.status}
              label="Estado"
              onChange={handleChange}
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </Select>
          </FormControl>
          {[
            'fechaConvocatoria',
            'fechaPresentacion',
            'fechaModulosOnline',
            'fechaSimulacion',
            'fechaAtividadesFirstAssistant',
            'fechaModuloOnlineStepByStep',
            'fechaHandOn'
          ].map((field) => (
            <TextField
              key={field}
              margin="dense"
              label={field}
              name={field}
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={(formData as any)[field] || ''}
              onChange={handleChange}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSociedades;
