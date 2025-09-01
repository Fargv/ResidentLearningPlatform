import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api, { updateProfile, changePassword } from '../../api';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      setFormSuccess(t('profile.messages.updateSuccess'));
    } catch (err: any) {
      setFormError(err.response?.data?.error || t('profile.messages.updateError'));
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
      setPassError(t('profile.messages.passwordMismatch'));
      return;
    }
    try {
      setPassLoading(true);
      setPassError(null);
      await changePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      setPassSuccess(t('profile.messages.passwordUpdateSuccess'));
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPassError(err.response?.data?.error || t('profile.messages.passwordUpdateError'));
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Typography variant="h4" gutterBottom>
        {t('profile.title')}
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('profile.personalData')}
        </Typography>
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <TextField
            name="nombre"
            label={t('profile.fields.name')}
            fullWidth
            margin="normal"
            value={formData.nombre}
            onChange={onChange}
            disabled={formLoading}
            required
          />
          <TextField
            name="apellidos"
            label={t('profile.fields.lastName')}
            fullWidth
            margin="normal"
            value={formData.apellidos}
            onChange={onChange}
            disabled={formLoading}
            required
          />
          <TextField
            name="email"
            label={t('profile.fields.email')}
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={onChange}
            disabled={!isAdmin || formLoading}
            required
          />
          <TextField
            label={t('profile.fields.hospital')}
            fullWidth
            margin="normal"
            value={formData.hospital}
            disabled
          />
          {user?.rol === 'residente' && (
            <TextField
              label={t('profile.fields.tutor')}
              fullWidth
              margin="normal"
              value={user?.tutor ? `${user.tutor.nombre} ${user.tutor.apellidos}` : t('profile.noTutor')}
              disabled
            />
          )}
          {formData.sociedad && (
            <TextField
              label={t('profile.fields.society')}
              fullWidth
              margin="normal"
              value={formData.sociedad}
              disabled={!isAdmin}
            />
          )}
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={formLoading}>
            {formLoading ? t('common.processing') : t('common.saveChanges')}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('profile.changePassword')}
        </Typography>
        {passSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passSuccess}</Alert>}
        {passError && <Alert severity="error" sx={{ mb: 2 }}>{passError}</Alert>}
        <Box component="form" onSubmit={onPassSubmit}>
          <TextField
            name="currentPassword"
            label={t('profile.fields.currentPassword')}
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
            label={t('profile.fields.newPassword')}
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
            label={t('profile.fields.confirmPassword')}
            type="password"
            fullWidth
            margin="normal"
            value={passData.confirmPassword}
            onChange={onPassChange}
            disabled={passLoading}
            required
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={passLoading}>
            {passLoading ? t('common.processing') : t('profile.buttons.changePassword')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Perfil;
