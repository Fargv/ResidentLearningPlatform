import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
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
import { Theme } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  InfoOutlined as InfoOutlinedIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDayMonthYear } from '../../utils/date';
import RichTextViewer from '../../components/RichTextViewer';
import { richTextOrUndefined } from '../../utils/richText';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`admin-validaciones-tabpanel-${index}`}
    aria-labelledby={`admin-validaciones-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

const getTableHeadStyles = (theme: Theme) => {
  const backgroundColor =
    theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light;

  return {
    backgroundColor,
    '& .MuiTableCell-root': {
      color: theme.palette.getContrastText(backgroundColor),
      fontWeight: 600
    }
  };
};

const AdminValidaciones: React.FC = () => {
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
  const [openAdjuntosDialog, setOpenAdjuntosDialog] = useState(false);
  const [adjuntosSeleccionados, setAdjuntosSeleccionados] = useState<any>(null);
  const [descripcionDialog, setDescripcionDialog] = useState({
    open: false,
    title: '',
    description: undefined as string | undefined
  });
  const [hospitales, setHospitales] = useState<any[]>([]);
  const [sociedades, setSociedades] = useState<any[]>([]);

  const defaultFilters = {
    participantType: 'all',
    societyId: 'all',
    hospitalId: 'all',
    participantQuery: '',
    phaseId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  };

  const [filters, setFilters] = useState(defaultFilters);

  const attachmentButtonStyles = { minWidth: 160, height: 36 };
  const actionButtonStyles = { minWidth: 170, height: 36, mt: 1 };

  const formatFase = (fase: any) =>
    fase
      ? `${t('common.phase')} ${fase.numero}: ${fase.nombre}`
      : t('tutorValidations.table.noPhase');

  const getSurgeryType = (cirugia?: any, otraCirugia?: string) => {
    if (cirugia?.name) return cirugia.name;
    return otraCirugia || '-';
  };

  const renderActivityCell = (progreso: any) => {
    const descriptionHtml = richTextOrUndefined(progreso.actividad?.descripcion);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>{progreso.actividad?.nombre || progreso.nombre || t('tutorValidations.table.noName')}</span>
        {descriptionHtml && (
          <Tooltip title={t('adminPhases.viewDescription')}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenDescripcionDialog(progreso, descriptionHtml)}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  const fetchValidaciones = useCallback(async () => {
    try {
      setLoading(true);

      const respuesta = await api.get('/progreso/admin/validaciones/pendientes');

      const { pendientes, validadas, rechazadas } = respuesta.data.data || {};
      setPendientes(pendientes || []);
      setValidadas(validadas || []);
      setRechazadas(rechazadas || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || t('tutorValidations.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [hospitalesRes, sociedadesRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/sociedades')
      ]);

      setHospitales(hospitalesRes.data.data || []);
      setSociedades(sociedadesRes.data.data || []);
    } catch (err) {
      console.error('Error cargando filtros', err);
    }
  }, []);

  useEffect(() => {
    if (user?.rol === 'administrador') {
      fetchValidaciones();
      fetchMetadata();
    }
  }, [user, fetchValidaciones, fetchMetadata]);

  useEffect(() => {
    if (filters.status === 'pendiente') setTabValue(0);
    if (filters.status === 'validado') setTabValue(1);
    if (filters.status === 'rechazado') setTabValue(2);
  }, [filters.status]);

  useEffect(() => {
    if (filters.participantType === 'Programa Residentes' && filters.societyId !== 'all') {
      setFilters((prev) => ({ ...prev, societyId: 'all' }));
    }
    if (filters.participantType === 'Programa Sociedades' && filters.hospitalId !== 'all') {
      setFilters((prev) => ({ ...prev, hospitalId: 'all' }));
    }
  }, [filters.participantType, filters.societyId, filters.hospitalId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenValidarDialog = (progreso: any) => {
    setSelectedProgreso(progreso);
    setComentarios('');
    const fecha = formatDayMonthYear(new Date().toISOString());
    const nombre = `${user?.nombre ?? ''} ${user?.apellidos ?? ''}`.trim();
    const firma = `${t('adminValidations.signaturePrefix')} ${nombre} - ${fecha}`.trim();
    setFirmaDigital(firma);
    setOpenValidarDialog(true);
  };

  const handleOpenAdjuntosDialog = (progreso: any) => {
    setAdjuntosSeleccionados({
      progresoId: progreso.progresoId || progreso._id.split('-')[0],
      index: progreso.index,
      adjuntos: progreso.adjuntos || []
    });
    setOpenAdjuntosDialog(true);
  };

  const handleOpenDescripcionDialog = (
    progreso: any,
    descriptionHtml?: string
  ) => {
    const content = descriptionHtml ?? richTextOrUndefined(progreso.actividad?.descripcion);

    if (!content) return;

    setDescripcionDialog({
      open: true,
      title:
        progreso.actividad?.nombre ||
        progreso.nombre ||
        t('tutorValidations.table.noName'),
      description: content
    });
  };

  const handleCloseDescripcionDialog = () => {
    setDescripcionDialog((prev) => ({ ...prev, open: false }));
  };

  const handleCloseAdjuntosDialog = () => {
    setOpenAdjuntosDialog(false);
    setAdjuntosSeleccionados(null);
  };

  const handleVerAdjunto = async (progresoId: string, index: number, adjuntoId: string) => {
    try {
      const res = await api.get(
        `/adjuntos/actividad/${progresoId}/${index}`,
        {
          params: { adjuntoId },
          responseType: 'blob'
        }
      );
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (e) {
      console.error('Error obteniendo adjunto', e);
    }
  };

  const handleDescargarAdjunto = async (
    adjunto: { _id: string; nombreArchivo: string },
    progresoId: string,
    index: number
  ) => {
    try {
      const res = await api.get(`/adjuntos/${adjunto._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', adjunto.nombreArchivo || 'adjunto');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error descargando adjunto', e);
      try {
        await handleVerAdjunto(progresoId, index, adjunto._id);
      } catch (innerError) {
        console.error('Error mostrando adjunto tras fallo de descarga', innerError);
      }
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
          firmaDigital
        }
      );
      handleCloseValidarDialog();
      fetchValidaciones();
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
          comentarios
        }
      );
      handleCloseRechazarDialog();
      fetchValidaciones();
    } catch (error) {
      console.error('Error al rechazar actividad:', error);
    } finally {
      setProcesando(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const combinedRecords = useMemo(
    () => [...pendientes, ...validadas, ...rechazadas],
    [pendientes, validadas, rechazadas]
  );

  const phaseOptions = useMemo(() => {
    const phasesMap = new Map<string, string>();
    combinedRecords.forEach((record) => {
      if (record.fase?._id) {
        phasesMap.set(record.fase._id, formatFase(record.fase));
      }
    });

    return Array.from(phasesMap.entries()).map(([id, label]) => ({ id, label }));
  }, [combinedRecords, t]);

  const getDateForFilter = (record: any) => {
    if (record?.actividad?.estado === 'validado') return record.actividad?.fechaValidacion;
    if (record?.actividad?.estado === 'rechazado') return record.actividad?.fechaRechazo;
    return record?.fechaCreacion;
  };

  const matchesFilters = (record: any) => {
    const resident = record.residente || {};
    const residentName = `${resident.nombre || ''} ${resident.apellidos || ''}`.trim().toLowerCase();
    const residentEmail = (resident.email || '').toLowerCase();
    const searchValue = filters.participantQuery.trim().toLowerCase();

    if (filters.participantType !== 'all' && resident.tipo !== filters.participantType) {
      return false;
    }

    if (filters.societyId !== 'all') {
      const societyId = typeof resident.sociedad === 'object' ? resident.sociedad?._id : resident.sociedad;
      if (societyId !== filters.societyId) return false;
    }

    if (filters.hospitalId !== 'all') {
      const hospitalId = typeof resident.hospital === 'object' ? resident.hospital?._id : resident.hospital;
      if (hospitalId !== filters.hospitalId) return false;
    }

    if (searchValue && !residentName.includes(searchValue) && !residentEmail.includes(searchValue)) {
      return false;
    }

    if (filters.phaseId !== 'all' && record.fase?._id !== filters.phaseId) {
      return false;
    }

    if (filters.status !== 'all' && record.estado !== filters.status) {
      return false;
    }

    const recordDate = getDateForFilter(record);
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (!recordDate || new Date(recordDate) < fromDate) return false;
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (!recordDate || new Date(recordDate) > toDate) return false;
    }

    return true;
  };

  const filteredPendientes = useMemo(
    () => pendientes.filter(matchesFilters),
    [pendientes, filters]
  );
  const filteredValidadas = useMemo(
    () => validadas.filter(matchesFilters),
    [validadas, filters]
  );
  const filteredRechazadas = useMemo(
    () => rechazadas.filter(matchesFilters),
    [rechazadas, filters]
  );

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('adminValidations.title')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchValidaciones}
        >
          {t('adminValidations.actions.refresh')}
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
    {t('adminValidations.filters.title')}
  </Typography>

  {/* Sin Grid: flex + wrap (responsive y sin dramas) */}
  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 2
    }}
  >
    {/* Tipo participante */}
    <Box sx={{ flex: '1 1 260px', minWidth: 240 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="tipo-participante-label">
          {t('adminValidations.filters.participantType')}
        </InputLabel>
        <Select
          id="tipo-participante-select"
          labelId="tipo-participante-label"
          value={filters.participantType}
          label={t('adminValidations.filters.participantType')}
          onChange={(event) => handleFilterChange('participantType', event.target.value)}
        >
          <MenuItem value="all">{t('adminValidations.filters.all')}</MenuItem>
          <MenuItem value="Programa Residentes">{t('adminValidations.filters.residentsProgram')}</MenuItem>
          <MenuItem value="Programa Sociedades">{t('adminValidations.filters.societies')}</MenuItem>
        </Select>
      </FormControl>
    </Box>

    {/* Sociedad */}
    <Box sx={{ flex: '1 1 260px', minWidth: 240 }}>
      <FormControl
        fullWidth
        size="small"
        disabled={filters.participantType === 'Programa Residentes'}
      >
        <InputLabel id="sociedad-label">
          {t('adminValidations.filters.society')}
        </InputLabel>
        <Select
          id="sociedad-select"
          labelId="sociedad-label"
          value={filters.societyId}
          label={t('adminValidations.filters.society')}
          onChange={(event) => handleFilterChange('societyId', event.target.value)}
        >
          <MenuItem value="all">{t('adminValidations.filters.all')}</MenuItem>
          {sociedades.map((sociedad) => (
            <MenuItem key={sociedad._id} value={sociedad._id}>
              {sociedad.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>

    {/* Hospital */}
    <Box sx={{ flex: '1 1 260px', minWidth: 240 }}>
      <FormControl
        fullWidth
        size="small"
        disabled={filters.participantType === 'Programa Sociedades'}
      >
        <InputLabel id="hospital-label">
          {t('adminValidations.filters.hospital')}
        </InputLabel>
        <Select
          id="hospital-select"
          labelId="hospital-label"
          value={filters.hospitalId}
          label={t('adminValidations.filters.hospital')}
          onChange={(event) => handleFilterChange('hospitalId', event.target.value)}
        >
          <MenuItem value="all">{t('adminValidations.filters.all')}</MenuItem>
          {hospitales.map((hospital) => (
            <MenuItem key={hospital._id} value={hospital._id}>
              {hospital.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>

    {/* Participante (texto) */}
    <Box sx={{ flex: '2 1 360px', minWidth: 260 }}>
      <TextField
        fullWidth
        size="small"
        label={t('adminValidations.filters.participant')}
        value={filters.participantQuery}
        onChange={(event) => handleFilterChange('participantQuery', event.target.value)}
        placeholder={t('adminValidations.filters.participantPlaceholder')}
      />
    </Box>

    {/* Fase */}
    <Box sx={{ flex: '1 1 260px', minWidth: 240 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="fase-label">
          {t('adminValidations.filters.phase')}
        </InputLabel>
        <Select
          id="fase-select"
          labelId="fase-label"
          value={filters.phaseId}
          label={t('adminValidations.filters.phase')}
          onChange={(event) => handleFilterChange('phaseId', event.target.value)}
        >
          <MenuItem value="all">{t('adminValidations.filters.all')}</MenuItem>
          {phaseOptions.map((fase) => (
            <MenuItem key={fase.id} value={fase.id}>
              {fase.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>

    {/* Estado */}
    <Box sx={{ flex: '1 1 260px', minWidth: 240 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="estado-label">
          {t('adminValidations.filters.status')}
        </InputLabel>
        <Select
          id="estado-select"
          labelId="estado-label"
          value={filters.status}
          label={t('adminValidations.filters.status')}
          onChange={(event) => handleFilterChange('status', event.target.value)}
        >
          <MenuItem value="all">{t('adminValidations.filters.all')}</MenuItem>
          <MenuItem value="pendiente">{t('adminValidations.filters.statusPending')}</MenuItem>
          <MenuItem value="validado">{t('adminValidations.filters.statusValidated')}</MenuItem>
          <MenuItem value="rechazado">{t('adminValidations.filters.statusRejected')}</MenuItem>
        </Select>
      </FormControl>
    </Box>

    {/* Desde */}
    <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
      <TextField
        fullWidth
        size="small"
        type="date"
        label={t('adminValidations.filters.dateFrom')}
        InputLabelProps={{ shrink: true }}
        value={filters.dateFrom}
        onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
      />
    </Box>

    {/* Hasta */}
    <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
      <TextField
        fullWidth
        size="small"
        type="date"
        label={t('adminValidations.filters.dateTo')}
        InputLabelProps={{ shrink: true }}
        value={filters.dateTo}
        onChange={(event) => handleFilterChange('dateTo', event.target.value)}
      />
    </Box>

    {/* Acciones */}
    <Box
      sx={{
        flex: '1 1 220px',
        minWidth: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: { xs: 'flex-start', sm: 'flex-end' }
      }}
    >
      <Button
        fullWidth
        variant="outlined"
        onClick={handleClearFilters}
        sx={{
          height: 40,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        {t('adminValidations.filters.clear')}
      </Button>
    </Box>
  </Box>
</Paper>


      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label={t('tutorValidations.tabs.aria')}
          >
            <Tab
              label={`${t('tutorValidations.tabs.pending')} (${filteredPendientes.length})`}
              id="admin-validaciones-tab-0"
              aria-controls="admin-validaciones-tabpanel-0"
            />
            <Tab
              label={`${t('tutorValidations.tabs.validated')} (${filteredValidadas.length})`}
              id="admin-validaciones-tab-1"
              aria-controls="admin-validaciones-tabpanel-1"
            />
            <Tab
              label={`${t('tutorValidations.tabs.rejected')} (${filteredRechazadas.length})`}
              id="admin-validaciones-tab-2"
              aria-controls="admin-validaciones-tabpanel-2"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {filteredPendientes.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {t('adminValidations.empty.pending')}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={(theme) => getTableHeadStyles(theme)}>
                  <TableRow>
                    <TableCell>{t('tutorValidations.table.phase')}</TableCell>
                    <TableCell>{t('tutorValidations.table.activity')}</TableCell>
                    <TableCell>{t('tutorValidations.table.type')}</TableCell>
                    <TableCell>{t('tutorValidations.table.resident')}</TableCell>
                    <TableCell>{t('tutorValidations.table.date')}</TableCell>
                    <TableCell>{t('tutorValidations.table.surgeryType')}</TableCell>
                    <TableCell>{t('tutorValidations.table.surgeon')}</TableCell>
                    <TableCell>{t('tutorValidations.table.participation')}</TableCell>
                    <TableCell>{t('tutorValidations.table.comments')}</TableCell>
                    <TableCell align="right">{t('tutorValidations.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPendientes.map((progreso) => (
                    <TableRow key={progreso._id}>
                      <TableCell>{formatFase(progreso.fase)}</TableCell>
                      <TableCell>{renderActivityCell(progreso)}</TableCell>
                      <TableCell>{progreso.actividad?.tipo || '-'}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {progreso.residente?.nombre || '—'} {progreso.residente?.apellidos || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {progreso.residente?.email || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDayMonthYear(progreso.fechaCreacion)}</TableCell>
                      <TableCell>{getSurgeryType(progreso.actividad?.cirugia, progreso.actividad?.otraCirugia)}</TableCell>
                      <TableCell>{progreso.actividad?.nombreCirujano || '-'}</TableCell>
                      <TableCell>
                        {progreso.actividad?.tipo === 'cirugia'
                          ? progreso.actividad?.porcentajeParticipacion ?? '-'
                          : '-'}
                      </TableCell>
                      <TableCell>{progreso.actividad?.comentariosResidente || '-'}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {progreso.adjuntos?.length > 0 && (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleOpenAdjuntosDialog(progreso)}
                              sx={actionButtonStyles}
                            >
                              {`${t('tutorValidations.buttons.viewAttachment')} (${progreso.adjuntos.length})`}
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() =>
                              handleOpenValidarDialog({
                                progresoId: progreso.progresoId || progreso._id.split('-')[0],
                                index: progreso.index,
                                ...progreso
                              })
                            }
                            sx={actionButtonStyles}
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
                            sx={actionButtonStyles}
                          >
                            {t('tutorValidations.buttons.reject')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {filteredValidadas.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {t('adminValidations.empty.validated')}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={(theme) => getTableHeadStyles(theme)}>
                  <TableRow>
                    <TableCell>{t('tutorValidations.table.phase')}</TableCell>
                    <TableCell>{t('tutorValidations.table.activity')}</TableCell>
                    <TableCell>{t('tutorValidations.table.type')}</TableCell>
                    <TableCell>{t('tutorValidations.table.resident')}</TableCell>
                    <TableCell>{t('tutorValidations.table.date')}</TableCell>
                    <TableCell>{t('tutorValidations.table.surgeryType')}</TableCell>
                    <TableCell>{t('tutorValidations.table.surgeon')}</TableCell>
                    <TableCell>{t('tutorValidations.table.participation')}</TableCell>
                    <TableCell>{t('tutorValidations.table.comments')}</TableCell>
                    <TableCell>{t('adminValidations.table.validator')}</TableCell>
                    <TableCell align="right">{t('tutorValidations.table.state')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredValidadas.map((progreso) => (
                    <TableRow key={progreso._id}>
                      <TableCell>{formatFase(progreso.fase)}</TableCell>
                      <TableCell>{renderActivityCell(progreso)}</TableCell>
                      <TableCell>{progreso.actividad?.tipo || '-'}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {progreso.residente?.nombre} {progreso.residente?.apellidos}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {progreso.residente?.email || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDayMonthYear(progreso.actividad?.fechaValidacion || progreso.fechaCreacion)}</TableCell>
                      <TableCell>{getSurgeryType(progreso.actividad?.cirugia, progreso.actividad?.otraCirugia)}</TableCell>
                      <TableCell>{progreso.actividad?.nombreCirujano || '-'}</TableCell>
                      <TableCell>
                        {progreso.actividad?.tipo === 'cirugia'
                          ? progreso.actividad?.porcentajeParticipacion ?? '-'
                          : '-'}
                      </TableCell>
                      <TableCell>{progreso.actividad?.comentariosTutor || '-'}</TableCell>
                      <TableCell>{progreso.actividad?.firmaDigital || '-'}</TableCell>
                      <TableCell align="right">
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={t('tutorValidations.states.validated')}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {filteredRechazadas.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {t('adminValidations.empty.rejected')}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={(theme) => getTableHeadStyles(theme)}>
                  <TableRow>
                    <TableCell>{t('tutorValidations.table.phase')}</TableCell>
                    <TableCell>{t('tutorValidations.table.activity')}</TableCell>
                    <TableCell>{t('tutorValidations.table.type')}</TableCell>
                    <TableCell>{t('tutorValidations.table.resident')}</TableCell>
                    <TableCell>{t('tutorValidations.table.date')}</TableCell>
                    <TableCell>{t('tutorValidations.table.surgeryType')}</TableCell>
                    <TableCell>{t('tutorValidations.table.surgeon')}</TableCell>
                    <TableCell>{t('tutorValidations.table.participation')}</TableCell>
                    <TableCell>{t('tutorValidations.table.reason')}</TableCell>
                    <TableCell align="right">{t('tutorValidations.table.state')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRechazadas.map((progreso) => (
                    <TableRow key={progreso._id}>
                      <TableCell>{formatFase(progreso.fase)}</TableCell>
                      <TableCell>{renderActivityCell(progreso)}</TableCell>
                      <TableCell>{progreso.actividad?.tipo || '-'}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {progreso.residente?.nombre} {progreso.residente?.apellidos}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {progreso.residente?.email || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDayMonthYear(progreso.actividad?.fechaRechazo || progreso.fechaCreacion)}</TableCell>
                      <TableCell>{getSurgeryType(progreso.actividad?.cirugia, progreso.actividad?.otraCirugia)}</TableCell>
                      <TableCell>{progreso.actividad?.nombreCirujano || '-'}</TableCell>
                      <TableCell>
                        {progreso.actividad?.tipo === 'cirugia'
                          ? progreso.actividad?.porcentajeParticipacion ?? '-'
                          : '-'}
                      </TableCell>
                      <TableCell>{progreso.actividad?.comentariosRechazo || '-'}</TableCell>
                      <TableCell align="right">
                        <Chip
                          icon={<ErrorIcon />}
                          label={t('tutorValidations.states.rejected')}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      <Dialog
        open={descripcionDialog.open}
        onClose={handleCloseDescripcionDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {descripcionDialog.title || t('tutorValidations.table.noName')}
        </DialogTitle>
        <DialogContent>
          <RichTextViewer
            content={descripcionDialog.description}
            variant="inline"
            minHeight={0}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDescripcionDialog}>{t('close')}</Button>
        </DialogActions>
      </Dialog>

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

      <Dialog open={openAdjuntosDialog} onClose={handleCloseAdjuntosDialog} fullWidth maxWidth="sm">
        <DialogTitle>{t('tutorValidations.buttons.viewAttachment')}</DialogTitle>
        <DialogContent>
          {adjuntosSeleccionados?.adjuntos?.length ? (
            adjuntosSeleccionados.adjuntos.map((adjunto: any) => (
              <Box
                key={adjunto._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="subtitle1">{adjunto.nombreArchivo}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {adjunto.fechaSubida ? formatDayMonthYear(adjunto.fechaSubida) : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    onClick={() =>
                      handleVerAdjunto(
                        adjuntosSeleccionados.progresoId,
                        adjuntosSeleccionados.index,
                        adjunto._id
                      )
                    }
                    sx={attachmentButtonStyles}
                  >
                    {t('tutorValidations.buttons.viewAttachment')}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() =>
                      handleDescargarAdjunto(adjunto, adjuntosSeleccionados.progresoId, adjuntosSeleccionados.index)
                    }
                    sx={attachmentButtonStyles}
                  >
                    {t('common.download')}
                  </Button>
                </Box>
              </Box>
            ))
          ) : (
            <DialogContentText>
              {t('tutorValidations.messages.noAttachments')}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdjuntosDialog}>{t('tutorValidations.buttons.cancel')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminValidaciones;
