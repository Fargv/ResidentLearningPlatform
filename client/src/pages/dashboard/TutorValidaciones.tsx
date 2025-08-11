import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  //Pending as PendingIcon,
  Error as ErrorIcon
  //School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { formatDayMonthYear } from '../../utils/date';

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
      id={`validaciones-tabpanel-${index}`}
      aria-labelledby={`validaciones-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TutorValidaciones: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [validadas, setValidadas] = useState<any[]>([]);
  const [rechazadas, setRechazadas] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openValidarDialog, setOpenValidarDialog] = useState(false);
  const [openRechazarDialog, setOpenRechazarDialog] = useState(false);
  const [selectedProgreso, setSelectedProgreso] = useState<any>(null);
  const [comentarios, setComentarios] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [firmaDigital, setFirmaDigital] = useState('');

  const formatFase = (fase: any) =>
    fase
      ? `${t('common.phase')} ${fase.numero}: ${fase.nombre}`
      : t('tutorValidations.table.noPhase');

  const fetchValidaciones = useCallback(async () => {
    try {
      setLoading(true);

      const respuesta = await api.get(
        '/progreso/tutor/validaciones/pendientes'
      );

      const { pendientes, validadas, rechazadas } = respuesta.data.data || {};
      setPendientes(pendientes || []);
      setValidadas(validadas || []);
      setRechazadas(rechazadas || []);
    } catch (err: any) {
      setError(err.response?.data?.error || t('tutorValidations.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

useEffect(() => {
  if (user?.rol === 'tutor' || user?.rol === 'csm' || user?.rol === 'profesor') {
    fetchValidaciones();
  }
}, [user, fetchValidaciones]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenValidarDialog = (progreso: any) => {
    setSelectedProgreso(progreso);
    setComentarios('');
    setFirmaDigital(`${user?.nombre} ${user?.apellidos} - ${formatDayMonthYear(new Date().toISOString())}`);
    setOpenValidarDialog(true);
  };

  const handleVerAdjunto = async (progresoId: string, index: number) => {
    try {
      const res = await api.get(`/adjuntos/actividad/${progresoId}/${index}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Error obteniendo adjunto', e);
    }
  };

  const handleCloseValidarDialog = () => {
    setOpenValidarDialog(false);
    setSelectedProgreso(null);
    setComentarios('');
    setFirmaDigital('');
  };

  const handleOpenRechazarDialog = (progreso: any) => {
    setSelectedProgreso(progreso);
    setComentarios('');
    setOpenRechazarDialog(true);
  };

  const handleCloseRechazarDialog = () => {
    setOpenRechazarDialog(false);
    setSelectedProgreso(null);
    setComentarios('');
  };

  const handleValidar = async () => {
  if (!selectedProgreso || !firmaDigital) return;

  setProcesando(true);
  try {
    await api.post(
      `/progreso/${selectedProgreso.progresoId}/actividad/${selectedProgreso.index}/validar`,
      {
        comentarios,
        firmaDigital,
      }
    );
    handleCloseValidarDialog();
    fetchValidaciones(); // Refresca la lista desde el backend
  } catch (error) {
    console.error('Error al validar actividad:', error);
  } finally {
    setProcesando(false);
  }
};

