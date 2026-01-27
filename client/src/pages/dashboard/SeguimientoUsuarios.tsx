import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDayMonthYear } from '../../utils/date';
import { getCurrentPhaseLabel } from '../../utils/followUp';

interface SeguimientoSummary {
  user: {
    _id: string;
    nombre: string;
    apellidos: string;
    email: string;
    tipo?: string;
    hospital?: { _id?: string; nombre?: string } | null;
    sociedad?: { _id?: string; titulo?: string } | null;
  };
  faseActual?: { _id: string; nombre?: string; numero?: number } | null;
  estadoFaseActual?: 'en_progreso' | 'completadas' | 'sin_iniciar' | null;
  progreso: {
    total: number;
    validadas: number;
    porcentaje: number;
  };
  pendientesValidacion: number;
  ultimaActualizacion?: string | null;
  estadoGeneral:
    | 'al_dia'
    | 'pendiente_validacion'
    | 'progreso_completado'
    | 'en_curso'
    | 'sin_actividad';
}

const SeguimientoUsuarios: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SeguimientoSummary[]>([]);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);

  const programOptions = useMemo(() => {
    if (user?.rol === 'administrador') {
      return ['all', 'Programa Residentes', 'Programa Sociedades'];
    }
    if (user?.rol === 'csm') {
      return ['Programa Residentes'];
    }
    if (user?.tipo) {
      return [user.tipo];
    }
    return ['Programa Residentes', 'Programa Sociedades'];
  }, [user?.rol, user?.tipo]);

  const defaultProgram = programOptions[0] || 'Programa Residentes';

  const [filters, setFilters] = useState({
    program: defaultProgram,
    hospitalId: 'all',
    sociedadId: 'all',
    search: '',
    faseId: 'all',
    estado: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      program: defaultProgram
    }));
  }, [defaultProgram]);

  const statusConfig = useMemo(
    () => ({
      pendiente_validacion: {
        label: t('followUp.status.pendingValidation'),
        color: 'warning' as const
      },
      progreso_completado: {
        label: t('followUp.status.completedProgress'),
        color: 'success' as const
      },
      al_dia: { label: t('followUp.status.upToDate'), color: 'success' as const },
      en_curso: { label: t('followUp.status.inProgress'), color: 'info' as const },
      sin_actividad: { label: t('followUp.status.noActivity'), color: 'default' as const }
    }),
    [t]
  );

  const fetchFiltersData = useCallback(async () => {
    try {
      const [hospitalRes, societyRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/sociedades')
      ]);
      const hospitalsData = hospitalRes.data?.data || [];
      const societiesData = societyRes.data?.data || [];
      const filteredHospitals = user?.rol === 'csm' && user?.zona
        ? hospitalsData.filter((hospital: any) =>
            hospital?.zona?.toUpperCase() === user.zona?.toUpperCase()
          )
        : hospitalsData;
      setHospitals(filteredHospitals);
      setSocieties(societiesData);
    } catch {
      setHospitals([]);
      setSocieties([]);
    }
  }, [user?.rol, user?.zona]);

  const fetchPhases = useCallback(async () => {
    try {
      if (filters.program === 'all') {
        setPhases([]);
        return;
      }
      const endpoint = filters.program === 'Programa Sociedades' ? '/fases-soc' : '/fases';
      const response = await api.get(endpoint);
      setPhases(response.data?.data || []);
    } catch {
      setPhases([]);
    }
  }, [filters.program]);

  const fetchSeguimiento = useCallback(async () => {
    if (user?.rol === 'csm' && !user?.zona) {
      setData([]);
      setEmptyMessage(t('followUp.empty.noZone'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params: Record<string, string> = {
        programa: filters.program,
        hospitalId: filters.hospitalId,
        sociedadId: filters.sociedadId,
        search: filters.search,
        faseId: filters.faseId,
        estado: filters.estado,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      };

      const response = await api.get('/progreso/seguimiento', { params });
      setData(response.data?.data || []);
      setEmptyMessage(response.data?.message || null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || t('followUp.error'));
    } finally {
      setLoading(false);
    }
  }, [filters, t, user?.rol, user?.zona]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  useEffect(() => {
    fetchSeguimiento();
  }, [fetchSeguimiento]);

  const handleClearFilters = () => {
    setFilters({
      program: defaultProgram,
      hospitalId: 'all',
      sociedadId: 'all',
      search: '',
      faseId: 'all',
      estado: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const showHospitalFilter = filters.program === 'Programa Residentes';
  const showSocietyFilter = filters.program === 'Programa Sociedades';
  const showPhaseFilter = filters.program !== 'all';

  const renderProgress = (summary: SeguimientoSummary) => (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {summary.progreso.validadas}/{summary.progreso.total} ({summary.progreso.porcentaje}%)
      </Typography>
      <LinearProgress variant="determinate" value={summary.progreso.porcentaje} />
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('followUp.title')}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>{t('followUp.filters.program')}</InputLabel>
            <Select
              label={t('followUp.filters.program')}
              value={filters.program}
              onChange={(event) =>
                setFilters((prev) => {
                  const nextProgram = event.target.value;
                  if (nextProgram === 'all') {
                    return {
                      ...prev,
                      program: nextProgram,
                      hospitalId: 'all',
                      sociedadId: 'all',
                      faseId: 'all'
                    };
                  }
                  return { ...prev, program: nextProgram };
                })
              }
              disabled={programOptions.length === 1}
            >
              {programOptions.map((program) => (
                <MenuItem key={program} value={program}>
                  {program === 'all'
                    ? t('followUp.filters.all')
                    : program === 'Programa Residentes'
                      ? t('followUp.programs.residents')
                      : t('followUp.programs.societies')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {showHospitalFilter && (
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel>{t('followUp.filters.hospital')}</InputLabel>
              <Select
                label={t('followUp.filters.hospital')}
                value={filters.hospitalId}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, hospitalId: event.target.value }))
                }
              >
                <MenuItem value="all">{t('followUp.filters.all')}</MenuItem>
                {hospitals.map((hospital) => (
                  <MenuItem key={hospital._id} value={hospital._id}>
                    {hospital.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {showSocietyFilter && (
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel>{t('followUp.filters.society')}</InputLabel>
              <Select
                label={t('followUp.filters.society')}
                value={filters.sociedadId}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, sociedadId: event.target.value }))
                }
              >
                <MenuItem value="all">{t('followUp.filters.all')}</MenuItem>
                {societies.map((society) => (
                  <MenuItem key={society._id} value={society._id}>
                    {society.titulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            size="small"
            label={t('followUp.filters.search')}
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />

          {showPhaseFilter && (
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>{t('followUp.filters.phase')}</InputLabel>
              <Select
                label={t('followUp.filters.phase')}
                value={filters.faseId}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, faseId: event.target.value }))
                }
              >
                <MenuItem value="all">{t('followUp.filters.all')}</MenuItem>
                {phases.map((phase: any) => (
                  <MenuItem key={phase._id} value={phase._id}>
                    {t('followUp.filters.phaseOption', { number: phase.numero, name: phase.nombre })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>{t('followUp.filters.status')}</InputLabel>
            <Select
              label={t('followUp.filters.status')}
              value={filters.estado}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, estado: event.target.value }))
              }
            >
              <MenuItem value="all">{t('followUp.filters.all')}</MenuItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label={t('followUp.filters.dateFrom')}
            InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
          />
          <TextField
            size="small"
            type="date"
            label={t('followUp.filters.dateTo')}
            InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
          />

          <Button variant="outlined" onClick={handleClearFilters}>
            {t('followUp.filters.clear')}
          </Button>
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && data.length === 0 && (
        <Alert severity="info">
          {emptyMessage || t('followUp.empty.noUsers')}
        </Alert>
      )}

      {!loading && !error && data.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('followUp.table.user')}</TableCell>
                <TableCell>{t('followUp.table.program')}</TableCell>
                <TableCell>{t('followUp.table.center')}</TableCell>
                <TableCell>{t('followUp.table.currentPhase')}</TableCell>
                <TableCell>{t('followUp.table.progress')}</TableCell>
                <TableCell>{t('followUp.table.pending')}</TableCell>
                <TableCell>{t('followUp.table.lastUpdate')}</TableCell>
                <TableCell>{t('followUp.table.status')}</TableCell>
                <TableCell align="right">{t('followUp.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((summary) => (
                <TableRow key={summary.user._id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {summary.user.nombre} {summary.user.apellidos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {summary.user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {summary.user.tipo === 'Programa Sociedades'
                      ? t('followUp.programs.societies')
                      : t('followUp.programs.residents')}
                  </TableCell>
                  <TableCell>
                    {summary.user.tipo === 'Programa Sociedades'
                      ? summary.user.sociedad?.titulo || '-'
                      : summary.user.hospital?.nombre || '-'}
                  </TableCell>
                  <TableCell>{getCurrentPhaseLabel(t, summary)}</TableCell>
                  <TableCell>{renderProgress(summary)}</TableCell>
                  <TableCell>{summary.pendientesValidacion}</TableCell>
                  <TableCell>
                    {summary.ultimaActualizacion
                      ? formatDayMonthYear(summary.ultimaActualizacion)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[summary.estadoGeneral]?.label}
                      color={statusConfig[summary.estadoGeneral]?.color}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate(`/dashboard/seguimiento/${summary.user._id}`, {
                          state: { from: 'seguimiento' }
                        })
                      }
                    >
                      {t('followUp.table.viewDetail')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SeguimientoUsuarios;
