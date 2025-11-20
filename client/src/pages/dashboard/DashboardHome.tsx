import React, { useState, useEffect, useMemo } from "react";
import {
  Avatar,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Backdrop,
  Stack,
  useTheme,
  CardActionArea,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  WorkspacePremium as WorkspacePremiumIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { formatMonthYear, formatDayMonthYear } from "../../utils/date";
import { Sociedad } from "../../types/Sociedad";
import { useTranslation } from 'react-i18next';
import { alpha, lighten } from '@mui/material/styles';
import RichTextViewer from "../../components/RichTextViewer";
import { richTextOrUndefined } from "../../utils/richText";

interface ResidentPhaseSummary {
  name: string;
  percent: number;
  estadoGeneral: string;
  progresoId: string;
  faseNumero: number;
  hasSurgery: boolean;
  description?: string | null;
}

interface SocietyPhaseSummary {
  phase: number;
  percent: number;
  estadoGeneral: string;
  progresoId: string;
  hasSurgery: boolean;
  description?: string | null;
}

interface PhaseDialogData {
  label: string;
  date?: string;
  descriptionNode?: React.ReactNode;
  descriptionHtml?: string;
}

const DashboardHome: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const progressFillColor = useMemo(() => {
    const base = theme.palette.primary.main;
    return theme.palette.mode === 'dark'
      ? alpha(base, 0.5)
      : lighten(base, 0.65);
  }, [theme]);

  const progressEmptyColor = useMemo(
    () =>
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.08)
        : theme.palette.grey[200],
    [theme]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sociedadInfo, setSociedadInfo] = useState<Sociedad | null>(null);
  const [phaseSummary, setPhaseSummary] = useState<ResidentPhaseSummary[]>([]);
  const [socPhaseSummary, setSocPhaseSummary] = useState<SocietyPhaseSummary[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [socAllValidado, setSocAllValidado] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseDialogData | null>(null);


  const societyMilestones = [
    {
      phase: 1,
      label:
        t('society.convocatoria.label') +
        ' / ' +
        t('society.presentacion.label') +
        ' / ' +
        t('society.modOnline.label'),
      date: sociedadInfo?.fechaModulosOnline,
      description: (
        <>
          <Typography gutterBottom>
            {t('society.convocatoria.intro')}
          </Typography>
          <ul>
            <li>{t('society.convocatoria.item1')}</li>
            <li>{t('society.convocatoria.item2')}</li>
          </ul>
          <Typography gutterBottom sx={{ mt: 2 }}>
            {t('society.presentacion.intro')}
          </Typography>
          <ul>
            <li>{t('society.presentacion.item1')}</li>
            <li>{t('society.presentacion.item2')}</li>
          </ul>
          <Typography gutterBottom sx={{ mt: 2 }}>
            {t('society.modOnline.intro')}
          </Typography>
          <ul>
            <li>{t('society.modOnline.item1')}</li>
            <li>{t('society.modOnline.item2')}</li>
          </ul>
        </>
      ),
    },
    {
      phase: 2,
      label: t('society.simulacion.label'),
      date: sociedadInfo?.fechaSimulacion,
      description: (
        <>
          <Typography gutterBottom>
            {t('society.simulacion.intro')}
          </Typography>
          <ul>
            <li>{t('society.simulacion.item1')}</li>
            <li>{t('society.simulacion.item2')}</li>
          </ul>
        </>
      ),
    },
    {
      phase: 3,
      label: t('society.firstAssistant.label'),
      date: sociedadInfo?.fechaAtividadesFirstAssistant,
      description: (
        <>
          <Typography gutterBottom>
            {t('society.firstAssistant.intro')}
          </Typography>
          <ul>
            <li>{t('society.firstAssistant.item1')}</li>
            <li>{t('society.firstAssistant.item2')}</li>
          </ul>
        </>
      ),
    },
    {
      phase: 4,
      label: t('society.stepByStep.label'),
      date: sociedadInfo?.fechaModuloOnlineStepByStep,
      description: (
        <>
          <Typography gutterBottom>
            {t('society.stepByStep.intro')}
          </Typography>
          <ul>
            <li>{t('society.stepByStep.item1')}</li>
            <li>{t('society.stepByStep.item2')}</li>
          </ul>
        </>
      ),
    },
    {
      phase: 5,
      label: t('society.handsOn.label'),
      date: sociedadInfo?.fechaHandOn,
      description: (
        <>
          <Typography gutterBottom>
            {t('society.handsOn.intro')}
          </Typography>
          <ul>
            <li>{t('society.handsOn.item1')}</li>
            <li>{t('society.handsOn.item2')}</li>
          </ul>
        </>
      ),
    },
  ];

  const residentMilestones = [
    {
      label: t('residentMilestones.phase1.label'),
      description: t('residentMilestones.phase1.description'),
    },
    {
      label: t('residentMilestones.phase2.label'),
      description: t('residentMilestones.phase2.description'),
    },
    {
      label: t('residentMilestones.phase3.label'),
      description: t('residentMilestones.phase3.description'),
    },
    {
      label: t('residentMilestones.phase4.label'),
      description: t('residentMilestones.phase4.description'),
    },
  ];

  const getSocietyPhaseLabel = (phaseNumber: number) => {
    const milestone = societyMilestones.find((m) => m.phase === phaseNumber);
    return milestone?.label || `${t('adminPhases.phase')} ${phaseNumber}`;
  };

  const handleOpenDialog = (phase: PhaseDialogData) => {
    setSelectedPhase(phase);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);
  useEffect(() => {
    const loadSociedad = async () => {
      if (user?.tipo !== "Programa Sociedades") {
        setLoading(false);
        return;
      }

      const sociedadId =
        (user as any)?.sociedad?._id || (user as any)?.sociedad;
      if (!sociedadId) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/sociedades/${sociedadId}`);
        setSociedadInfo(res.data);
      } catch (err) {
        console.error("Error cargando sociedad", err);
      } finally {
        setLoading(false);
      }
    };

    loadSociedad();
  }, [user]);

  useEffect(() => {
    const loadProgress = async () => {
      const isResidentes =
        user?.tipo === "Programa Residentes" &&
        user?._id &&
        ["residente", "tutor", "profesor", "participante"].includes(user.rol);
      const isSociedades =
        user?.tipo === "Programa Sociedades" &&
        user?.rol === "participante" &&
        !!user?._id;

      if (!isResidentes && !isSociedades) {
        return;
      }
      try {
        setProgressLoading(true);
        const res = await api.get(`/progreso/residente/${user._id}`);
        const data = res.data.data || [];

        if (isResidentes) {
          const summary = data
            .filter((p: any) => p.faseModel === 'Fase')
            .map((p: any) => {
              const total = p.actividades.length;
              const validated = p.actividades.filter(
                (a: any) => a.estado === 'validado',
              ).length;
              const percent =
                total > 0 ? Math.round((validated / total) * 100) : 0;
              const hasSurgery = p.actividades.some(
                (a: any) => a.tipo === 'cirugia',
              );
              return {
                name: p.fase.nombre,
                percent,
                estadoGeneral: p.estadoGeneral,
                progresoId: p._id,
                faseNumero: p.fase.numero,
                hasSurgery,
                description: p.fase?.descripcion ?? null,
              };
            });
          setPhaseSummary(summary);
        }

        if (isSociedades) {
          const socFases = data
            .filter((p: any) => p.faseModel === 'FaseSoc')
            .sort(
              (a: any, b: any) =>
                (a.fase?.orden ?? 0) - (b.fase?.orden ?? 0),
            );
          const socSummary = socFases.map((p: any) => {
            const total = p.actividades.length;
            const validated = p.actividades.filter(
              (a: any) => a.estado === 'validado',
            ).length;
            const percent =
              total > 0 ? Math.round((validated / total) * 100) : 0;
            const hasSurgery = p.actividades.some(
              (a: any) => a.tipo === 'cirugia',
            );
            return {
              phase: p.fase.orden,
              percent,
              estadoGeneral: p.estadoGeneral,
              progresoId: p._id,
              hasSurgery,
              description: p.fase?.descripcion ?? null,
            };
          });
          setSocPhaseSummary(socSummary);
          const allValidado =
            socFases.length > 0 &&
            socFases.every((p: any) => p.estadoGeneral === 'validado');
          setSocAllValidado(allValidado);
        }
      } catch (err: any) {
        if (!(err?.response?.status === 404 && user?.rol === "csm")) {
          console.error("Error cargando progreso", err);
        }
      } finally {
        setProgressLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  const handleDescargarCertificado = async () => {
    if (!user?._id) return;
    setDownloadLoading(true);
    try {
      const res = await api.get(`/certificado/${user._id}?lang=${i18n.language}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificado.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error || t('residentProgress.downloadError'));
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDescargarInformeCirugias = async (
    progresoId: string,
    nombreFase: string,
  ) => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informe-cirugias/${progresoId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const nombreUsuario = (user as any)?.nombre || (user as any)?.email || 'usuario';
      link.href = url;
      link.setAttribute(
        'download',
        `informe-cirugias-${nombreFase}_${nombreUsuario}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(t('residentProgress.downloadSurgeryReportError'));
    } finally {
      setDownloadLoading(false);
    }
  };

  const navigate = useNavigate();

  type Action = {
    label: string;
    path: string;
    icon: React.ReactNode;
  };

  const actions: Action[] = [];

  if (
    user?.rol === "residente" ||
    user?.rol === "participante" ||
    user?.rol === "profesor"
  ) {
    actions.push({
      label: t('actions.trainingPhases'),
      path: "/dashboard/fases",
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
    });
  }

  if (user?.rol === "tutor" || user?.rol === "csm" || user?.rol === "profesor") {
    actions.push({
      label: t('actions.validations'),
      path: "/dashboard/validaciones",
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    });
  }

  if (user?.rol === "tutor" || user?.rol === "csm") {
    actions.push({
      label: t('actions.myUsers'),
      path: "/dashboard/usuarios",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
    });
  }

  if (user?.rol === "administrador") {
    actions.push(
      {
        label: t('actions.reports'),
        path: "/dashboard/informes",
        icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      },
      {
        label: t('actions.settings'),
        path: "/dashboard/config",
        icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      }
    );
  }

  actions.push(
    {
      label: t('actions.myProfile'),
      path: "/dashboard/perfil",
      icon: <PersonIcon sx={{ fontSize: 40 }} />,
    },
    {
      label: t('actions.notifications'),
      path: "/dashboard/notificaciones",
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
    },
  );

  const allValidado =
    user?.tipo === 'Programa Residentes' &&
    (user?.rol === 'residente' || user?.rol === 'participante') &&
    phaseSummary.length > 0 &&
    phaseSummary.every((p) => p.percent === 100);

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
    if (!user) return "";
    const hospital = user.hospital?.nombre;
    switch (user.rol) {
      case "administrador":
        return t('role.adminPanel');
      case "tutor":
        return hospital ? t('role.tutor', { hospital }) : "";
      case "csm":
        return hospital ? t('role.csm', { hospital }) : "";
      case "residente":
        return hospital ? t('role.resident', { hospital }) : "";
      case "participante":
        return sociedadInfo?.titulo
          ? t('role.participant', { title: sociedadInfo.titulo })
          : "";
      case "profesor":
        return sociedadInfo?.titulo
          ? t('role.professor', { title: sociedadInfo.titulo })
          : "";
      default:
        return "";
    }
  };

  const initials = useMemo(() => {
    const first = user?.nombre?.[0] || user?.email?.[0] || "";
    const last = user?.apellidos?.[0] || "";
    const letters = `${first}${last}`;
    return letters ? letters.toUpperCase() : "?";
  }, [user?.apellidos, user?.email, user?.nombre]);

  const heroChips = useMemo(
    () => [
      { key: "role", label: t('profile.status.role'), value: user?.rol || t('common.none') },
      { key: "program", label: t('profile.status.program'), value: user?.tipo || t('common.none') },
      { key: "hospital", label: t('profile.status.hospital'), value: user?.hospital?.nombre },
      { key: "zone", label: t('profile.status.zone'), value: user?.zona },
      { key: "specialty", label: t('profile.status.specialty'), value: user?.especialidad },
      { key: "society", label: t('profile.fields.society'), value: sociedadInfo?.titulo },
    ].filter((chip) => !!chip.value),
    [sociedadInfo?.titulo, t, user?.especialidad, user?.hospital?.nombre, user?.rol, user?.tipo, user?.zona],
  );

  const societyDownloadButtons = socPhaseSummary
    .filter((phase) => phase.estadoGeneral === 'validado' && phase.hasSurgery)
    .map((phase) => {
      const displayLabel = getSocietyPhaseLabel(phase.phase);
      return {
        key: `soc-${phase.progresoId}`,
        label: t('residentProgress.downloadSurgeryReport', { phase: displayLabel }),
        onClick: () =>
          handleDescargarInformeCirugias(
            phase.progresoId,
            `${t('adminPhases.phase')} ${phase.phase}`,
          ),
      };
    });

  const residentDownloadButtons = phaseSummary
    .filter((phase) => phase.estadoGeneral === 'validado' && phase.hasSurgery)
    .map((phase) => ({
      key: `res-${phase.progresoId}`,
      label: t('residentProgress.downloadSurgeryReport', { phase: phase.name }),
      onClick: () =>
        handleDescargarInformeCirugias(
          phase.progresoId,
          `${t('adminPhases.phase')} ${phase.faseNumero}`,
        ),
    }));

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 50%' } }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 64, height: 64, fontSize: 28 }}>
                  {initials}
                </Avatar>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    {t('profile.overview')}
                  </Typography>
                  <Typography variant="h4" component="h1">
                    {t('welcome', { name: user?.nombre || user?.email })}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {getRoleSubtitle()}
                  </Typography>
                </Box>
              </Stack>
              {!!heroChips.length && <Divider sx={{ my: 3 }} />}
              {!!heroChips.length && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {heroChips.map((chip) => (
                    <Chip
                      key={chip.key}
                      label={`${chip.label}: ${chip.value}`}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 50%' } }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {t('actions.dashboard')}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
                {actions.map((action) => (
                  <Box
                    key={action.label}
                    component="button"
                    type="button"
                    onClick={() => navigate(action.path)}
                    sx={{
                      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(33% - 16px)' },
                      border: 'none',
                      background: 'transparent',
                      p: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      mb: 2,
                    }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        px: 3,
                        py: 2.5,
                        height: '100%',
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: 1,
                        borderRadius: 2,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ color: 'primary.main', '& svg': { fontSize: 36 } }}>{action.icon}</Box>
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>
                        {action.label}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Stack>
        {user?.tipo === "Programa Sociedades" && sociedadInfo && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {sociedadInfo.titulo}
            </Typography>
            <Chip
              label={sociedadInfo.status}
              color={sociedadInfo.status === "ACTIVO" ? "success" : "default"}
              size="small"
              sx={{ mb: 2 }}
            />
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              justifyContent="center"
              rowGap={2}
            >
              {societyMilestones.map((m, idx) => {
                const phaseData = socPhaseSummary.find((s) => s.phase === m.phase);
                const percent = phaseData?.percent ?? 0;
                return (
                  <Box
                    key={m.label}
                    sx={{
                      flex: {
                        xs: '1 1 100%',
                        md: idx === 0 ? '1 1 100%' : '1 1 calc(50% - 1rem)',
                      },
                      minWidth: { xs: '250px', md: '250px' },
                      mb: 2,
                    }}
                  >
                    <CardActionArea
                      onClick={() => {
                        const phaseDescription = richTextOrUndefined(
                          phaseData?.description,
                        );
                        handleOpenDialog({
                          label: m.label,
                          date: m.date,
                          descriptionHtml: phaseDescription,
                          descriptionNode: phaseDescription ? undefined : m.description,
                        });
                      }}
                      sx={{
                        "&:hover": {
                          backgroundColor: "action.hover",
                          transform: "scale(1.02)",
                        },
                        cursor: "pointer",
                      }}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          px: 2,
                          pt: 3,
                          pb: 2.5,
                          minHeight: 150,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          borderLeft: `6px solid ${theme.palette.primary.main}`,
                          background: `linear-gradient(90deg, ${progressFillColor} ${percent}%, ${progressEmptyColor} ${percent}%)`,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ color: 'text.secondary' }}
                        >
                          {m.label}
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          sx={{ color: theme.palette.primary.main }}
                        >
                          {formatMonthYear(m.date || "") || "—"}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            color: theme.palette.primary.main,
                          }}
                        >
                          {percent}%
                        </Typography>
                      </Paper>
                    </CardActionArea>
                  </Box>
                );
              })}
            </Stack>
            {(societyDownloadButtons.length > 0 || socAllValidado) && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                flexWrap="wrap"
                mt={3}
              >
                {societyDownloadButtons.map((button) => (
                  <Button
                    key={button.key}
                    variant="contained"
                    onClick={button.onClick}
                    disabled={downloadLoading}
                  >
                    {button.label}
                  </Button>
                ))}
                {socAllValidado && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDescargarCertificado}
                    disabled={downloadLoading}
                    startIcon={<WorkspacePremiumIcon />}
                  >
                    {t('residentProgress.downloadCertificate')}
                  </Button>
                )}
              </Stack>
            )}
          </Paper>
        )}
        {user?.tipo === "Programa Residentes" &&
          (user?.rol === "residente" ||
            user?.rol === "tutor" ||
            user?.rol === "csm" ||
            user?.rol === "profesor" ||
            user?.rol === "participante") &&
          phaseSummary.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('progressByPhase')}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
                {phaseSummary.map((p, idx) => (
                  <Box
                    key={p.progresoId}
                    sx={{
                      flex: '1 1 calc(50% - 16px)',
                      minWidth: '250px',
                      mb: 2,
                    }}
                  >
                    <CardActionArea
                      onClick={() => {
                        const descriptionHtml = richTextOrUndefined(p.description);
                        handleOpenDialog({
                          label: p.name,
                          descriptionHtml,
                          descriptionNode: descriptionHtml
                            ? undefined
                            : residentMilestones[idx]?.description,
                        });
                      }}
                      sx={{
                        "&:hover": {
                          backgroundColor: "action.hover",
                          transform: "scale(1.02)",
                        },
                        cursor: "pointer",
                      }}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          px: 2,
                          pt: 3,
                          pb: 2.5,
                          minHeight: 150,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          borderLeft: `6px solid ${theme.palette.primary.main}`,
                          background: `linear-gradient(90deg, ${progressFillColor} ${p.percent}%, ${progressEmptyColor} ${p.percent}%)`,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          {p.name}
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          sx={{
                            color: theme.palette.primary.main,
                            textShadow: 'none',
                          }}
                        >
                          {p.percent}%
                        </Typography>
                      </Paper>
                    </CardActionArea>
                  </Box>
                ))}
              </Stack>
              {(residentDownloadButtons.length > 0 || allValidado) && (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                  flexWrap="wrap"
                  mt={3}
                >
                  {residentDownloadButtons.map((button) => (
                    <Button
                      key={button.key}
                      variant="contained"
                      onClick={button.onClick}
                      disabled={downloadLoading}
                    >
                      {button.label}
                    </Button>
                  ))}
                  {allValidado && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleDescargarCertificado}
                      disabled={downloadLoading}
                      startIcon={<WorkspacePremiumIcon />}
                    >
                      {t('residentProgress.downloadCertificate')}
                    </Button>
                  )}
                </Stack>
              )}
            </Paper>
          )}
      </Stack>

      {renderContent()}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{selectedPhase?.label}</DialogTitle>
          <DialogContent>
            {selectedPhase?.descriptionHtml ? (
              <RichTextViewer
                content={selectedPhase.descriptionHtml}
                variant="inline"
                minHeight={0}
                sx={{
                  '& > :last-child': { mb: 0 },
                  '& p': { mb: 1.5 },
                }}
              />
            ) : selectedPhase?.descriptionNode ? (
              selectedPhase.descriptionNode
            ) : (
              <Typography color="text.secondary">{t('common.none')}</Typography>
            )}
            {selectedPhase?.date && (
              <Typography variant="body2" color="text.secondary">
                {formatDayMonthYear(selectedPhase.date)}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('close')}</Button>
          </DialogActions>
        </Dialog>
        <Backdrop
          open={downloadLoading}
          sx={{ color: theme.palette.common.white, zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    );
  };

export default DashboardHome;
