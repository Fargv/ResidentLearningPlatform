import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { requestPasswordReset, requestPasswordResetAutomatic } from '../api';

const ForgotPassword: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [mode, setMode] = useState<'manual' | 'automatic'>('manual');
  const { t } = useTranslation();
  const env = process.env.REACT_APP_ENV || (window as any).REACT_APP_ENV;
  const adminUrl =
    env === 'dev'
      ? 'https://residentlearningplatform.netlify.app/dashboard/usuarios'
      : 'https://academicprogramdavinci.netlify.app/dashboard/usuarios';
  const mailtoLink =
    `mailto:fernando.acedorico@abexsl.es` +
    `?subject=${encodeURIComponent('Solicitud de reseteo de contraseña')}` +
    `&body=${encodeURIComponent(
      `El usuario ${userEmail || '[sin email]'} necesita reseteo de contraseña.\n\n` +
      `Enlace al dashboard de administración de usuarios: ${adminUrl}`
    )}`;

  const handleManual = async () => {
    try {
      await requestPasswordReset(userEmail);
      setStatusMessage(t('forgotPassword.manualSuccess'));
      setIsError(false);
      window.location.href = mailtoLink;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setStatusMessage(t('forgotPassword.emailNotFound'));
      } else {
        setStatusMessage(t('forgotPassword.manualError'));
      }
      setIsError(true);
    }
  };

  const handleAutomatic = async () => {
    try {
      await requestPasswordResetAutomatic(userEmail);
      setStatusMessage(t('forgotPassword.automaticSuccess'));
      setIsError(false);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setStatusMessage(t('forgotPassword.emailNotFound'));
      } else {
        setStatusMessage(t('forgotPassword.automaticError'));
      }
      setIsError(true);
    }
  };

  const handleRequest = async () => {
    if (mode === 'manual') {
      await handleManual();
    } else {
      await handleAutomatic();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            {t('forgotPassword.heading')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t('forgotPassword.description')}
          </Typography>
          <TextField
            margin="normal"
            fullWidth
            label={t('forgotPassword.emailLabel')}
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <FormLabel component="legend">{t('forgotPassword.modeLabel')}</FormLabel>
            <RadioGroup
              row
              value={mode}
              onChange={(event) => setMode(event.target.value as 'manual' | 'automatic')}
            >
              <FormControlLabel
                value="manual"
                control={<Radio />}
                label={t('forgotPassword.manualOption')}
              />
              <FormControlLabel
                value="automatic"
                control={<Radio />}
                label={t('forgotPassword.automaticOption')}
              />
            </RadioGroup>
          </FormControl>
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleRequest}>
            {mode === 'manual'
              ? t('forgotPassword.manualSubmit')
              : t('forgotPassword.automaticSubmit')}
          </Button>
          {statusMessage && (
            <Typography sx={{ mt: 2 }} color={isError ? 'error' : 'success.main'}>
              {statusMessage}
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/login" underline="hover">
              {t('forgotPassword.backToLogin')}
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
