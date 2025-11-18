import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
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
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const isAdmin = user?.rol === 'administrador';

  const hydrateFormFromUser = useCallback(() => {
    if (!user) return;

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
  }, [user]);

  useEffect(() => {
    hydrateFormFromUser();
  }, [hydrateFormFromUser]);

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
      setIsEditing(false);
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
      setIsPasswordDialogOpen(false);
    } catch (err: any) {
      setPassError(err.response?.data?.error || t('profile.messages.passwordUpdateError'));
    } finally {
      setPassLoading(false);
    }
  };

  const initials = useMemo(() => {
    const first = formData.nombre?.[0] || '';
    const last = formData.apellidos?.[0] || '';
    return `${first}${last}`.toUpperCase() || '?';
  }, [formData.apellidos, formData.nombre]);

  const completionScore = useMemo(() => {
    const fieldsToCheck = [
      formData.nombre,
      formData.apellidos,
      formData.email,
      formData.hospital,
      user?.zona,
      user?.especialidad,
      formData.sociedad
    ];
    const filled = fieldsToCheck.filter(Boolean).length;
    return Math.round((filled / fieldsToCheck.length) * 100);
  }, [formData.apellidos, formData.email, formData.hospital, formData.nombre, formData.sociedad, user?.especialidad, user?.zona]);

  const statusChips = useMemo(() => [
    { key: 'role', label: t('profile.status.role'), value: user?.rol || t('common.none') },
    { key: 'hospital', label: t('profile.status.hospital'), value: formData.hospital || t('common.none') },
    { key: 'program', label: t('profile.status.program'), value: (user as any)?.tipo || t('common.none') },
    { key: 'zone', label: t('profile.status.zone'), value: user?.zona || t('common.none') },
    { key: 'specialty', label: t('profile.status.specialty'), value: user?.especialidad || t('common.none') }
  ], [formData.hospital, t, (user as any)?.tipo, user?.especialidad, user?.rol, user?.zona]);

  const handleOpenPasswordDialog = () => {
    setPassError(null);
    setPassSuccess(null);
    setIsPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPassError(null);
    setPassLoading(false);
    setIsPasswordDialogOpen(false);
  };

  const handleStartEdit = () => {
    setFormSuccess(null);
    setFormError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    hydrateFormFromUser();
    setIsEditing(false);
  };

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Typography variant="h4" gutterBottom>
        {t('profile.title')}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 56, height: 56 }}>
                {initials}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {`${formData.nombre} ${formData.apellidos}`.trim() || t('profile.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">{formData.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    color={user?.activo === false ? 'default' : 'success'}
                    label={user?.activo === false ? t('profile.status.inactive') : t('profile.status.active')}
                  />
                  <Chip size="small" variant="outlined" label={statusChips[0].value} />
                </Stack>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              {t('profile.overview')}
            </Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {statusChips.map(chip => (
                <Chip key={chip.key} label={`${chip.label}: ${chip.value}`} variant="outlined" sx={{ width: 'fit-content' }} />
              ))}
            </Stack>

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
              {t('profile.completeness.title')}
            </Typography>
            <LinearProgress value={completionScore} variant="determinate" sx={{ borderRadius: 1, mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {completionScore}% · {t('profile.completeness.helper')}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
              <Typography variant="h6">{t('profile.personalData')}</Typography>
              {!isEditing && (
                <Button variant="outlined" onClick={handleStartEdit} size="small">
                  {t('profile.buttons.edit')}
                </Button>
              )}
            </Stack>
            {isEditing && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('profile.editMode.description')}
              </Alert>
            )}
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
                disabled={!isEditing || formLoading}
                required
              />
              <TextField
                name="apellidos"
                label={t('profile.fields.lastName')}
                fullWidth
                margin="normal"
                value={formData.apellidos}
                onChange={onChange}
                disabled={!isEditing || formLoading}
                required
              />
              <TextField
                name="email"
                label={t('profile.fields.email')}
                fullWidth
                margin="normal"
                value={formData.email}
                onChange={onChange}
                disabled={!isEditing || formLoading || !isAdmin}
                required
              />
              <TextField
                label={t('profile.fields.hospital')}
                fullWidth
                margin="normal"
                value={formData.hospital}
                disabled
                helperText={t('profile.editMode.readonlyHint')}
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
                  disabled
                />
              )}

              {isEditing && (
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button variant="text" onClick={handleCancelEdit} disabled={formLoading}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" variant="contained" disabled={formLoading}>
                    {formLoading ? t('common.processing') : t('common.saveChanges')}
                  </Button>
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {t('profile.changePassword')}
            </Typography>
            {passSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passSuccess}</Alert>}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('profile.dialogs.passwordDescription')}
            </Typography>
            <Button variant="contained" onClick={handleOpenPasswordDialog}>
              {t('profile.buttons.changePassword')}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {t('profile.security.title')}
            </Typography>
            <Stack spacing={1}>
              <Alert severity="info" icon={false}>{t('profile.security.tipStrongPassword')}</Alert>
              <Alert severity="info" icon={false}>{t('profile.security.tipRegularUpdates')}</Alert>
              <Alert severity="info" icon={false}>{t('profile.security.tipSignOut')}</Alert>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isPasswordDialogOpen} onClose={handleClosePasswordDialog} fullWidth maxWidth="sm">
        <DialogTitle>{t('profile.dialogs.passwordTitle')}</DialogTitle>
        <Box component="form" onSubmit={onPassSubmit}>
          <DialogContent>
            {passError && <Alert severity="error" sx={{ mb: 2 }}>{passError}</Alert>}
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePasswordDialog} disabled={passLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={passLoading}>
              {passLoading ? t('common.processing') : t('profile.buttons.changePassword')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Perfil;
