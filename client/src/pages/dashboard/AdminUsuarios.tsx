import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  //Divider,
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
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Autocomplete,
  IconButton,
  Tooltip,
  CircularProgress,
  Backdrop,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Download as DownloadIcon,

   //Person as PersonIcon,
  //Email as EmailIcon
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api, { createUser, updateUserPassword, getTutors } from "../../api";
import InviteUsersMail from "../../components/InviteUsersMail";
import BackButton from "../../components/BackButton";
import { useTranslation, Trans } from "react-i18next";
import { getRoleChipSx } from "../../utils/roleChipColors";
import { FaseCirugia } from "../../types/FaseCirugia";

const AdminUsuarios: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const typeKey = (tipo?: string) =>
    tipo === "Programa Sociedades"
      ? "programaSociedades"
      : tipo === "Programa Residentes"
      ? "programaResidentes"
      : "";
  const rolesResidentes = [
    "residente",
    "tutor",
    "csm",
    "administrador",
  ];
  const rolesSociedades = [
    "participante",
    "profesor",
    "csm",
    "administrador",
  ];
  const zonaOptions = [
    "NORDESTE",
    "NORTE",
    "CENTRO",
    "ANDALUCÍA",
    "PORTUGAL",
    "LEVANTE",
    "CANARIAS",
  ];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuariosLista] = useState<any[]>([]);
  const [hospitales, setHospitales] = useState<any[]>([]);
  const [sociedades, setSociedades] = useState<any[]>([]);
  const [openInvitarDialog, setOpenInvitarDialog] = useState(false);
  const [openCrearDialog, setOpenCrearDialog] = useState(false);
  const [openEditarDialog, setOpenEditarDialog] = useState(false);
  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellidos: "",
    rol: "residente",
    hospital: "",
    especialidad: "",
    tutor: "",
    tipo: "Programa Residentes",
    sociedad: "",
    zona: "",
  });
  const [procesando, setProcesando] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [anchorElInforme, setAnchorElInforme] = useState<null | HTMLElement>(null);
  const [menuUsuario, setMenuUsuario] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<
    "nombre" | "email" | "hospital" | "rol"
  >("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const allRoles = Array.from(
    new Set([...rolesResidentes, ...rolesSociedades]),
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedZonas, setSelectedZonas] = useState<string[]>([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedFases, setSelectedFases] = useState<string[]>([]);
  const [tutores, setTutores] = useState<any[]>([]);

  const roleOptions =
    formData.tipo === "Programa Sociedades" ? rolesSociedades : rolesResidentes;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const usuariosRes = await api.get("/users");

        const usuariosConProgreso = await Promise.all(
          usuariosRes.data.data.map(async (u: any) => {
            let fasesCirugia: FaseCirugia[] = [];
            let faseActual: string | undefined;
            if (["residente", "participante"].includes(u.rol)) {
              try {
                const progRes = await api.get(`/progreso/residente/${u._id}`);
                const progresos = progRes.data.data;
                fasesCirugia = progresos
                  .filter(
                    (p: any) =>
                      p.estadoGeneral === "validado" &&
                      p.actividades.some(
                        (a: any) =>
                          a.tipo === "cirugia" && a.estado === "validado",
                      ),
                  )
                  .map((p: any) => ({ id: p._id, fase: p.fase.nombre }));

                const enProgreso = progresos.filter(
                  (p: any) => p.estadoGeneral === "en progreso",
                );
                if (enProgreso.length > 0) {
                  const numero = Math.max(
                    ...enProgreso.map((p: any) => p.fase.numero),
                  );
                  faseActual = `${t("adminPhases.phase")} ${numero}`;
                } else if (
                  progresos.length > 0 &&
                  progresos.every((p: any) => p.estadoGeneral === "validado")
                ) {
                  faseActual = "Programa Completado";
                }
              } catch {
                fasesCirugia = [];
              }
            }
            return { ...u, fasesCirugia, faseActual };
          }),
        );

        setUsuariosLista(usuariosConProgreso);

        const hospitalesRes = await api.get("/hospitals");

        setHospitales(hospitalesRes.data.data);

        const sociedadesRes = await api.get("/sociedades");
        setSociedades(
          sociedadesRes.data.filter((s: any) => s.status === "ACTIVO"),
        );
      } catch (err: any) {
        setError(err.response?.data?.error || t("adminUsers.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    const fetchTutores = async () => {
      if (
        formData.rol === "residente" &&
        formData.hospital &&
        formData.especialidad
      ) {
        try {
          const res = await getTutors(formData.hospital, formData.especialidad);
          setTutores(res.data.data);
        } catch {
          setTutores([]);
        }
      } else {
        setTutores([]);
      }
    };
    fetchTutores();
  }, [formData.rol, formData.hospital, formData.especialidad]);


  const handleOpenInvitarDialog = () => {
    setOpenInvitarDialog(true);
  };

  const handleOpenCrearDialog = () => {
    setFormData({
      email: "",
      nombre: "",
      apellidos: "",
      rol: "residente",
      hospital: hospitales.length > 0 ? hospitales[0]._id : "",
      especialidad: "",
      tutor: "",
      tipo: "Programa Residentes",
      sociedad: sociedades.length > 0 ? sociedades[0]._id : "",
      zona: "",
    });
    setPasswordValue("");
    setOpenCrearDialog(true);
  };

  const handleCloseCrearDialog = () => {
    setOpenCrearDialog(false);
  };

  const handleCloseInvitarDialog = () => {
    setOpenInvitarDialog(false);
  };

  const handleOpenEditarDialog = (usuario: any) => {
    setSelectedUsuario(usuario);
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
      hospital: usuario.hospital?._id || "",
      especialidad: usuario.especialidad || "",
      tutor: usuario.tutor?._id || "",
      tipo: usuario.tipo || "",
      sociedad: usuario.sociedad?._id || "",
      zona: usuario.zona || "",
    });
    setOpenEditarDialog(true);
  };

  const handleCloseEditarDialog = () => {
    setOpenEditarDialog(false);
    setSelectedUsuario(null);
  };

  const handleOpenEliminarDialog = (usuario: any) => {
    setSelectedUsuario(usuario);
    setOpenEliminarDialog(true);
  };

  const handleCloseEliminarDialog = () => {
    setOpenEliminarDialog(false);
    setSelectedUsuario(null);
  };

  const handleOpenPasswordDialog = (usuario: any) => {
    setSelectedUsuario(usuario);
    setPasswordValue("");
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedUsuario(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name as string]: value };
    if (name === "tipo") {
      if (value === "Programa Residentes") {
        updated.sociedad = "";
        updated.rol = "residente";
      } else if (value === "Programa Sociedades") {
        updated.rol = "participante";
        updated.sociedad = sociedades[0]?._id || "";
      }
    } else if (name === "rol") {
      if (value === "administrador") {
        updated.tipo = "";
        updated.hospital = "";
        updated.sociedad = "";
        updated.especialidad = "";
        updated.zona = "";
        updated.tutor = "";
      } else {
        if (value === "csm") {
          updated.hospital = "";
          updated.sociedad = "";
          updated.especialidad = "";
        }
        if (
          value === "residente" ||
          value === "tutor" ||
          value === "csm"
        ) {
          updated.tipo = "Programa Residentes";
        } else if (value === "participante" || value === "profesor") {
          updated.tipo = "Programa Sociedades";
        }
        if (value !== "residente") {
          updated.tutor = "";
        }
      }
    } else if (name === "hospital") {
      const selected = hospitales.find((h) => h._id === value);
      updated.zona = selected?.zona || "";
      updated.tutor = "";
    } else if (name === "especialidad") {
      updated.tutor = "";
    }
    setFormData(updated);
  };

  const handleCrear = async () => {
    try {
      setProcesando(true);
      const payload = { ...formData, password: passwordValue } as any;
      if (payload.rol === "administrador") delete payload.tipo;
      if (!payload.hospital) delete payload.hospital;
      if (!payload.especialidad) delete payload.especialidad;
      if (!payload.sociedad) delete payload.sociedad;
      if (!payload.zona) delete payload.zona;
      if (payload.tutor === undefined) delete payload.tutor;
      const res = await createUser(payload);
      setUsuariosLista([...usuarios, res.data.data]);
      handleCloseCrearDialog();
      setSnackbar({
        open: true,
        message: t("adminUsers.createSuccess"),
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || t("adminUsers.createError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEditar = async () => {
    if (!selectedUsuario) return;

    try {
      setProcesando(true);

      const payload = { ...formData, password: passwordValue } as any;
      if (payload.rol === "administrador") delete payload.tipo;
      if (!payload.hospital) delete payload.hospital;
      if (!payload.especialidad) delete payload.especialidad;
      if (!payload.sociedad) delete payload.sociedad;
      if (payload.tutor === undefined) delete payload.tutor;

      const res = await api.put(`/users/${selectedUsuario._id}`, payload);

      // Actualizar lista de usuarios
      setUsuariosLista(
        usuarios.map((u) =>
          u._id === selectedUsuario._id ? res.data.data : u,
        ),
      );

      handleCloseEditarDialog();

      setSnackbar({
        open: true,
        message: t("adminUsers.updateSuccess"),
        severity: "success",
      });
    } catch (err: any) {
      setError(err.response?.data?.error || t("adminUsers.updateError"));

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || t("adminUsers.updateError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedUsuario) return;

    try {
      setProcesando(true);

      await api.delete(`/users/${selectedUsuario._id}`);

      // Actualizar lista de usuarios
      setUsuariosLista(usuarios.filter((u) => u._id !== selectedUsuario._id));

      handleCloseEliminarDialog();

      setSnackbar({
        open: true,
        message: t("adminUsers.deleteSuccess"),
        severity: "success",
      });
    } catch (err: any) {
      setError(err.response?.data?.error || t("adminUsers.deleteError"));

      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || t("adminUsers.deleteError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleActualizarPassword = async () => {
    if (!selectedUsuario) return;
    try {
      setProcesando(true);
      await updateUserPassword(selectedUsuario._id, passwordValue);
      handleClosePasswordDialog();
      setSnackbar({
        open: true,
        message: t("adminUsers.passwordUpdated"),
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || t("adminUsers.passwordError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleCrearProgreso = async (usuarioId: string) => {
    try {
      setProcesando(true);
      await api.post(`/progreso/crear/${usuarioId}`);

      setSnackbar({
        open: true,
        message: t("adminUsers.createProgressSuccess"),
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error || t("adminUsers.createProgressError"),
        severity: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleDownloadInforme = async (
    progresoId: string,
    fase: string,
    nombreUsuario: string,
  ) => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informe-cirugias/${progresoId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `informe-${fase}_${nombreUsuario}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t("adminUsers.loadError"),
        severity: "error",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleOpenInformeMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    usuario: any,
  ) => {
    setAnchorElInforme(event.currentTarget);
    setMenuUsuario(usuario);
  };

  const handleCloseInformeMenu = () => {
    setAnchorElInforme(null);
    setMenuUsuario(null);
  };
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const handleSort = (
    field: "nombre" | "email" | "hospital" | "rol",
  ) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
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

  const especialidadOptions = Array.from(
    new Set(
      usuarios
        .map((u) => u.especialidad)
        .filter((e): e is string => Boolean(e)),
    ),
  );
  const faseOptions = Array.from(
    new Set(
      usuarios
        .map((u) => u.faseActual)
        .filter((f): f is string => Boolean(f)),
    ),
  );
  const hospitalSociedadOptions = [
    ...hospitales.map((h) => ({ _id: h._id, nombre: h.nombre })),
    ...sociedades.map((s) => ({ _id: s._id, nombre: s.titulo })),
  ];

  const displayUsuarios = usuarios
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    })
    .filter((u) =>
      selectedRoles.length > 0 ? selectedRoles.includes(u.rol) : true,
    )
    .filter((u) =>
      selectedHospitals.length > 0
        ? selectedHospitals.includes(
            u.hospital?._id || u.sociedad?._id || "",
          )
        : true,
    )
    .filter((u) =>
      selectedZonas.length > 0 ? selectedZonas.includes(u.zona) : true,
    )
    .filter((u) =>
      selectedEspecialidades.length > 0
        ? selectedEspecialidades.includes(u.especialidad)
        : true,
    )
    .filter((u) =>
      selectedTipos.length > 0 ? selectedTipos.includes(u.tipo) : true,
    )
    .filter((u) =>
      selectedFases.length > 0
        ? selectedFases.includes(u.faseActual ?? "")
        : true,
    )
    .sort((a, b) => {
      let aVal = "";
      let bVal = "";
      switch (sortField) {
        case "email":
        case "nombre":
        case "rol":
          aVal = (a as any)[sortField] || "";
          bVal = (b as any)[sortField] || "";
          break;
        case "hospital":
          aVal = a.hospital?.nombre || a.sociedad?.titulo || "";
          bVal = b.hospital?.nombre || b.sociedad?.titulo || "";
          break;
        default:
          break;
      }
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

  return (
    <Box sx={{ px: 0, py: 2 }}>
      {/* Cabecera */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.rol === "administrador"
            ? t("adminUsers.titleAll")
            : t("adminUsers.titleHospital")}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BackButton sx={{ mr: 1 }} />
          {user?.rol === "administrador" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleOpenCrearDialog}
              sx={{ mr: 1 }}
            >
              {t("adminUsers.actions.create")}
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenInvitarDialog}
          >
            {t("adminUsers.actions.invite")}
          </Button>
        </Box>
      </Box>

     <TextField
        variant="outlined"
        placeholder={t("adminUsers.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Autocomplete
          multiple
          options={allRoles}
          value={selectedRoles}
          onChange={(e, newValue) =>
            setSelectedRoles(newValue as string[])
          }
          renderInput={(params) => (
            <TextField {...params} label={t("adminUsers.fields.role")} />
          )}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          options={hospitalSociedadOptions}
          getOptionLabel={(option) => option.nombre}
          value={hospitalSociedadOptions.filter((h) =>
            selectedHospitals.includes(h._id),
          )}
          onChange={(e, newValue) =>
            setSelectedHospitals(newValue.map((h: any) => h._id))
          }
          renderInput={(params) => (
            <TextField {...params} label={t("adminUsers.fields.hospital")} />
          )}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          options={zonaOptions}
          value={selectedZonas}
          onChange={(e, newValue) =>
            setSelectedZonas(newValue as string[])
          }
          renderInput={(params) => (
            <TextField {...params} label={t("adminUsers.fields.zone")} />
          )}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          options={especialidadOptions}
          value={selectedEspecialidades}
          onChange={(e, newValue) =>
            setSelectedEspecialidades(newValue as string[])
          }
          renderInput={(params) => (
            <TextField {...params} label={t("adminUsers.fields.specialty")} />
          )}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          options={["Programa Residentes", "Programa Sociedades"]}
          value={selectedTipos}
          onChange={(e, newValue) => setSelectedTipos(newValue as string[])}
          renderInput={(params) => (
            <TextField {...params} label={t("adminUsers.fields.type")} />
          )}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          options={faseOptions}
          value={selectedFases}
          onChange={(e, newValue) => setSelectedFases(newValue as string[])}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("adminUsers.fields.phase", "Fase")}
            />
          )}
          sx={{ minWidth: 200 }}
        />
      </Box>

     {/* Tabla de usuarios */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader aria-label={t("adminUsers.table.aria")}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light", color: "common.white" }}>
                <TableCell
                  onClick={() => handleSort("nombre")}
                  sx={{ cursor: "pointer" }}
                >
                  {t("adminUsers.table.name")}
                </TableCell>
                <TableCell
                  onClick={() => handleSort("email")}
                  sx={{ cursor: "pointer" }}
                >
                  {t("adminUsers.table.email")}
                </TableCell>
                <TableCell>{t("adminUsers.table.type")}</TableCell>
                <TableCell>{t("adminUsers.table.society")}</TableCell>
                <TableCell
                  onClick={() => handleSort("rol")}
                  sx={{ cursor: "pointer" }}
                >
                  {t("adminUsers.table.role")}
                </TableCell>
                <TableCell
                  onClick={() => handleSort("hospital")}
                  sx={{ cursor: "pointer" }}
                >
                  {t("adminUsers.table.hospital")}
                </TableCell>
                <TableCell>{t("adminUsers.table.specialty")}</TableCell>
                <TableCell>{t("adminUsers.table.tutor")}</TableCell>
                <TableCell>{t("adminUsers.table.zone")}</TableCell>
                <TableCell>{t("adminUsers.table.currentPhase", "Fase Actual")}</TableCell>
                <TableCell align="right">{t("adminUsers.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayUsuarios.map((usuario) => (
                <TableRow key={usuario._id} hover>
                  <TableCell>
                    {usuario.nombre} {usuario.apellidos}
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    {usuario.tipo
                      ? t(`types.${typeKey(usuario.tipo)}`)
                      : "-"}
                  </TableCell>
                  <TableCell>{usuario.sociedad?.titulo || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(`roles.${usuario.rol}`)}
                      size="small"
                      sx={getRoleChipSx(usuario.rol)}
                    />
                  </TableCell>
                  <TableCell>{usuario.hospital?.nombre || "-"}</TableCell>
                  <TableCell>{usuario.especialidad || "-"}</TableCell>
                  <TableCell>
                    {usuario.rol === "residente"
                      ? usuario.tutor && typeof usuario.tutor === "object"
                        ? `${usuario.tutor.nombre} ${usuario.tutor.apellidos}${usuario.tutor.especialidad ? ` (${usuario.tutor.especialidad})` : ""}`
                        : <Chip color="warning" label={t("adminUsers.noTutor")} />
                      : "-"}
                  </TableCell>
                  <TableCell>{usuario.zona || "-"}</TableCell>
                  <TableCell>{usuario.faseActual || "-"}</TableCell>
                  <TableCell align="right">
                    {usuario.fasesCirugia && usuario.fasesCirugia.length > 0 && (
                      <>
                        <Tooltip
                          title={t('adminUsers.actions.downloadSurgeryReport', {
                            phase: t('adminPhases.phase').toLowerCase(),
                          })}
                        >
                          <IconButton
                            onClick={(e) => handleOpenInformeMenu(e, usuario)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Menu
                          anchorEl={anchorElInforme}
                          open={
                            Boolean(anchorElInforme) &&
                            menuUsuario?._id === usuario._id
                          }
                          onClose={handleCloseInformeMenu}
                        >
                          {menuUsuario?.fasesCirugia?.map((fase: FaseCirugia) => (
                            <MenuItem
                              key={fase.id}
                              onClick={() => {
                                handleDownloadInforme(
                                  fase.id,
                                  fase.fase,
                                  `${menuUsuario.nombre} ${menuUsuario.apellidos}`,
                                );
                                handleCloseInformeMenu();
                              }}
                            >
                              {t('adminUsers.actions.downloadSurgeryReport', {
                                phase: fase.fase,
                              })}
                            </MenuItem>
                          ))}
                        </Menu>
                      </>
                    )}
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenEditarDialog(usuario)}
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{ mr: 1, minWidth: 150 }}
                    >
                      {t("adminUsers.actions.edit")}
                    </Button>
                    {['residente', 'participante'].includes(usuario.rol) &&
                      user?.rol === "administrador" &&
                      usuario.tieneProgreso && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(
                              `/dashboard/progreso-usuario/${usuario._id}`,
                            )
                          }
                          sx={{ mr: 1, minWidth: 150 }}
                        >
                          {t('adminUserProgress.viewProgress')}
                        </Button>
                      )}
                    {['residente', 'participante'].includes(usuario.rol) &&
                      !usuario.tieneProgreso && (
                        <Button
                          variant="outlined"
                          onClick={() => handleCrearProgreso(usuario._id)}
                          size="small"
                          sx={{ mr: 1, minWidth: 150 }}
                        >
                          {t("adminUsers.actions.createProgress")}
                        </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>


      {/* Diálogo para invitar usuario */}
      <InviteUsersMail
        open={openInvitarDialog}
        onClose={handleCloseInvitarDialog}
      />

      {/* Diálogo para actualizar contraseña */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>{t("adminUsers.password.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="password-update"
            label={t("adminUsers.password.label")}
            type="password"
            fullWidth
            variant="outlined"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>{t("common.cancel")}</Button>
          <Button
            onClick={handleActualizarPassword}
            variant="contained"
            color="secondary"
            disabled={procesando || !passwordValue}
          >
            {procesando
              ? t("adminUsers.password.updating")
              : t("adminUsers.password.update")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear usuario directamente */}
      <Dialog open={openCrearDialog} onClose={handleCloseCrearDialog}>
        <DialogTitle>{t("adminUsers.create.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="email-create"
            name="email"
            label={t("adminUsers.fields.email")}
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="password-create"
            name="password"
            label={t("adminUsers.fields.password")}
            type="password"
            fullWidth
            variant="outlined"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="nombre-create"
            name="nombre"
            label={t("adminUsers.fields.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nombre}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="apellidos-create"
            name="apellidos"
            label={t("adminUsers.fields.surname")}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.apellidos}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          {formData.rol !== "administrador" && (
            <TextField
              select
              margin="dense"
              id="tipo-create"
              name="tipo"
              label={t("adminUsers.fields.type")}
              fullWidth
              variant="outlined"
              value={formData.tipo}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value="Programa Residentes">
                {t("types.programaResidentes")}
              </option>
              <option value="Programa Sociedades">
                {t("types.programaSociedades")}
              </option>
            </TextField>
          )}
          <TextField
            select
            margin="dense"
            id="rol-create"
            name="rol"
            label={t("adminUsers.fields.role")}
            fullWidth
            variant="outlined"
            value={formData.rol}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </TextField>
          {formData.rol !== "administrador" &&
            formData.rol !== "csm" &&
            (formData.rol === "residente" ||
              formData.rol === "tutor" ||
              formData.tipo === "Programa Sociedades") && (
              <TextField
                select
                margin="dense"
                id="hospital-create"
                name="hospital"
                label={t("adminUsers.fields.hospital")}
                fullWidth
                variant="outlined"
                value={formData.hospital}
                onChange={handleChange}
                required
                SelectProps={{ native: true }}
              >
                {hospitales.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.nombre}
                  </option>
                ))}
              </TextField>
            )}
          {(formData.rol === "residente" || formData.rol === "tutor") && (
            <TextField
              select
              margin="dense"
              id="especialidad-create"
              name="especialidad"
              label={t("adminUsers.fields.specialty")}
              fullWidth
              variant="outlined"
              value={formData.especialidad}
              onChange={handleChange}
              required
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              {formData.rol === "tutor" && (
                <option value="ALL">ALL</option>
              )}
              <option value="URO">URO</option>
              <option value="GEN">GEN</option>
              <option value="GYN">GYN</option>
              <option value="THOR">THOR</option>
              <option value="ORL">ORL</option>
            </TextField>
          )}
          {formData.rol === "residente" && (
            <TextField
              select
              margin="dense"
              id="tutor-create"
              name="tutor"
              label={t("adminUsers.fields.tutor")}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
              value={formData.tutor}
              onChange={handleChange}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="">{t("common.none")}</option>
              {tutores.map((tutor) => (
                <option key={tutor._id} value={tutor._id}>
                  {tutor.nombre} {tutor.apellidos}
                  {tutor.especialidad ? ` (${tutor.especialidad})` : ""}
                </option>
              ))}
            </TextField>
          )}
          {formData.rol !== "administrador" &&
            formData.rol !== "csm" &&
            formData.tipo === "Programa Sociedades" && (
              <TextField
                select
                margin="dense"
                id="sociedad-create"
                name="sociedad"
                label={t("adminUsers.fields.society")}
                fullWidth
                variant="outlined"
                value={formData.sociedad}
                onChange={handleChange}
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                {sociedades.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.titulo}
                  </option>
                ))}
              </TextField>
            )}
          {formData.rol === "csm" && (
            <TextField
              select
              margin="dense"
              id="zona-create"
              name="zona"
              label={t("adminUsers.fields.zone")}
              fullWidth
              variant="outlined"
              value={formData.zona}
              onChange={handleChange}
              required
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              {zonaOptions.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearDialog}>{t("common.cancel")}</Button>
          <Button
            onClick={handleCrear}
            variant="contained"
            color="success"
            disabled={
              procesando ||
              !formData.email ||
              !passwordValue ||
              !formData.nombre ||
              !formData.apellidos ||
              ((formData.rol === "residente" || formData.rol === "tutor") &&
                !formData.hospital) ||
              ((formData.rol === "residente" || formData.rol === "tutor") &&
                !formData.especialidad) ||
              (formData.rol === "csm" && !formData.zona)
            }
          >
            {procesando
              ? t("common.creating")
              : t("adminUsers.actions.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar usuario */}
      <Dialog open={openEditarDialog} onClose={handleCloseEditarDialog}>
        <DialogTitle>{t("adminUsers.edit.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label={t("adminUsers.fields.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nombre}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="apellidos"
            name="apellidos"
            label={t("adminUsers.fields.surname")}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.apellidos}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            id="rol"
            name="rol"
            label={t("adminUsers.fields.role")}
            fullWidth
            variant="outlined"
            value={formData.rol}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </TextField>
          {formData.rol !== "administrador" &&
            formData.rol !== "csm" &&
            (formData.rol === "residente" ||
              formData.rol === "tutor" ||
              formData.tipo === "Programa Sociedades") && (
              <TextField
                select
                margin="dense"
                id="hospital"
                name="hospital"
                label={t("adminUsers.fields.hospital")}
                fullWidth
                variant="outlined"
                value={formData.hospital}
                onChange={handleChange}
                required
                SelectProps={{
                  native: true,
                }}
              >
                {hospitales.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.nombre}
                  </option>
                ))}
              </TextField>
            )}
          {formData.rol === "csm" && (
            <TextField
              select
              margin="dense"
              id="zona-edit"
              name="zona"
              label={t("adminUsers.fields.zone")}
              fullWidth
              variant="outlined"
              value={formData.zona}
              onChange={handleChange}
              required
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              {zonaOptions.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </TextField>
          )}
         {(formData.rol === "residente" || formData.rol === "tutor") && (
            <TextField
              select
              margin="dense"
              id="especialidad"
              name="especialidad"
              label={t("adminUsers.fields.specialty")}
              fullWidth
              variant="outlined"
              value={formData.especialidad}
              onChange={handleChange}
              required
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              {formData.rol === "tutor" && (
                <option value="ALL">ALL</option>
              )}
              <option value="URO">URO</option>
              <option value="GEN">GEN</option>
              <option value="GYN">GYN</option>
              <option value="THOR">THOR</option>
              <option value="ORL">ORL</option>
            </TextField>
          )}
          {formData.rol === "residente" && (
            <TextField
              select
              margin="dense"
              id="tutor-edit"
              name="tutor"
              label={t("adminUsers.fields.tutor")}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
              value={formData.tutor}
              onChange={handleChange}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="">{t("common.none")}</option>
              {tutores.map((tutor) => (
                <option key={tutor._id} value={tutor._id}>
                  {tutor.nombre} {tutor.apellidos}
                  {tutor.especialidad ? ` (${tutor.especialidad})` : ""}
                </option>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarDialog} color="primary">
            {t("common.cancel")}
          </Button>
          {user?.rol === "administrador" && (
            <Button
              onClick={() => handleOpenPasswordDialog(selectedUsuario)}
              color="secondary"
              variant="outlined"
            >
              {t("adminUsers.actions.changePassword")}
            </Button>
          )}
          <Button
            onClick={() => handleOpenEliminarDialog(selectedUsuario)}
            color="error"
            variant="outlined"
          >
            {t("adminUsers.delete.title")}
          </Button>
          <Button
            onClick={handleEditar}
            color="primary"
            variant="contained"
            disabled={
              procesando ||
              !formData.nombre ||
              !formData.apellidos ||
              ((formData.rol === "residente" || formData.rol === "tutor") &&
                !formData.hospital) ||
              ((formData.rol === "residente" || formData.rol === "tutor") &&
                !formData.especialidad) ||
              (formData.rol === "csm" && !formData.zona)
            }
          >
            {procesando ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para eliminar usuario */}
      <Dialog open={openEliminarDialog} onClose={handleCloseEliminarDialog}>
        <DialogTitle>{t("adminUsers.delete.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans
              i18nKey="adminUsers.delete.confirm"
              values={{
                name: `${selectedUsuario?.nombre} ${selectedUsuario?.apellidos}`,
              }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEliminarDialog} color="primary">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleEliminar}
            color="error"
            variant="contained"
            disabled={procesando}
          >
            {procesando ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        open={downloadLoading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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

export default AdminUsuarios;