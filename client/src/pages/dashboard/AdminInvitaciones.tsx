import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  MailOutline as MailOutlineIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';
import InviteUsersMail from '../../components/InviteUsersMail';
import api, { getInvitations } from '../../api';

interface BasicEntity {
  _id: string;
  nombre?: string;
  titulo?: string;
  zona?: string;
}

interface AdminUser {
  nombre?: string;
  apellidos?: string;
  email?: string;
}

interface Invitation {
  _id: string;
  email: string;
  rol: string;
  tipo: string;
  hospital?: BasicEntity;
  sociedad?: BasicEntity;
  zona?: string;
  estado?: string;
  token?: string;
  fechaEnvio?: string;
  fechaExpiracion?: string;
  admin?: AdminUser;
}

interface InvitationWithStatus extends Invitation {
  userMatch?: { _id: string; nombre?: string; apellidos?: string; email: string };
  derivedStatus: 'pendiente' | 'expirada' | 'aceptada' | 'registrado';
}

type CatalogEntity = { _id: string; nombre: string };

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getFrontendBaseUrl = () => {
  const envValue = process.env.REACT_APP_FRONTEND_URL || (window as any).REACT_APP_FRONTEND_URL;
  const base = envValue || window.location.origin;
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const AdminInvitaciones: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationWithStatus[]>([]);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info';
  } | null>(null);
  const [confirming, setConfirming] = useState<InvitationWithStatus | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [hospitals, setHospitals] = useState<CatalogEntity[]>([]);
  const [societies, setSocieties] = useState<CatalogEntity[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      const [invitationsRes, usersRes] = await Promise.all([
        getInvitations(),
        api.get('/users')
      ]);

      const users = usersRes.data?.data || [];
      const data: Invitation[] = invitationsRes.data?.data || invitationsRes.data || [];
      const now = Date.now();

      const enriched = data.map<InvitationWithStatus>((invitation) => {
        const userMatch = users.find(
          (u: any) =>
            typeof u.email === 'string' &&
            u.email.toLowerCase() === (invitation.email || '').toLowerCase()
        );

        const expired = invitation.fechaExpiracion
          ? new Date(invitation.fechaExpiracion).getTime() < now
          : false;

        let derivedStatus: InvitationWithStatus['derivedStatus'] = 'pendiente';

        if (userMatch) {
          derivedStatus = 'registrado';
        } else if (invitation.estado === 'aceptada') {
          derivedStatus = 'aceptada';
        } else if (expired || invitation.estado === 'expirada') {
          derivedStatus = 'expirada';
        }

        return { ...invitation, userMatch, derivedStatus };
      });

      setInvitations(enriched);
    } catch (err: any) {
      setError(err?.response?.data?.error || t('adminInvitations.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openInviteDialog) return;

    const loadCatalogs = async () => {
      try {
        setCatalogsLoading(true);
        const [hospitalsRes, societiesRes] = await Promise.all([
          api.get('/hospitals'),
          api.get('/sociedades')
        ]);

        const hospitalsData = hospitalsRes.data?.data || hospitalsRes.data || [];
        const societiesData = societiesRes.data?.data || societiesRes.data || [];

        setHospitals(hospitalsData.map((hospital: any) => ({ _id: hospital._id, nombre: hospital.nombre })));
        setSocieties(
          societiesData.map((society: any) => ({
            _id: society._id,
            nombre: society.nombre || society.titulo || ''
          }))
        );
      } catch (err: any) {
        setFeedback({
          message: err?.response?.data?.error || t('adminInvitations.feedback.catalogsError'),
          severity: 'error'
        });
      } finally {
        setCatalogsLoading(false);
      }
    };

    void loadCatalogs();
  }, [openInviteDialog, t]);

  const filteredInvitations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invitations;

    return invitations.filter((invitation) => {
      const hospitalName = invitation.hospital?.nombre || '';
      const sociedadName = invitation.sociedad?.nombre || invitation.sociedad?.titulo || '';
      const adminName = `${invitation.admin?.nombre || ''} ${invitation.admin?.apellidos || ''}`;
      return [
        invitation.email,
        invitation.rol,
        invitation.tipo,
        hospitalName,
        sociedadName,
        adminName,
        invitation.zona || ''
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [invitations, search]);

  const handleCopyLink = async (invitation: InvitationWithStatus) => {
    const canCopyLink = invitation.derivedStatus === 'pendiente' && Boolean(invitation.token);

    if (!canCopyLink) {
      setFeedback({ message: t('adminInvitations.feedback.noLink'), severity: 'error' });
      return;
    }
    const link = `${getFrontendBaseUrl()}/register/${invitation.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setFeedback({ message: t('adminInvitations.feedback.linkCopied'), severity: 'success' });
    } catch (err: any) {
      setFeedback({
        message: err?.message || t('adminInvitations.feedback.copyError'),
        severity: 'error'
      });
    }
  };

  const handleResend = async (invitation: InvitationWithStatus) => {
    const canResend = ['pendiente', 'expirada'].includes(invitation.derivedStatus);
    if (!canResend) return;

    setActionId(`${invitation._id}-resend`);
    try {
      const payload: Record<string, string> = {
        email: invitation.email,
        rol: invitation.rol,
        tipo: invitation.tipo
      };
      if (invitation.hospital?._id) payload.hospital = invitation.hospital._id;
      if (invitation.sociedad?._id) payload.sociedad = invitation.sociedad._id;
      if (invitation.zona) payload.zona = invitation.zona;

      await api.post('/users/invite', payload);
      setFeedback({ message: t('adminInvitations.feedback.resent'), severity: 'success' });
      await fetchInvitations();
    } catch (err: any) {
      setFeedback({
        message: err?.response?.data?.error || t('adminInvitations.feedback.resendError'),
        severity: 'error'
      });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirming) return;
    setActionId(`${confirming._id}-delete`);
    try {
      await api.delete(`/users/invitations/${confirming._id}`);
      setFeedback({ message: t('adminInvitations.feedback.deleted'), severity: 'success' });
      setConfirming(null);
      await fetchInvitations();
    } catch (err: any) {
      setFeedback({
        message: err?.response?.data?.error || t('adminInvitations.feedback.deleteError'),
        severity: 'error'
      });
    } finally {
      setActionId(null);
    }
  };

  const renderStatusChip = (status: InvitationWithStatus['derivedStatus']) => {
    const labels: Record<typeof status, string> = {
      pendiente: t('adminInvitations.status.pending'),
      expirada: t('adminInvitations.status.expired'),
      aceptada: t('adminInvitations.status.accepted'),
      registrado: t('adminInvitations.status.registered')
    };

    const colors: Record<typeof status, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
      pendiente: 'info',
      expirada: 'warning',
      aceptada: 'success',
      registrado: 'success'
    };

    return <Chip label={labels[status]} color={colors[status]} size="small" />;
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('adminInvitations.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('adminInvitations.subtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            startIcon={<MailOutlineIcon />}
            onClick={() => setOpenInviteDialog(true)}
            disabled={catalogsLoading}
          >
            {t('adminInvitations.actions.invite')}
          </Button>
          <BackButton />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchInvitations}
            disabled={loading}
          >
            {t('adminInvitations.actions.refresh')}
          </Button>
        </Stack>
      </Box>

      <TextField
        fullWidth
        placeholder={t('adminInvitations.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('adminInvitations.table.email')}</TableCell>
                <TableCell>{t('adminInvitations.table.role')}</TableCell>
                <TableCell>{t('adminInvitations.table.program')}</TableCell>
                <TableCell>{t('adminInvitations.table.scope')}</TableCell>
                <TableCell>{t('adminInvitations.table.sent')}</TableCell>
                <TableCell>{t('adminInvitations.table.expires')}</TableCell>
                <TableCell>{t('adminInvitations.table.status')}</TableCell>
                <TableCell>{t('adminInvitations.table.admin')}</TableCell>
                <TableCell align="right">{t('adminInvitations.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {loading
                        ? t('adminInvitations.table.loading')
                        : t('adminInvitations.table.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvitations.map((invitation) => (
                  <TableRow key={invitation._id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>{invitation.email}</Typography>
                        {invitation.userMatch && (
                          <Typography variant="body2" color="text.secondary">
                            {t('adminInvitations.labels.convertedTo', {
                              name: `${invitation.userMatch.nombre || ''} ${invitation.userMatch.apellidos || ''}`.trim() ||
                                invitation.userMatch.email
                            })}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{t(`roles.${invitation.rol}`)}</TableCell>
                    <TableCell>{invitation.tipo}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {invitation.hospital?.nombre && (
                          <Typography variant="body2">{invitation.hospital.nombre}</Typography>
                        )}
                        {invitation.sociedad && (
                          <Typography variant="body2">
                            {invitation.sociedad.nombre || invitation.sociedad.titulo}
                          </Typography>
                        )}
                        {invitation.zona && (
                          <Chip label={invitation.zona} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDateTime(invitation.fechaEnvio)}</TableCell>
                    <TableCell>{formatDateTime(invitation.fechaExpiracion)}</TableCell>
                    <TableCell>{renderStatusChip(invitation.derivedStatus)}</TableCell>
                    <TableCell>
                      {invitation.admin?.email ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2" fontWeight={600}>
                            {`${invitation.admin.nombre || ''} ${invitation.admin.apellidos || ''}`.trim() ||
                              invitation.admin.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.admin.email}
                          </Typography>
                        </Stack>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title={t('adminInvitations.actions.copy')}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleCopyLink(invitation)}
                              disabled={
                                invitation.derivedStatus !== 'pendiente' || !invitation.token || Boolean(actionId)
                              }
                              color="primary"
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={t('adminInvitations.actions.resend')}>
                          <span>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleResend(invitation)}
                              disabled={
                                !['pendiente', 'expirada'].includes(invitation.derivedStatus) || Boolean(actionId)
                              }
                            >
                              {actionId === `${invitation._id}-resend` ? (
                                <RefreshIcon fontSize="small" />
                              ) : (
                                <SendIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={t('adminInvitations.actions.delete')}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirming(invitation)}
                              disabled={Boolean(actionId)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(confirming)} onClose={() => setConfirming(null)}>
        <DialogTitle>{t('adminInvitations.dialogs.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('adminInvitations.dialogs.deleteConfirm', { email: confirming?.email })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>{t('adminInvitations.dialogs.cancel')}</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            disabled={Boolean(actionId)}
          >
            {t('adminInvitations.dialogs.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {feedback && (
        <Snackbar
            open
            autoHideDuration={4000}
            onClose={() => setFeedback(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
            severity={feedback.severity}
            onClose={() => setFeedback(null)}
            sx={{ width: '100%' }}
            >
            {feedback.message}
            </Alert>
        </Snackbar>
        )}

      <InviteUsersMail
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        hospitals={hospitals}
        societies={societies}
        onSuccess={fetchInvitations}
      />

    </Box>
  );
};

export default AdminInvitaciones;