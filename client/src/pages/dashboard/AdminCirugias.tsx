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
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../api';
import BackButton from '../../components/BackButton';
import { useTranslation } from 'react-i18next';

interface SurgeryType {
  _id?: string;
  name: string;
}

const defaultData: SurgeryType = { name: '' };

const AdminCirugias: React.FC = () => {
  const [types, setTypes] = useState<SurgeryType[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SurgeryType | null>(null);
  const [formData, setFormData] = useState<SurgeryType>(defaultData);
  const { t } = useTranslation();

  const fetchTypes = async () => {
    const res = await api.get('/surgery-types');
    setTypes(res.data.data || res.data);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpen = (type?: SurgeryType) => {
    if (type) {
      setSelected(type);
      setFormData({ name: type.name });
    } else {
      setSelected(null);
      setFormData(defaultData);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSave = async () => {
    if (selected && selected._id) {
      await api.put(`/surgery-types/${selected._id}`, formData);
    } else {
      await api.post('/surgery-types', formData);
    }
    await fetchTypes();
    setOpen(false);
  };

  const handleDelete = async (type: SurgeryType) => {
    await api.delete(`/surgery-types/${type._id}`);
    await fetchTypes();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Procedimientos Quirúrgicos
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BackButton sx={{ mr: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Nuevo Procedimiento
          </Button>
        </Box>
      </Box>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {types.map((t) => (
                <TableRow key={t._id || t.name} hover>
                  <TableCell>{t.name}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpen(t)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(t)} size="small">
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
        <DialogTitle>{selected ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>
            {selected ? t('common.saveChanges') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCirugias;
