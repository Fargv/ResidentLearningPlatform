import React, { useState, useEffect } from "react";
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
  Button,
  Backdrop,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { formatMonthYear, formatDayMonthYear } from "../../utils/date";
import { Sociedad } from "../../types/Sociedad";
import { useTranslation } from 'react-i18next';
import type { Fase } from "../../components/ProgressPorFase";


const DashboardHome: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sociedadInfo, setSociedadInfo] = useState<Sociedad | null>(null);
  const [phaseSummary, setPhaseSummary] = useState<
    { name: string; percent: number }[]
 >([]);
  const [socPhaseSummary, setSocPhaseSummary] = useState<
    { phase: number; percent: number }[]
  >([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [socAllValidado, setSocAllValidado] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<{
    label: string;
    date?: string;
    description: React.ReactNode;
  } | null>(null);


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

  const handleOpenDialog = (phase: { label: string; date?: string; description: React.ReactNode }) => {

     setSelectedPhase(phase);
    setOpenDialog(true);
  };

  const onFaseClick = (_fase: Fase, idx: number) =>
    handleOpenDialog(residentMilestones[idx]);

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
        ["residente", "formador", "coordinador", "instructor", "alumno"].includes(
          user.rol,
        );
      const isSociedades =
        user?.tipo === "Programa Sociedades" &&
        user?.rol === "alumno" &&
        !!user?._id;

      if (!isResidentes && !isSociedades) {
        return;
      }
      try {
        setProgressLoading(true);
        const res = await api.get(`/progreso/residente/${user._id}`);
        const data = res.data.data || [];

        if (isResidentes) {
          const summary = data.map((p: any) => {
            const total = p.actividades.length;
            const validated = p.actividades.filter(
              (a: any) => a.estado === "validado",
            ).length;
            const percent = total > 0 ? Math.round((validated / total) * 100) : 0;
            return { name: p.fase.nombre, percent };
          });
          setPhaseSummary(summary);
        }

        if (isSociedades) {
          const socFases = data
            .filter((p: any) => p.faseModel === 'FaseSoc')
            .sort(
              (a: any, b: any) =>
                (a.fase?.orden ?? 0) - (b.fase?.orden ?? 0)
            );
          const socSummary = socFases.map((p: any) => {
            const total = p.actividades.length;
            const validated = p.actividades.filter(
              (a: any) => a.estado === 'validado'
            ).length;
            const percent = total > 0 ? Math.round((validated / total) * 100) : 0;
            return { phase: p.fase.orden, percent };
          });
          setSocPhaseSummary(socSummary);
          const allValidado =
            socFases.length > 0 &&
            socFases.every((p: any) => p.estadoGeneral === 'validado');
          setSocAllValidado(allValidado);
        }
      } catch (err) {
        console.error("Error cargando progreso", err);
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

  const navigate = useNavigate();

  type Action = {
    label: string;
    path: string;
    icon: React.ReactNode;
  };

  const actions: Action[] = [];

  if (user?.rol === "residente" || user?.rol === "alumno") {
    actions.push({
      label: t('actions.myProgress'),
      path: "/dashboard/progreso",
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
    });
  }

  if (
    user?.rol === "residente" ||
    user?.rol === "alumno" ||
    user?.rol === "instructor"
  ) {
    actions.push({
      label: t('actions.trainingPhases'),
      path: "/dashboard/fases",
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
    });
  }

  if (user?.rol === "formador" || user?.rol === "coordinador" || user?.rol === "instructor") {
    actions.push({
      label: t('actions.validations'),
      path: "/dashboard/validaciones",
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    });
  }

  if (user?.rol === "formador" || user?.rol === "coordinador") {
    actions.push({
      label: t('actions.myUsers'),
      path: "/dashboard/usuarios",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
    });
  }

  if (user?.rol === "administrador") {
    actions.push(
      {
        label: t('actions.usersProgress'),
        path: "/dashboard/progreso-usuarios",
        icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
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
    (user?.rol === 'residente' || user?.rol === 'alumno') &&
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
      case "formador":
        return hospital ? t('role.trainer', { hospital }) : "";
      case "coordinador":
        return hospital ? t('role.coordinator', { hospital }) : "";
      case "residente":
        return hospital ? t('role.resident', { hospital }) : "";
      case "alumno":
        return sociedadInfo?.titulo
          ? t('role.student', { title: sociedadInfo.titulo })
          : "";
      case "instructor":
        return sociedadInfo?.titulo
          ? t('role.instructor', { title: sociedadInfo.titulo })
          : "";
      default:
        return "";
    }
  };

 return (
    <Box>
      <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('welcome', { name: user?.nombre })}
          </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {getRoleSubtitle()}
        </Typography>
      </Box>
      {user?.tipo === "Programa Sociedades" && sociedadInfo && (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {sociedadInfo.titulo}
            </Typography>
          <Chip
            label={sociedadInfo.status}
            color={sociedadInfo.status === "ACTIVO" ? "success" : "default"}
            size="small"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {societyMilestones.map((m, idx) => {
              const percent =
                socPhaseSummary.find((s) => s.phase === m.phase)?.percent ?? 0;
              return (
                <CardActionArea
                  key={m.label}
                  onClick={() => handleOpenDialog(m)}
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      md:
                        idx === 0
                          ? "1 1 100%"
                          : "1 1 calc(50% - 16px)",
                    },
                    minWidth: { xs: "250px", md: "250px" },
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
                      p: 2,
                      borderLeft: "6px solid #1E5B94",
                      background: `linear-gradient(90deg, #E3F2FD ${percent}%, #F5F5F5 ${percent}%)`,
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
                      sx={{ color: '#1E5B94' }}
                    >
                      {formatMonthYear(m.date || "") || "—"}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ color: '#1E5B94' }}
                    >
                      {percent}%
                    </Typography>
                  </Paper>
                </CardActionArea>
              );
            })}
          </Box>
          {socAllValidado && (
            <Box textAlign="center" mt={2}>
              <Button
                variant="contained"
                onClick={handleDescargarCertificado}
                disabled={downloadLoading}
              >
                {t('residentProgress.downloadCertificate')}
              </Button>
            </Box>
          )}
       </Paper>
      )}
      {user?.tipo === "Programa Residentes" &&
        (user?.rol === "residente" ||
          user?.rol === "formador" ||
          user?.rol === "coordinador" ||
          user?.rol === "instructor" ||
          user?.rol === "alumno") &&
        phaseSummary.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                {t('progressByPhase')}
              </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {phaseSummary.map((p, idx) => (
                <CardActionArea
                  key={p.name}
                  onClick={() =>
                    onFaseClick(
                      { nombre: p.name, porcentaje: p.percent },
                      idx,
                    )
                  }
                  sx={{
                    flex: "1 1 calc(50% - 16px)",
                    minWidth: "250px",
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
                        p: 2,
                        borderLeft: "6px solid #1E5B94",
                        background: `linear-gradient(90deg, #E3F2FD  ${p.percent}%, #F5F5F5  ${p.percent}%)`,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        {p.name}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        sx={{
                          color: "text.secondary",
                          textShadow: 'none',
                        }}
                      >
                        {p.percent}%
                      </Typography>
                    </Paper>
                </CardActionArea>
              ))}
            </Box>
            {allValidado && (
              <Box textAlign="center" mt={2}>
                <Button
                  variant="contained"
                  onClick={handleDescargarCertificado}
                  disabled={downloadLoading}
                >
                  {t('residentProgress.downloadCertificate')}
                </Button>
              </Box>
            )}
          </Paper>
        )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        {actions.map((action) => (
          <Box
            key={action.label}
            sx={{
              width: {
                xs: "100%",
                sm: "48%",
                md: "31%",
                lg: "23%",
              },
            }}
          >
            <Card>
              <CardActionArea onClick={() => navigate(action.path)}>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  {action.icon}
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 1, textAlign: "center" }}
                  >
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
            {selectedPhase?.description}
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
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    );
  };

export default DashboardHome;
