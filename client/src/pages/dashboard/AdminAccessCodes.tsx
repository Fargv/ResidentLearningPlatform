import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../api';
import { SelectChangeEvent } from '@mui/material/Select';

interface AccessCode {
  _id?: string;
  codigo: string;
  rol: string;
  tipo: string;
}

const defaultData: AccessCode = {
  codigo: '',
  rol: 'residente',
  tipo: 'Programa Residentes'
};

const AdminAccessCodes: React.FC = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AccessCode | null>(null);
  const [formData, setFormData] = useState<AccessCode>(defaultData);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/access-codes');
      setCodes(res.data.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los códigos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleOpen = (code?: AccessCode) => {
    if (code) {
      setSelected(code);
      setFormData({ codigo: code.codigo, rol: code.rol, tipo: code.tipo });
    } else {
      setSelected(null);
      setFormData(defaultData);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
  setFormData({
    ...formData,
    [event.target.name as keyof AccessCode]: event.target.value,
  });
};

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setFormData({
    ...formData,
    [event.target.name as keyof AccessCode]: event.target.value,
  });
};

  const handleSave = async () => {
    try {
      if (selected && selected._id) {
        await api.put(`/access-codes/${selected._id}`, formData);
      } else {
        await api.post('/access-codes', formData);
      }
      await fetchCodes();
      setOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el código');
    }
  };

  const handleDelete = async (code: AccessCode) => {
    try {
      await api.delete(`/access-codes/${code._id}`);
      await fetchCodes();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar el código');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Códigos de Acceso
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Nuevo Código
        </Button>
      </Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Programa</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c._id || c.codigo} hover>
                  <TableCell>{c.codigo}</TableCell>
                  <TableCell>{c.rol}</TableCell>
                  <TableCell>{c.tipo}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpen(c)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(c)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selected ? 'Editar Código' : 'Nuevo Código'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="codigo"
            label="Código"
            type="text"
            fullWidth
            value={formData.codigo}
            onChange={handleInputChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="rol-label">Rol</InputLabel>
            <Select
              labelId="rol-label"
              id="rol"
              name="rol"
              value={formData.rol}
              label="Rol"
              onChange={handleSelectChange}
            >
              <MenuItem value="residente">Residente</MenuItem>
              <MenuItem value="formador">Formador</MenuItem>
              <MenuItem value="coordinador">Coordinador</MenuItem>
              <MenuItem value="alumno">Alumno</MenuItem>
              <MenuItem value="instructor">Instructor</MenuItem>
              <MenuItem value="administrador">Administrador</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel id="tipo-label">Programa</InputLabel>
            <Select
              labelId="tipo-label"
              id="tipo"
              name="tipo"
              value={formData.tipo}
              label="Programa"
              onChange={handleSelectChange}
            >
              <MenuItem value="Programa Residentes">Programa Residentes</MenuItem>
              <MenuItem value="Programa Sociedades">Programa Sociedades</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAccessCodes;
