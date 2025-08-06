
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, LinearProgress, Alert, Snackbar
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const FormadorUsuarios: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editar, setEditar] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellidos: '',
    rol: 'residente',
    hospital: user?.hospital?._id || ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const fetchUsuarios = useCallback(async () => {
    if (!user?.hospital?._id) return;
    try {
      const res = await api.get(`/users/hospital/${user.hospital._id}`);
      setUsuarios(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('trainerUsers.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.hospital?._id, t]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as string]: value });
  };

  const handleSubmit = async () => {
    try {
      setProcesando(true);
      

      if (editar && selected) {
        const res = await api.put(`/users/${selected._id}`, formData);
        setUsuarios(usuarios.map(u => u._id === selected._id ? res.data.data : u));
      } else {
        const res = await api.post('/users/invite', formData);
        setUsuarios([...usuarios, res.data.data]);
      }

      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: editar ? t('trainerUsers.updated') : t('trainerUsers.invited'),
        severity: 'success'
      });

    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('trainerUsers.error'),
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleDelete = async (usuarioId: string) => {
    try {
      setProcesando(true);
      await api.delete(`/users/${usuarioId}`);

      setUsuarios(usuarios.filter(u => u._id !== usuarioId));
      setSnackbar({
        open: true,
        message: t('trainerUsers.deleted'),
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('trainerUsers.deleteError'),
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('trainerUsers.title')}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditar(false);
            setFormData({
              email: '',
              nombre: '',
              apellidos: '',
              rol: 'residente',
              hospital: user?.hospital?._id || ''
            });
            setOpenDialog(true);
          }}
        >
          {t('trainerUsers.invite')}
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('trainerUsers.table.name')}</TableCell>
                <TableCell>{t('trainerUsers.table.email')}</TableCell>
                <TableCell>{t('trainerUsers.table.role')}</TableCell>
                <TableCell>{t('trainerUsers.table.status')}</TableCell>
                <TableCell align="right">{t('trainerUsers.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map(usuario => (
                <TableRow key={usuario._id}>
                  <TableCell>{usuario.nombre} {usuario.apellidos}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(
                        usuario.activo
                          ? 'trainerUsers.states.active'
                          : 'trainerUsers.states.inactive'
                      )}
                      color={usuario.activo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => {
                      setEditar(true);
                      setSelected(usuario);
                      setFormData({
                        email: usuario.email,
                        nombre: usuario.nombre,
                        apellidos: usuario.apellidos,
                        rol: usuario.rol,
                        hospital: usuario.hospital?._id || ''
                      });
                      setOpenDialog(true);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(usuario._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{t(editar ? 'trainerUsers.edit' : 'trainerUsers.invite')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label={t('trainerUsers.form.email')} name="email" value={formData.email} onChange={handleChange} />
          <TextField fullWidth margin="dense" label={t('trainerUsers.form.name')} name="nombre" value={formData.nombre} onChange={handleChange} />
          <TextField fullWidth margin="dense" label={t('trainerUsers.form.surname')} name="apellidos" value={formData.apellidos} onChange={handleChange} />
          <TextField
            select
            fullWidth
            margin="dense"
            label={t('trainerUsers.form.role')}
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            slotProps={{ select: { native: true } }}
          >
            <option value="residente">{t('trainerUsers.form.roles.resident')}</option>
            <option value="formador">{t('trainerUsers.form.roles.trainer')}</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('trainerUsers.dialog.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={procesando}>
            {procesando ? t('trainerUsers.dialog.saving') : editar ? t('trainerUsers.dialog.save') : t('trainerUsers.dialog.invite')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FormadorUsuarios;

