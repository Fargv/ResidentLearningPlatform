import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import Register, { RegisterInitialData, RegisterFormKey } from './Register';

interface InvitationPayload {
  email: string;
  rol: string;
  tipo: string;
  codigoAcceso: string;
  hospital?: { _id: string; nombre: string } | null;
  sociedad?: { _id: string; titulo: string } | null;
  zona?: string;
}

const RegisterInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationPayload | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError(t('registerInvite.invalid'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/users/public/invitations/${token}`);
        setInvitation(response.data.data);
        setError(null);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 410) {
          setError(t('registerInvite.expired'));
        } else if (status === 404) {
          setError(t('registerInvite.invalid'));
        } else {
          setError(t('registerInvite.error'));
        }
        setInvitation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, t]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', py: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {t('registerInvite.loading')}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!invitation || error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', py: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <img src="/logo.png" alt="Abex Excelencia Robótica" style={{ maxWidth: '200px', marginBottom: '16px' }} />
            <Typography variant="h4" component="h1" gutterBottom>
              {t('registerInvite.title')}
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error ?? t('registerInvite.error')}
            </Alert>
            <Button
              sx={{ mt: 3 }}
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/login"
            >
              {t('registerInvite.ctaLogin')}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const initialData: RegisterInitialData = {
    email: invitation.email,
    codigoAcceso: invitation.codigoAcceso,
    rol: invitation.rol,
    tipo: invitation.tipo,
    hospital: invitation.hospital?._id ?? '',
    sociedad: invitation.sociedad?._id ?? '',
    zona: invitation.zona ?? ''
  };

  const lockedFields: RegisterFormKey[] = ['email', 'codigoAcceso'];

  return (
    <Register
      initialData={initialData}
      lockedFields={lockedFields}
      skipCodeValidation
      title={t('registerInvite.title')}
      infoMessage={t('registerInvite.prefilledNotice', { email: invitation.email })}
    />
  );
};

export default RegisterInvite;
