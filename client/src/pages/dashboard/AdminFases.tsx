import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  //Assignment as AssignmentIcon
} from "@mui/icons-material";
import api from "../../api";
import { useTranslation, Trans } from "react-i18next";
import RichTextDescriptionField from "../../components/RichTextDescriptionField";

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
      id={`fases-tabpanel-${index}`}
      aria-labelledby={`fases-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminFases: React.FC = () => {
  const { t } = useTranslation();
  //const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //const [usuarios, setUsuariosLista] = useState<any[]>([]);
  const [fases, setFases] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openCrearFaseDialog, setOpenCrearFaseDialog] = useState(false);
  const [openEditarFaseDialog, setOpenEditarFaseDialog] = useState(false);
  const [openEliminarFaseDialog, setOpenEliminarFaseDialog] = useState(false);
  const [openCrearActividadDialog, setOpenCrearActividadDialog] =
    useState(false);
  const [openEditarActividadDialog, setOpenEditarActividadDialog] =
    useState(false);
  const [openEliminarActividadDialog, setOpenEliminarActividadDialog] =
    useState(false);
  const [selectedFase, setSelectedFase] = useState<any>(null);
  const [selectedActividad, setSelectedActividad] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hospitales, setHospitales] = useState<any[]>([]);
  const [faseFormData, setFaseFormData] = useState({
    numero: "",
    nombre: "",
    descripcion: "",
  });
  const [actividadFormData, setActividadFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "teórica",
    fase: "",
    orden: "",
    requiereAdjunto: false,
  });
  const [procesando, setProcesando] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [progresoVinculado, setProgresoVinculado] = useState<number | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      //const usuariosRes = await api.get('/users');
      //setUsuariosLista(usuariosRes.data.data);

      const hospitalesRes = await api.get("/hospitals");
      setHospitales(hospitalesRes.data.data);

      const fasesRes = await api.get("/fases");
      setFases(fasesRes.data.data);

      const actividadesRes = await api.get("/actividades");
      setActividades(actividadesRes.data.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t("adminPhases.errorForbidden"));
      } else {
        setError(err.response?.data?.error || t("adminPhases.errorLoadData"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handlers para Fases
  const handleOpenCrearFaseDialog = () => {
    setFaseFormData({
      numero: "",
      nombre: "",
      descripcion: "",
    });
    setOpenCrearFaseDialog(true);
  };

  const handleCloseCrearFaseDialog = () => {
    setOpenCrearFaseDialog(false);
  };

  const handleOpenEditarFaseDialog = (fase: any) => {
    setSelectedFase(fase);
    setFaseFormData({
      numero: fase.numero.toString(),
      nombre: fase.nombre,
      descripcion: fase.descripcion || "",
    });
    setOpenEditarFaseDialog(true);
  };

  const handleCloseEditarFaseDialog = () => {
    setOpenEditarFaseDialog(false);
    setSelectedFase(null);
  };

  const handleConfirmarEliminarFase = async (fase: any) => {
    try {
      setProcesando(true);
      const res = await api.get(`/progreso/fase/${fase._id}/count`);
      setProgresoVinculado(res.data.count);
      setSelectedFase(fase);
      setOpenEliminarFaseDialog(true);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: t("adminPhases.messages.checkProgressError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleCloseEliminarFaseDialog = () => {
    setOpenEliminarFaseDialog(false);
    setSelectedFase(null);
  };

  const handleFaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFaseFormData({
      ...faseFormData,
      [name]: value,
    });
  };

  const handleDescripcionChange = (descripcion: string) => {
    setFaseFormData((prev) => ({
      ...prev,
      descripcion,
    }));
  };

  const handleCrearFase = async () => {
    try {
      setProcesando(true);

      const res = await api.post("/fases", {
        ...faseFormData,
        numero: parseInt(faseFormData.numero),
      });

      // Actualizar lista de fases
      setFases([...fases, res.data.data]);

      handleCloseCrearFaseDialog();

      setSnackbar({
        open: true,
        message: t("adminPhases.messages.phaseCreated"),
        severity: "success",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error || t("adminPhases.messages.phaseCreateError"),
      );

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          t("adminPhases.messages.phaseCreateError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEditarFase = async () => {
    if (!selectedFase) return;

    try {
      setProcesando(true);

      const res = await api.put(`/fases/${selectedFase._id}`, {
        ...faseFormData,
        numero: parseInt(faseFormData.numero),
      });

      // Actualizar lista de fases
      setFases(
        fases.map((f) => (f._id === selectedFase._id ? res.data.data : f)),
      );

      handleCloseEditarFaseDialog();

      setSnackbar({
        open: true,
        message: t("adminPhases.messages.phaseUpdated"),
        severity: "success",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error || t("adminPhases.messages.phaseUpdateError"),
      );

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          t("adminPhases.messages.phaseUpdateError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarFase = async () => {
    if (!selectedFase) return;

    try {
      setProcesando(true);

      const res = await api.delete(`/fases/${selectedFase._id}`);

      // Actualizar lista de fases
      setFases(fases.filter((f) => f._id !== selectedFase._id));

      // Eliminar actividades asociadas
      setActividades(
        actividades.filter((a) => a.fase._id !== selectedFase._id),
      );

      handleCloseEliminarFaseDialog();

      setSnackbar({
        open: true,
        message: t("adminPhases.messages.phaseDeleted", {
          removed: res.data.removedCount || 0,
          preserved: res.data.preservedCount || 0,
        }),
        severity: "success",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error || t("adminPhases.messages.phaseDeleteError"),
      );

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          t("adminPhases.messages.phaseDeleteError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  // Handlers para Actividades
  const handleOpenCrearActividadDialog = (fase: any) => {
    setActividadFormData({
      nombre: "",
      descripcion: "",
      tipo: "teórica",
      fase: fase._id,
      orden: "",
      requiereAdjunto: false,
    });
    setSelectedFase(fase);
    setOpenCrearActividadDialog(true);
  };

  const handleCloseCrearActividadDialog = () => {
    setOpenCrearActividadDialog(false);
    setSelectedFase(null);
  };

  const handleOpenEditarActividadDialog = (actividad: any) => {
    setSelectedActividad(actividad);
    setActividadFormData({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion || "",
      tipo: actividad.tipo,
      fase: actividad.fase._id,
      orden: actividad.orden.toString(),
      requiereAdjunto: Boolean(actividad.requiereAdjunto),
    });
    setOpenEditarActividadDialog(true);
  };

  const handleCloseEditarActividadDialog = () => {
    setOpenEditarActividadDialog(false);
    setSelectedActividad(null);
  };

  //const handleOpenEliminarActividadDialog = (actividad: any) => {
  // setSelectedActividad(actividad);
  //setOpenEliminarActividadDialog(true);
  //};

  const handleCloseEliminarActividadDialog = () => {
    setOpenEliminarActividadDialog(false);
    setSelectedActividad(null);
  };

  const handleActividadChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setActividadFormData({
      ...actividadFormData,
      [name]: type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value,
    });
  };

  const handleCrearActividad = async () => {
    try {
      setProcesando(true);

      const res = await api.post("/actividades", {
        ...actividadFormData,
        orden: parseInt(actividadFormData.orden),
      });

      // Actualizar lista de actividades
      setActividades([...actividades, res.data.data]);

      handleCloseCrearActividadDialog();

      setSnackbar({
        open: true,
        message: t("adminPhases.messages.activityCreated"),
        severity: "success",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("adminPhases.messages.activityCreateError"),
      );

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          t("adminPhases.messages.activityCreateError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEditarActividad = async () => {
    if (!selectedActividad) return;

    try {
      setProcesando(true);

      const res = await api.put(`/actividades/${selectedActividad._id}`, {
        ...actividadFormData,
        orden: parseInt(actividadFormData.orden),
      });

      // Actualizar lista de actividades
      setActividades(
        actividades.map((a) =>
          a._id === selectedActividad._id ? res.data.data : a,
        ),
      );

      handleCloseEditarActividadDialog();

      setSnackbar({
        open: true,
        message: t("adminPhases.messages.activityUpdated"),
        severity: "success",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("adminPhases.messages.activityUpdateError"),
      );

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          t("adminPhases.messages.activityUpdateError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarActividad = async () => {
    if (!selectedActividad) return;

    try {
      setProcesando(true);

      await api.delete(`/actividades/${selectedActividad._id}`);

      // Actualizar lista de actividades
      setActividades(
        actividades.filter((a) => a._id !== selectedActividad._id),
      );

      handleCloseEliminarActividadDialog();

      setSnackbar({
        open: true,
        message: t("adminPhases.messages.activityDeleted"),
        severity: "success",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("adminPhases.messages.activityDeleteError"),
      );

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          t("adminPhases.messages.activityDeleteError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const handleConfirmarEliminarActividad = async (actividad: any) => {
    try {
      setProcesando(true);
      const res = await api.get(`/progreso/actividad/${actividad._id}/count`);
      setProgresoVinculado(res.data.count);
      setSelectedActividad(actividad);
      setOpenEliminarActividadDialog(true);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: t("adminPhases.messages.checkProgressError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
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
      {/* Pestañas de fases */}
      <Paper sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label={t("adminPhases.tabs.aria")}
          >
            {fases
              .sort((a, b) => a.numero - b.numero)
              .map((fase, index) => (
                <Tab
                  key={fase._id}
                  label={`${t("common.phase")} ${fase.numero}: ${fase.nombre}`}
                  id={`fases-tab-${index}`}
                  aria-controls={`fases-tabpanel-${index}`}
                />
              ))}
          </Tabs>
        </Box>

        {fases
          .sort((a, b) => a.numero - b.numero)
          .map((fase, index) => (
            <TabPanel key={fase._id} value={tabValue} index={index}>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCrearFaseDialog}
                  sx={{ mr: 1 }}
                >
                  {t("adminPhases.actions.newPhase")}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditarFaseDialog(fase)}
                  sx={{ mr: 1 }}
                >
                  {t("adminPhases.actions.editPhase")}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleConfirmarEliminarFase(fase)}
                >
                  {t("adminPhases.actions.deletePhase")}
                </Button>
              </Box>

              <Typography variant="body1" paragraph>
                {fase.descripcion}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" component="h3">
                  {t("adminPhases.activities")}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenCrearActividadDialog(fase)}
                >
                  {t("adminPhases.actions.newActivity")}
                </Button>
              </Box>

              <TableContainer>
                <Table
                  aria-label={t("adminPhases.table.aria", {
                    number: fase.numero,
                  })}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("adminPhases.table.order")}</TableCell>
                      <TableCell>{t("adminPhases.table.name")}</TableCell>
                      <TableCell>{t("adminPhases.table.attachmentRequired")}</TableCell>
                      <TableCell>{t("adminPhases.table.type")}</TableCell>
                      <TableCell>
                        {t("adminPhases.table.description")}
                      </TableCell>
                      <TableCell align="right">
                        {t("adminPhases.table.actions")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actividades
                      .filter((actividad) => actividad.fase._id === fase._id)
                      .sort((a, b) => a.orden - b.orden)
                      .map((actividad) => (
                        <TableRow key={actividad._id} hover>
                          <TableCell>{actividad.orden}</TableCell>
                          <TableCell>{actividad.nombre}</TableCell>
                          <TableCell align="center">
                            <Typography
                              component="span"
                              role="img"
                              aria-label={
                                actividad.requiereAdjunto
                                  ? t('adminPhases.requiresAttachment')
                                  : t('adminPhases.optionalAttachment')
                              }
                              sx={{ fontSize: '1.2rem' }}
                            >
                              {actividad.requiereAdjunto ? '✔️' : '❌'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                actividad.tipo === "teórica"
                                  ? t("adminPhases.theory")
                                  : actividad.tipo === "práctica"
                                    ? t("adminPhases.practice")
                                    : actividad.tipo === "evaluación"
                                      ? t("adminPhases.evaluation")
                                      : actividad.tipo === "observación"
                                        ? t("adminPhases.observation")
                                        : t("adminPhases.surgery")
                              }
                              color={
                                actividad.tipo === "teórica"
                                  ? "primary"
                                  : actividad.tipo === "práctica"
                                    ? "secondary"
                                    : actividad.tipo === "evaluación"
                                      ? "warning"
                                      : actividad.tipo === "observación"
                                        ? "info"
                                        : "success"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{actividad.descripcion}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="primary"
                              onClick={() =>
                                handleOpenEditarActividadDialog(actividad)
                              }
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleConfirmarEliminarActividad(actividad)
                              }
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {actividades.filter(
                      (actividad) => actividad.fase._id === fase._id,
                    ).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          {t("adminPhases.table.empty")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          ))}

        {fases.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {t("adminPhases.empty")}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Diálogo para crear fase */}
      <Dialog open={openCrearFaseDialog} onClose={handleCloseCrearFaseDialog}>
        <DialogTitle>{t("adminPhases.actions.newPhase")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="numero"
            name="numero"
            label={t("adminPhases.number")}
            type="number"
            fullWidth
            variant="outlined"
            value={faseFormData.numero}
            onChange={handleFaseChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="nombre"
            name="nombre"
            label={t("adminPhases.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={faseFormData.nombre}
            onChange={handleFaseChange}
            required
            sx={{ mb: 2 }}
          />
          <RichTextDescriptionField
            label={t("adminPhases.description")}
            value={faseFormData.descripcion}
            onChange={handleDescripcionChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearFaseDialog} color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleCrearFase}
            color="primary"
            variant="contained"
            disabled={
              procesando || !faseFormData.numero || !faseFormData.nombre
            }
          >
            {procesando ? t("common.creating") : t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar fase */}
      <Dialog open={openEditarFaseDialog} onClose={handleCloseEditarFaseDialog}>
        <DialogTitle>{t("adminPhases.actions.editPhase")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="numero"
            name="numero"
            label={t("adminPhases.number")}
            type="number"
            fullWidth
            variant="outlined"
            value={faseFormData.numero}
            onChange={handleFaseChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="nombre"
            name="nombre"
            label={t("adminPhases.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={faseFormData.nombre}
            onChange={handleFaseChange}
            required
            sx={{ mb: 2 }}
          />
          <RichTextDescriptionField
            label={t("adminPhases.description")}
            value={faseFormData.descripcion}
            onChange={handleDescripcionChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarFaseDialog} color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleEditarFase}
            color="primary"
            variant="contained"
            disabled={
              procesando || !faseFormData.numero || !faseFormData.nombre
            }
          >
            {procesando ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para eliminar fase */}
      <Dialog
        open={openEliminarFaseDialog}
        onClose={handleCloseEliminarFaseDialog}
      >
        <DialogTitle>{t("adminPhases.actions.deletePhase")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {progresoVinculado !== null && progresoVinculado > 0 ? (
              <Trans
                i18nKey="adminPhases.dialogs.deletePhase.hasProgress"
                values={{
                  name: selectedFase?.nombre,
                  count: progresoVinculado,
                }}
                components={{ strong: <strong /> }}
              />
            ) : (
              <Trans
                i18nKey="adminPhases.dialogs.deletePhase.confirm"
                values={{ name: selectedFase?.nombre }}
                components={{ strong: <strong /> }}
              />
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEliminarFaseDialog} color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleEliminarFase}
            color="error"
            variant="contained"
            disabled={procesando}
          >
            {procesando ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear actividad */}
      <Dialog
        open={openCrearActividadDialog}
        onClose={handleCloseCrearActividadDialog}
      >
        <DialogTitle>{t("adminPhases.actions.newActivity")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans
              i18nKey="adminPhases.dialogs.createActivity"
              values={{ phase: selectedFase?.nombre }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label={t("adminPhases.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={actividadFormData.nombre}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="descripcion"
            name="descripcion"
            label={t("adminPhases.description")}
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={actividadFormData.descripcion}
            onChange={handleActividadChange}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            id="tipo"
            name="tipo"
            label={t("adminPhases.type")}
            fullWidth
            variant="outlined"
            value={actividadFormData.tipo}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
            slotProps={{
              select: {
                native: true,
              },
            }}
          >
            <option value="teórica">{t("adminPhases.theory")}</option>
            <option value="práctica">{t("adminPhases.practice")}</option>
            <option value="evaluación">{t("adminPhases.evaluation")}</option>
            <option value="observación">{t("adminPhases.observation")}</option>
            <option value="cirugia">{t("adminPhases.surgery")}</option>
          </TextField>
          <TextField
            margin="dense"
            id="orden"
            name="orden"
            label={t("adminPhases.order")}
            type="number"
            fullWidth
            variant="outlined"
            value={actividadFormData.orden}
            onChange={handleActividadChange}
            required
          />
          <FormControlLabel
            control={
              <Switch
                name="requiereAdjunto"
                checked={actividadFormData.requiereAdjunto}
                onChange={handleActividadChange}
              />
            }
            label={t("adminPhases.requiresAttachment")}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearActividadDialog} color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleCrearActividad}
            color="primary"
            variant="contained"
            disabled={
              procesando ||
              !actividadFormData.nombre ||
              !actividadFormData.orden
            }
          >
            {procesando ? t("common.creating") : t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar actividad */}
      <Dialog
        open={openEditarActividadDialog}
        onClose={handleCloseEditarActividadDialog}
      >
        <DialogTitle>{t("adminPhases.actions.editActivity")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label={t("adminPhases.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={actividadFormData.nombre}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="descripcion"
            name="descripcion"
            label={t("adminPhases.description")}
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={actividadFormData.descripcion}
            onChange={handleActividadChange}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            id="tipo"
            name="tipo"
            label={t("adminPhases.type")}
            fullWidth
            variant="outlined"
            value={actividadFormData.tipo}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
            slotProps={{
              select: {
                native: true,
              },
            }}
          >
            <option value="teórica">{t("adminPhases.theory")}</option>
            <option value="práctica">{t("adminPhases.practice")}</option>
            <option value="evaluación">{t("adminPhases.evaluation")}</option>
            <option value="observación">{t("adminPhases.observation")}</option>
            <option value="cirugia">{t("adminPhases.surgery")}</option>
          </TextField>
          <TextField
            select
            margin="dense"
            id="fase"
            name="fase"
            label={t("common.phase")}
            fullWidth
            variant="outlined"
            value={actividadFormData.fase}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
            slotProps={{
              select: {
                native: true,
              },
            }}
          >
            {fases
              .sort((a, b) => a.numero - b.numero)
              .map((fase) => (
                <option key={fase._id} value={fase._id}>
                  {t("common.phase")} {fase.numero}: {fase.nombre}
                </option>
              ))}
          </TextField>
          <TextField
            margin="dense"
            id="orden"
            name="orden"
            label={t("adminPhases.order")}
            type="number"
            fullWidth
            variant="outlined"
            value={actividadFormData.orden}
            onChange={handleActividadChange}
            required
          />
          <FormControlLabel
            control={
              <Switch
                name="requiereAdjunto"
                checked={actividadFormData.requiereAdjunto}
                onChange={handleActividadChange}
              />
            }
            label={t("adminPhases.requiresAttachment")}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarActividadDialog} color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleEditarActividad}
            color="primary"
            variant="contained"
            disabled={
              procesando ||
              !actividadFormData.nombre ||
              !actividadFormData.orden ||
              !actividadFormData.fase
            }
          >
            {procesando ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para eliminar actividad */}
      <Dialog
        open={openEliminarActividadDialog}
        onClose={handleCloseEliminarActividadDialog}
      >
        <DialogTitle>{t("adminPhases.actions.deleteActivity")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {progresoVinculado !== null && progresoVinculado > 0 ? (
              <Trans
                i18nKey="adminPhases.dialogs.deleteActivity.hasProgress"
                values={{
                  name: selectedActividad?.nombre,
                  count: progresoVinculado,
                }}
                components={{ strong: <strong /> }}
              />
            ) : (
              <Trans
                i18nKey="adminPhases.dialogs.deleteActivity.confirm"
                values={{ name: selectedActividad?.nombre }}
                components={{ strong: <strong /> }}
              />
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEliminarActividadDialog} color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleEliminarActividad}
            color="error"
            variant="contained"
            disabled={procesando}
          >
            {procesando ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminFases;
