import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardActionArea,
  CardContent,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  BugReport as BugReportIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { formatMonthYear, formatDayMonthYear } from '../../utils/date';
import { Sociedad } from '../../types/Sociedad';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [sociedadInfo, setSociedadInfo] = useState<Sociedad | null>(null);
  const [phaseSummary, setPhaseSummary] = useState<{ name: string; percent: number }[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<{ label: string; date?: string; description: string } | null>(null);

  const societyMilestones = [
    {
      label: 'Convocatoria',
      date: sociedadInfo?.fechaConvocatoria,
      description: 'Inicio del proceso de convocatoria.'
    },
    {
      label: 'Presentación',
      date: sociedadInfo?.fechaPresentacion,
      description: 'Sesión de presentación del programa.'
    },
    {
      label: 'Mod. Online',
      date: sociedadInfo?.fechaModulosOnline,
      description: 'Módulos formativos online.'
    },
    {
      label: 'Simulación',
      date: sociedadInfo?.fechaSimulacion,
      description: 'Prácticas de simulación.'
    },
    {
      label: 'First Assistant',
      date: sociedadInfo?.fechaAtividadesFirstAssistant,
      description: 'Actividades como primer asistente.'
    },
    {
      label: 'Step By Step',
      date: sociedadInfo?.fechaModuloOnlineStepByStep,
      description: 'Procedimientos Step By Step.'
    },
    {
      label: 'Hand On',
      date: sociedadInfo?.fechaHandOn,
      description: 'Entrenamiento práctico Hands On.'
    }
  ];

  const residentMilestones = societyMilestones;

  const handleOpenDialog = (phase: { label: string; date?: string; description: string }) => {
    setSelectedPhase(phase);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);
  useEffect(() => {
    const loadSociedad = async () => {
      if (user?.tipo !== 'Programa Sociedades') {
        setLoading(false);
        return;
      }

      const sociedadId = (user as any)?.sociedad?._id || (user as any)?.sociedad;
      if (!sociedadId) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/sociedades/${sociedadId}`);
        setSociedadInfo(res.data);
      } catch (err) {
        console.error('Error cargando sociedad', err);
      } finally {
        setLoading(false);
      }
    };

    loadSociedad();
  }, [user]);

  useEffect(() => {
    const loadProgress = async () => {
      if (user?.tipo !== 'Programa Residentes' || !user?._id) return;
      try {
        setProgressLoading(true);
        const res = await api.get(`/progreso/residente/${user._id}`);
        const data = res.data.data || [];
        const summary = data.map((p: any) => {
          const total = p.actividades.length;
          const validated = p.actividades.filter((a: any) => a.estado === 'validado').length;
          const percent = total > 0 ? Math.round((validated / total) * 100) : 0;
          return { name: p.fase.nombre, percent };
        });
        setPhaseSummary(summary);
      } catch (err) {
        console.error('Error cargando progreso', err);
      } finally {
        setProgressLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  const navigate = useNavigate();

  type Action = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const actions: Action[] = [];


  if (user?.rol === 'residente' || user?.rol === 'alumno') {
    actions.push(
      { label: 'Mi Progreso', path: '/dashboard/progreso', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
      { label: 'Fases Formativas', path: '/dashboard/fases', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> }
    );
  }

  if (user?.rol === 'formador' || user?.rol === 'instructor') {
    actions.push({ label: 'Validaciones', path: '/dashboard/validaciones', icon: <SchoolIcon sx={{ fontSize: 40 }} /> });
  }

  if (user?.rol === 'administrador') {
    actions.push(
      { label: 'Validaciones', path: '/dashboard/validaciones-admin', icon: <SchoolIcon sx={{ fontSize: 40 }} /> },
      { label: 'Usuarios', path: '/dashboard/usuarios', icon: <PeopleIcon sx={{ fontSize: 40 }} /> },
      { label: 'Hospitales', path: '/dashboard/hospitals', icon: <HospitalIcon sx={{ fontSize: 40 }} /> },
      { label: 'Sociedades', path: '/dashboard/sociedades', icon: <GroupIcon sx={{ fontSize: 40 }} /> },
      { label: 'Programa Residentes', path: '/dashboard/fases', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
      { label: 'Programa Sociedades', path: '/dashboard/fases-soc', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
      { label: 'Access Codes', path: '/dashboard/access-codes', icon: <SettingsIcon sx={{ fontSize: 40 }} /> },
      { label: 'Debug', path: '/dashboard/debug', icon: <BugReportIcon sx={{ fontSize: 40 }} /> }
    );
  }

  actions.push(
    { label: 'Mi Perfil', path: '/dashboard/perfil', icon: <PersonIcon sx={{ fontSize: 40 }} /> },
    { label: 'Notificaciones', path: '/dashboard/notificaciones', icon: <NotificationsIcon sx={{ fontSize: 40 }} /> }
  );

  const renderContent = () => {
    if (loading || progressLoading) {
      return (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) return <Alert severity="error">{error}</Alert>;

    return null;
  };

  const getRoleSubtitle = () => {
    if (!user) return '';
    const hospital = user.hospital?.nombre;
    switch (user.rol) {
      case 'administrador':
        return 'Panel de Administración';
      case 'formador':
        return hospital ? `Formador de residentes del hospital ${hospital}` : '';
      case 'residente':
        return hospital ? `Residente del hospital ${hospital}` : '';
      case 'alumno':
        return sociedadInfo?.titulo
          ? `Alumno del programa de sociedades ${sociedadInfo.titulo}`
          : '';
      case 'instructor':
        return sociedadInfo?.titulo
          ? `Instructor del programa de sociedades ${sociedadInfo.titulo}`
          : '';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bienvenido, {user?.nombre}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {getRoleSubtitle()}
        </Typography>
      </Box>
      {user?.tipo === 'Programa Sociedades' && sociedadInfo && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {sociedadInfo.titulo}
          </Typography>
          <Chip
            label={sociedadInfo.status}
            color={sociedadInfo.status === 'ACTIVO' ? 'success' : 'default'}
            size="small"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
  {societyMilestones.map((m) => (
              <CardActionArea
                key={m.label}
                onClick={() => handleOpenDialog(m)}
                sx={{
                  flex: '1 1 calc(50% - 16px)',
                  minWidth: '250px',
                  '&:hover': { backgroundColor: 'action.hover', transform: 'scale(1.02)' },
                  cursor: 'pointer'
                }}
              >
                <Paper
                  elevation={2}
                  sx={{ p: 2, borderLeft: '6px solid #1E5B94', backgroundColor: 'background.paper' }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    {m.label}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatMonthYear(m.date || '') || '—'}
                  </Typography>
                </Paper>
              </CardActionArea>
            ))}
          </Box>

       </Paper>
      )}
      {user?.tipo === 'Programa Residentes' &&
        (user?.rol === 'residente' || user?.rol === 'formador' || user?.rol === 'instructor') &&
        phaseSummary.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Progreso por fase
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {phaseSummary.map((p, idx) => (
                  <CardActionArea
                    key={p.name}
                    onClick={() => handleOpenDialog(residentMilestones[idx])}
                    sx={{
                      flex: '1 1 calc(50% - 16px)',
                      minWidth: '250px',
                      '&:hover': { backgroundColor: 'action.hover', transform: 'scale(1.02)' },
                      cursor: 'pointer'
                    }}
                  >
                    <Paper
                      elevation={2}
                      sx={{ p: 2, borderLeft: '6px solid #1E5B94', backgroundColor: 'background.paper' }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        {p.name}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {p.percent}%
                      </Typography>
                    </Paper>
                  </CardActionArea>
                ))}
              </Box>
          </Paper>
        )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
  {actions.map((action) => (
    <Box
      key={action.label}
      sx={{
        width: {
          xs: '100%',
          sm: '48%',
          md: '31%',
          lg: '23%'
        }
      }}
    >
      <Card>
        <CardActionArea onClick={() => navigate(action.path)}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            {action.icon}
            <Typography variant="subtitle1" sx={{ mt: 1, textAlign: 'center' }}>
              {action.label}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  ))}
</Box>

      {renderContent()}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedPhase?.label}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>{selectedPhase?.description}</Typography>
          {selectedPhase?.date && (
            <Typography variant="body2" color="text.secondary">
              {formatDayMonthYear(selectedPhase.date)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardHome;