const handleRechazar = async () => {
  if (!selectedProgreso || !comentarios) return;

  setProcesando(true);
  try {
    await api.post(
      `/progreso/${selectedProgreso.progresoId}/actividad/${selectedProgreso.index}/rechazar`,
      {
        comentarios,
      }
    );
    handleCloseRechazarDialog();
    fetchValidaciones(); // Refresca la lista desde el backend
  } catch (error) {
    console.error('Error al rechazar actividad:', error);
  } finally {
    setProcesando(false);
  }
};


  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('tutorValidations.title')}
      </Typography>

      {/* Pestañas */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label={t('tutorValidations.tabs.aria')}
          >
            <Tab
              label={`${t('tutorValidations.tabs.pending')} (${pendientes.length})`}
              id="validaciones-tab-0"
              aria-controls="validaciones-tabpanel-0"
            />
            <Tab
              label={`${t('tutorValidations.tabs.validated')} (${validadas.length})`}
              id="validaciones-tab-1"
              aria-controls="validaciones-tabpanel-1"
            />
            <Tab
              label={`${t('tutorValidations.tabs.rejected')} (${rechazadas.length})`}
              id="validaciones-tab-2"
              aria-controls="validaciones-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Panel de Pendientes */}
        <TabPanel value={tabValue} index={0}>
          {pendientes.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {t('tutorValidations.empty.pending')}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('tutorValidations.table.phase')}</TableCell>
                    <TableCell>{t('tutorValidations.table.activity')}</TableCell>
                    <TableCell>{t('tutorValidations.table.resident')}</TableCell>
                    <TableCell>{t('tutorValidations.table.date')}</TableCell>
                    <TableCell>{t('tutorValidations.table.comments')}</TableCell>
                    <TableCell align="right">{t('tutorValidations.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendientes.map((progreso) => (
                    <TableRow key={progreso._id}>
                      <TableCell>{formatFase(progreso.fase)}</TableCell>
                      <TableCell>{progreso.actividad?.nombre || progreso.nombre || t('tutorValidations.table.noName')}</TableCell>
                      <TableCell>
                        {progreso.residente?.nombre || '—'} {progreso.residente?.apellidos || ''}
                      </TableCell>
                      <TableCell>{formatDayMonthYear(progreso.fechaCreacion)}</TableCell>
                      <TableCell>{progreso.actividad?.comentariosResidente || '-'}</TableCell>
                      <TableCell align="right">
                        {progreso.tieneAdjunto && (
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() =>
                              handleVerAdjunto(
                                progreso.progresoId || progreso._id.split('-')[0],
                                progreso.index
                              )
                            }
                          >
                            {t('tutorValidations.buttons.viewAttachment')}
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          sx={{ mr: 1 }}
                          onClick={() =>
                            handleOpenValidarDialog({
                              progresoId: progreso.progresoId || progreso._id.split('-')[0],
                              index: progreso.index,
                              ...progreso
                            })
                          }
                        >
                          {t('tutorValidations.buttons.validate')}
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<ErrorIcon />}
                          onClick={() =>
                            handleOpenRechazarDialog({
                              progresoId: progreso.progresoId || progreso._id.split('-')[0],
                              index: progreso.index,
                              ...progreso
                            })
                          }
                        >
                          {t('tutorValidations.buttons.reject')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* Panel de Validadas */}
        <TabPanel value={tabValue} index={1}>
          {validadas.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {t('tutorValidations.empty.validated')}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('tutorValidations.table.phase')}</TableCell>
                    <TableCell>{t('tutorValidations.table.activity')}</TableCell>
                    <TableCell>{t('tutorValidations.table.resident')}</TableCell>
                    <TableCell>{t('tutorValidations.table.date')}</TableCell>
                    <TableCell>{t('tutorValidations.table.comments')}</TableCell>
                    <TableCell align="right">{t('tutorValidations.table.state')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validadas.map(progreso => (
                    <TableRow key={progreso._id}>
                      <TableCell>{formatFase(progreso.fase)}</TableCell>
                      <TableCell>{progreso.actividad?.nombre || progreso.nombre || t('tutorValidations.table.noName')}</TableCell>
                      <TableCell>{progreso.residente?.nombre} {progreso.residente?.apellidos}</TableCell>
                      <TableCell>{formatDayMonthYear(progreso.fechaActualizacion || progreso.fechaCreacion)}</TableCell>
                      <TableCell>{progreso.validaciones?.[0]?.comentarios || '-'}</TableCell>
                      <TableCell align="right">
                        <Chip icon={<CheckCircleIcon />} label={t('tutorValidations.states.validated')} color="success" size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        
        {/* Panel de Rechazadas */}
        <TabPanel value={tabValue} index={2}>
          {rechazadas.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {t('tutorValidations.empty.rejected')}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('tutorValidations.table.phase')}</TableCell>
                    <TableCell>{t('tutorValidations.table.activity')}</TableCell>
                    <TableCell>{t('tutorValidations.table.resident')}</TableCell>
                    <TableCell>{t('tutorValidations.table.date')}</TableCell>
                    <TableCell>{t('tutorValidations.table.reason')}</TableCell>
                    <TableCell align="right">{t('tutorValidations.table.state')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rechazadas.map(progreso => (
                    <TableRow key={progreso._id}>
                      <TableCell>{formatFase(progreso.fase)}</TableCell>
                      <TableCell>{progreso.actividad?.nombre || progreso.nombre || t('tutorValidations.table.noName')}</TableCell>
                      <TableCell>{progreso.residente?.nombre} {progreso.residente?.apellidos}</TableCell>
                      <TableCell>{formatDayMonthYear(progreso.fechaActualizacion || progreso.fechaCreacion)}</TableCell>
                      <TableCell>{progreso.comentariosRechazo || '-'}</TableCell>
                      <TableCell align="right">
                        <Chip icon={<ErrorIcon />} label={t('tutorValidations.states.rejected')} color="error" size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
      
      {/* Diálogo para validar */}
      <Dialog open={openValidarDialog} onClose={handleCloseValidarDialog}>
        <DialogTitle>{t('tutorValidations.dialog.validateTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('tutorValidations.dialog.validateMessage', {
              activity: selectedProgreso?.actividad?.nombre,
              name: `${selectedProgreso?.residente?.nombre} ${selectedProgreso?.residente?.apellidos}`
            })}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="comentarios"
            label={t('tutorValidations.dialog.optionalComments')}
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="firma"
            label={t('tutorValidations.dialog.digitalSignature')}
            type="text"
            fullWidth
            variant="outlined"
            value={firmaDigital}
            onChange={(e) => setFirmaDigital(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseValidarDialog} color="primary">
            {t('tutorValidations.buttons.cancel')}
          </Button>
          <Button
            onClick={handleValidar}
            color="success"
            variant="contained"
            disabled={procesando || !firmaDigital}
          >
            {procesando ? t('common.processing') : t('tutorValidations.buttons.validate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para rechazar */}
      <Dialog open={openRechazarDialog} onClose={handleCloseRechazarDialog}>
        <DialogTitle>{t('tutorValidations.dialog.rejectTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('tutorValidations.dialog.rejectMessage', {
              activity: selectedProgreso?.actividad?.nombre,
              name: `${selectedProgreso?.residente?.nombre} ${selectedProgreso?.residente?.apellidos}`
            })}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="comentarios"
            label={t('tutorValidations.dialog.rejectReason')}
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRechazarDialog} color="primary">
            {t('tutorValidations.buttons.cancel')}
          </Button>
          <Button
            onClick={handleRechazar}
            color="error"
            variant="contained"
            disabled={procesando || !comentarios}
          >
            {procesando ? t('common.processing') : t('tutorValidations.buttons.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TutorValidaciones;

