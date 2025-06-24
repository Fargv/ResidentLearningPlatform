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
  TextField
} from '@mui/material';
import api from '../../api';

interface Sociedad {
  _id?: string;
  titulo: string;
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
  const [formData, setFormData] = useState<Sociedad>({
    titulo: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleDelete = async (id: string) => {
    await api.delete(`/sociedades/${id}`);
    fetchSociedades();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Sociedades
        </Typography>
        <Button variant="contained" onClick={() => handleOpen()}>
          Nueva sociedad
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Convocatoria</TableCell>
                <TableCell>Presentación</TableCell>
                <TableCell>Mod. Online</TableCell>
                <TableCell>Simulación</TableCell>
                <TableCell>First Assistant</TableCell>
                <TableCell>Step By Step</TableCell>
                <TableCell>Hand On</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sociedades.map((s) => (
                <TableRow key={s._id} hover>
                  <TableCell>{s.titulo}</TableCell>
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
