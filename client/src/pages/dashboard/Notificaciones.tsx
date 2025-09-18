import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  IconButton,
  Button,
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
  Paper,
  Checkbox,
  Toolbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import UndoIcon from '@mui/icons-material/Undo';
import {
  getNotificaciones,
  marcarNotificacionLeida,
  getUserResetToken,
  clearResetNotifications,
  eliminarNotificacion
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
  entidadRelacionada?: {
    id: string;
    tipo?: string;
  };
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotificaciones();
      const data: Notificacion[] = res.data.data || [];
      setPendientes(data.filter((n) => !n.leida));
      setVistas(data.filter((n) => n.leida));
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.response?.data?.error || t('notifications.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Selección unificada ----------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getSelectedIn = (list: Notificacion[]) =>
    selectedIds.filter((id) => list.some((n) => n._id === id));

  const selectAll = () => {
    const current = tabValue === 0 ? pendientes : vistas;
    setSelectedIds(current.map((n) => n._id));
  };

  const clearSelection = () => setSelectedIds([]);

  const areAllSelected = (list: Notificacion[]) =>
    list.length > 0 && list.every((n) => selectedIds.includes(n._id));
  const isIndeterminate = (list: Notificacion[]) =>
    list.some((n) => selectedIds.includes(n._id)) && !areAllSelected(list);

  // ---------- Acciones item a item ----------
  const handleMarcarLeida = async (id: string) => {
    try {
      await marcarNotificacionLeida(id, true); // ✅ ahora con booleano
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

  const handleSendResetLink = async (n: Notificacion) => {
    if (!n.entidadRelacionada?.id) return;
    try {
      const res = await getUserResetToken(n.entidadRelacionada.id);
      const data = res.data.data || res.data;
      const { resetToken, email, name } = data;
      const frontendUrl =
        process.env.REACT_APP_FRONTEND_URL || window.location.origin;
      const days = parseInt(
        process.env.REACT_APP_RESET_PASSWORD_EXPIRE_DAYS || '3',
        10
      );
      const subject = encodeURIComponent(
        t('adminUsers.resetEmail.subject', { app: t('common.appName') })
      );
      const body = encodeURIComponent(
        t('adminUsers.resetEmail.body', {
          name,
          app: t('common.appName'),
          link: `${frontendUrl}/reset-password/${resetToken}`,
          days
        })
      );
      const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;

      await clearResetNotifications(n.entidadRelacionada.id);

      setPendientes((prev) =>
        prev.filter(
          (p) =>
            !(
              p.tipo === 'passwordReset' &&
              p.entidadRelacionada?.id === n.entidadRelacionada?.id
            )
        )
      );
      onChange?.();
    } catch (err) {
      console.error('Error sending reset link', err);
    }
  };

  // ---------- Acciones masivas por pestaña ----------
  const handleMarkSelectedPendientes = async () => {
    const ids = getSelectedIn(pendientes);
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map((id) => marcarNotificacionLeida(id, true))); // ✅ booleano
      setPendientes((prev) => prev.filter((n) => !ids.includes(n._id)));
      setVistas((v) => {
        const moved = ids
          .map((id) => pendientes.find((n) => n._id === id))
          .filter((n): n is Notificacion => Boolean(n))
          .map((n) => ({ ...n, leida: true }));
        return [...moved, ...v];
      });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      onChange?.();
    } catch (err) {
      console.error('Error marcando notificaciones como leídas', err);
    }
  };

  const handleDeleteSelectedPendientes = async () => {
    const ids = getSelectedIn(pendientes);
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map((id) => eliminarNotificacion(id)));
      setPendientes((prev) => prev.filter((n) => !ids.includes(n._id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      onChange?.();
    } catch (err) {
      console.error('Error eliminando notificaciones', err);
    }
  };

  // VISTAS -> PENDIENTES (marca como no leída en API y mueve local)
  const handleMarkSelectedVistasUnread = async () => {
    const ids = getSelectedIn(vistas);
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map((id) => marcarNotificacionLeida(id, false))); // ✅ booleano
      setVistas((prev) => prev.filter((n) => !ids.includes(n._id)));
      setPendientes((p) => {
        const moved = ids
          .map((id) => vistas.find((n) => n._id === id))
          .filter((n): n is Notificacion => Boolean(n))
          .map((n) => ({ ...n, leida: false }));
        return [...moved, ...p];
      });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      onChange?.();
    } catch (err) {
      console.error('Error marcando como no leídas', err);
    }
  };

  const handleDeleteSelectedVistas = async () => {
    const ids = getSelectedIn(vistas);
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map((id) => eliminarNotificacion(id)));
      setVistas((prev) => prev.filter((n) => !ids.includes(n._id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      onChange?.();
    } catch (err) {
      console.error('Error eliminando notificaciones', err);
    }
  };

  // ---------- Acciones masivas del toolbar (ambas pestañas) ----------
  const handleDeleteSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map((id) => eliminarNotificacion(id)));
      setPendientes((prev) => prev.filter((n) => !ids.includes(n._id)));
      setVistas((prev) => prev.filter((n) => !ids.includes(n._id)));
      clearSelection();
      onChange?.();
    } catch (err) {
      console.error('Error deleting notifications', err);
    }
  };

  const handleMarkSelected = async () => {
    const idsToMark = getSelectedIn(pendientes);
    if (idsToMark.length === 0) return;

    try {
      await Promise.all(idsToMark.map((id) => marcarNotificacionLeida(id, true))); // ✅ booleano
      setPendientes((prev) => {
        const toMove = prev.filter((n) => idsToMark.includes(n._id));
        setVistas((v) => [...toMove.map((n) => ({ ...n, leida: true })), ...v]);
        return prev.filter((n) => !idsToMark.includes(n._id));
      });
      clearSelection();
      onChange?.();
    } catch (err) {
      console.error('Error marking notifications', err);
    }
  };

  const handleUnmarkSelected = async () => {
    const ids = getSelectedIn(vistas);
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map((id) => marcarNotificacionLeida(id, false))); // ✅ booleano
      setVistas((prev) => {
        const toMove = prev
          .filter((n) => ids.includes(n._id))
          .map((n) => ({ ...n, leida: false }));
        setPendientes((p) => [...toMove, ...p]);
        return prev.filter((n) => !ids.includes(n._id));
      });
      clearSelection();
      onChange?.();
    } catch (err) {
      console.error('Error marcando como no leídas', err);
    }
  };

  // ---------- UI ----------
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

  const currentList = tabValue === 0 ? pendientes : vistas;

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
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label={t('notifications.tabs.aria')}
            >
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

          {/* PENDIENTES */}
          <TabPanel value={tabValue} index={0}>
            {pendientes.length === 0 ? (
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ py: 4 }}
              >
                {t('notifications.empty.pending')}
              </Typography>
            ) : (
              <>
                <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Checkbox
                    indeterminate={isIndeterminate(pendientes)}
                    checked={areAllSelected(pendientes)}
                    onChange={() =>
                      areAllSelected(pendientes) ? clearSelection() : selectAll()
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DoneAllIcon />}
                    disabled={getSelectedIn(pendientes).length === 0}
                    onClick={handleMarkSelectedPendientes}
                  >
                    {t('notifications.actions.markRead')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    disabled={getSelectedIn(pendientes).length === 0}
                    onClick={handleDeleteSelectedPendientes}
                  >
                    {t('common.delete')}
                  </Button>
                </Box>

                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" />
                        <TableCell>{t('notifications.table.message')}</TableCell>
                        <TableCell>{t('notifications.table.date')}</TableCell>
                        <TableCell>{t('notifications.table.type')}</TableCell>
                        <TableCell align="right">
                          {t('notifications.table.actions')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendientes.map((n) => (
                        <TableRow
                          key={n._id}
                          onClick={async () => {
                            if (n.tipo === 'passwordReset') {
                              await handleSendResetLink(n);
                            } else if (n.enlace) {
                              await handleMarcarLeida(n._id);
                              navigate(n.enlace);
                            }
                          }}
                          sx={{
                            cursor:
                              n.enlace || n.tipo === 'passwordReset'
                                ? 'pointer'
                                : 'default'
                          }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(n._id)}
                              onChange={() => toggleSelect(n._id)}
                            />
                          </TableCell>
                          <TableCell>{n.mensaje}</TableCell>
                          <TableCell>
                            {new Date(n.fechaCreacion).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {n.tipo ? (
                              <Chip label={n.tipo} size="small" color="primary" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {n.tipo === 'passwordReset' ? (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendResetLink(n);
                                }}
                              >
                                {t('notifications.actions.sendResetLink')}
                              </Button>
                            ) : (
                              <IconButton
                                aria-label="read"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarcarLeida(n._id);
                                }}
                              >
                                <DoneIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>

          {/* VISTAS */}
          <TabPanel value={tabValue} index={1}>
            {vistas.length === 0 ? (
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ py: 4 }}
              >
                {t('notifications.empty.viewed')}
              </Typography>
            ) : (
              <>
                <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Checkbox
                    indeterminate={isIndeterminate(vistas)}
                    checked={areAllSelected(vistas)}
                    onChange={() =>
                      areAllSelected(vistas) ? clearSelection() : selectAll()
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UndoIcon />}
                    disabled={getSelectedIn(vistas).length === 0}
                    onClick={handleMarkSelectedVistasUnread}
                  >
                    {t('notifications.actions.markUnread')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    disabled={getSelectedIn(vistas).length === 0}
                    onClick={handleDeleteSelectedVistas}
                  >
                    {t('common.delete')}
                  </Button>
                </Box>

                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" />
                        <TableCell>{t('notifications.table.message')}</TableCell>
                        <TableCell>{t('notifications.table.date')}</TableCell>
                        <TableCell>{t('notifications.table.type')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vistas.map((n) => (
                        <TableRow key={n._id}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.includes(n._id)}
                              onChange={() => toggleSelect(n._id)}
                            />
                          </TableCell>
                          <TableCell>{n.mensaje}</TableCell>
                          <TableCell>
                            {new Date(n.fechaCreacion).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {n.tipo ? <Chip label={n.tipo} size="small" /> : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>
        </Paper>
      )}

      {selectedIds.length > 0 && (
        <Toolbar
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 1,
            gap: 1,
            zIndex: 1200
          }}
        >
          <IconButton aria-label="delete" onClick={handleDeleteSelected} title={t('common.delete') as string}>
            <DeleteIcon />
          </IconButton>
          <IconButton
            aria-label="mark-read"
            onClick={handleMarkSelected}
            title={t('notifications.actions.markRead') as string}
          >
            <DoneIcon />
          </IconButton>
          <IconButton
            aria-label="mark-unread"
            onClick={handleUnmarkSelected}
            title={t('notifications.actions.markUnread') as string}
          >
            <UndoIcon />
          </IconButton>
          <Button
            onClick={() =>
              areAllSelected(currentList) ? clearSelection() : selectAll()
            }
          >
            {areAllSelected(currentList) ? 'Clear All' : 'Select All'}
          </Button>
        </Toolbar>
      )}
    </Box>
  );
};

export default Notificaciones;
