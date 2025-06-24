import React, { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
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
  const [formData, setFormData] = useState<Sociedad>({ titulo: '' });

  const fetchSociedades = async () => {
    const res = await api.get('/api/sociedades');
    setSociedades(res.data);
  };

  useEffect(() => {
  fetchSociedades();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const handleOpen = (s?: Sociedad) => {
    setFormData(s || { titulo: '' });
    setOpen(true);
  };

  const handleClose = () => {
    setFormData({ titulo: '' });
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (formData._id) {
      await api.put(`/api/sociedades/${formData._id}`, formData);
    } else {
      await api.post('/api/sociedades', formData);
    }
    fetchSociedades();
    handleClose();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/sociedades/${id}`);
    fetchSociedades();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Gestión de Sociedades</Typography>
      <Button variant="contained" onClick={() => handleOpen()}>Nueva sociedad</Button>
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Convocatoria</TableCell>
            <TableCell>Presentación</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sociedades.map((s) => (
            <TableRow key={s._id}>
              <TableCell>{s.titulo}</TableCell>
              <TableCell>{s.fechaConvocatoria?.slice(0, 10)}</TableCell>
              <TableCell>{s.fechaPresentacion?.slice(0, 10)}</TableCell>
              <TableCell>
                <Button onClick={() => handleOpen(s)}>Editar</Button>
                <Button color="error" onClick={() => handleDelete(s._id!)}>Eliminar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
