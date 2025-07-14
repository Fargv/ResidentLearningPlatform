import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api, { updateProfile, changePassword } from '../../api';

interface ProfileForm {
  nombre: string;
  apellidos: string;
  email: string;
  hospital: string;
  sociedad: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Perfil: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileForm>({
    nombre: '',
    apellidos: '',
    email: '',
    hospital: '',
    sociedad: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [passData, setPassData] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const isAdmin = user?.rol === 'administrador';

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        hospital: user.hospital?.nombre || '',
        sociedad: ''
      }));
      if ((user as any).sociedad) {
        api.get(`/sociedades/${(user as any).sociedad}`)
          .then(res => {
            const data = res.data.data || res.data;
            setFormData(f => ({ ...f, sociedad: data.titulo }));
          })
          .catch(() => { /* ignorar error */ });
      }
    }
  }, [user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);
      await updateProfile({
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email
      });
      setFormSuccess('Perfil actualizado');
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setFormLoading(false);
    }
  };

  const onPassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassData(prev => ({ ...prev, [name]: value }));
  };

  const onPassSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      setPassError('Las contraseñas no coinciden');
      return;
    }
    try {
      setPassLoading(true);
      setPassError(null);
      await changePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      setPassSuccess('Contraseña actualizada');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPassError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Datos personales
        </Typography>
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <TextField
            name="nombre"
            label="Nombre"
            fullWidth
            margin="normal"
            value={formData.nombre}
            onChange={onChange}
            disabled={formLoading}
            required
          />
          <TextField
            name="apellidos"
            label="Apellidos"
            fullWidth
            margin="normal"
            value={formData.apellidos}
            onChange={onChange}
            disabled={formLoading}
            required
          />
          <TextField
            name="email"
            label="Email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={onChange}
            disabled={!isAdmin || formLoading}
            required
          />
          <TextField
            label="Hospital"
            fullWidth
            margin="normal"
            value={formData.hospital}
            disabled
          />
          {formData.sociedad && (
            <TextField
              label="Sociedad"
              fullWidth
              margin="normal"
              value={formData.sociedad}
              disabled={!isAdmin}
            />
          )}
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cambiar Contraseña
        </Typography>
        {passSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passSuccess}</Alert>}
        {passError && <Alert severity="error" sx={{ mb: 2 }}>{passError}</Alert>}
        <Box component="form" onSubmit={onPassSubmit}>
          <TextField
            name="currentPassword"
            label="Contraseña Actual"
            type="password"
            fullWidth
            margin="normal"
            value={passData.currentPassword}
            onChange={onPassChange}
            disabled={passLoading}
            required
          />
          <TextField
            name="newPassword"
            label="Nueva Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={passData.newPassword}
            onChange={onPassChange}
            disabled={passLoading}
            required
          />
          <TextField
            name="confirmPassword"
            label="Confirmar Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={passData.confirmPassword}
            onChange={onPassChange}
            disabled={passLoading}
            required
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={passLoading}>
            {passLoading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Perfil;
