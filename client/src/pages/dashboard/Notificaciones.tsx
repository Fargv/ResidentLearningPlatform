import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import {
  getNotificaciones,
  marcarNotificacionLeida
} from '../../api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notificaciones-tabpanel-${index}`}
      aria-labelledby={`notificaciones-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface Notificacion {
  _id: string;
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
  tipo?: string;
  enlace?: string;
}

interface NotificacionesProps {
  onChange?: () => void;
}

const Notificaciones: React.FC<NotificacionesProps> = ({ onChange }) => {
  const [pendientes, setPendientes] = useState<Notificacion[]>([]);
  const [vistas, setVistas] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotificaciones();
      const data: Notificacion[] = res.data.data || [];
      setPendientes(data.filter((n) => !n.leida));
      setVistas(data.filter((n) => n.leida));
    } catch (err: any) {
      setError(err.response?.data?.error || t('notifications.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarcarLeida = async (id: string) => {
    try {
      await marcarNotificacionLeida(id);
      setPendientes((prev) => {
        const notif = prev.find((n) => n._id === id);
        if (!notif) return prev;
        setVistas((v) => [{ ...notif, leida: true }, ...v]);
        return prev.filter((n) => n._id !== id);
      });
      onChange?.();
    } catch (err: any) {
      console.error('Error marcando notificación como leída', err);
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('notifications.title')}
      </Typography>
      {pendientes.length === 0 && vistas.length === 0 ? (
        <Typography>{t('notifications.empty.all')}</Typography>
      ) : (
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label={t('notifications.tabs.aria')}>
              <Tab
                label={`${t('notifications.tabs.pending')} (${pendientes.length})`}
                id="notificaciones-tab-0"
                aria-controls="notificaciones-tabpanel-0"
              />
              <Tab
                label={`${t('notifications.tabs.viewed')} (${vistas.length})`}
                id="notificaciones-tab-1"
                aria-controls="notificaciones-tabpanel-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {pendientes.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                {t('notifications.empty.pending')}
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('notifications.table.message')}</TableCell>
                      <TableCell>{t('notifications.table.date')}</TableCell>
                      <TableCell>{t('notifications.table.type')}</TableCell>
                      <TableCell align="right">{t('notifications.table.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendientes.map((n) => (
                      <TableRow
                        key={n._id}
                        onClick={() => n.enlace && navigate(n.enlace)}
                        sx={{ cursor: n.enlace ? 'pointer' : 'default' }}
                      >
                        <TableCell>{n.mensaje}</TableCell>
                        <TableCell>{new Date(n.fechaCreacion).toLocaleString()}</TableCell>
                        <TableCell>
                          {n.tipo ? <Chip label={n.tipo} size="small" color="primary" /> : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label="read"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarcarLeida(n._id);
                            }}
                          >
                            <DoneIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {vistas.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                {t('notifications.empty.viewed')}
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('notifications.table.message')}</TableCell>
                      <TableCell>{t('notifications.table.date')}</TableCell>
                      <TableCell>{t('notifications.table.type')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vistas.map((n) => (
                      <TableRow key={n._id}>
                        <TableCell>{n.mensaje}</TableCell>
                        <TableCell>{new Date(n.fechaCreacion).toLocaleString()}</TableCell>
                        <TableCell>
                          {n.tipo ? <Chip label={n.tipo} size="small" /> : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Paper>
      )}
    </Box>
  );
};

export default Notificaciones;
