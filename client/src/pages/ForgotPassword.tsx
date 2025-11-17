import React, { useState } from 'react';
import { Box, Container, Paper, Typography, TextField, Button, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { requestPasswordResetAutomatic } from '../api';

const ForgotPassword: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { t } = useTranslation();
  const handlePasswordReset = async () => {
    try {
      await requestPasswordResetAutomatic(userEmail);
      setStatusMessage(t('forgotPassword.success'));
      setIsError(false);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setStatusMessage(t('forgotPassword.emailNotFound'));
      } else {
        setStatusMessage(t('forgotPassword.error'));
      }
      setIsError(true);
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
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handlePasswordReset}>
            {t('forgotPassword.submit')}
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
