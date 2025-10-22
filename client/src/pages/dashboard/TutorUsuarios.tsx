
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTranslation, Trans } from 'react-i18next';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material/styles';
import api, {
  updateUserPassword,
  getUserResetToken,
  clearResetNotifications,
} from '../../api';
import { getRoleChipSx } from '../../utils/roleChipColors';
import { FaseCirugia } from '../../types/FaseCirugia';

const DIALOG_ACTIONS_SX: SxProps<Theme> = {
  flexWrap: 'wrap',
  gap: 1,
  justifyContent: 'center',
};

const ACTION_BUTTON_BASE_SX: SxProps<Theme> = {
  minWidth: { xs: '100%', sm: 220 },
  height: 44,
  mt: { xs: 1, sm: 0 },
  fontWeight: 600,
  flexBasis: { xs: '100%', sm: 'auto' },
};

const getPasswordButtonStyles = (theme: Theme) => {
  const baseBg = theme.palette.mode === 'light' ? '#7E57C2' : '#9575CD';
  const hoverBg = theme.palette.mode === 'light' ? '#673AB7' : '#7E57C2';

  return {
    backgroundColor: baseBg,
    color: theme.palette.getContrastText(baseBg),
    '&:hover': {
      backgroundColor: hoverBg,
      color: theme.palette.getContrastText(hoverBg),
    },
  };
};

const PASSWORD_ACTION_ROLES = [
  'administrador',
  'tutor',
  'profesor',
  'csm',
  'instructor',
];

const CENTERED_DIALOG_ACTIONS_SX: SxProps<Theme> = {
  justifyContent: 'center',
  gap: 1,
  flexWrap: 'wrap',
};

const TutorUsuarios: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const defaultProgramType = useMemo(() => {
    if (user?.tipo) {
      return user.tipo;
    }
    if (user?.rol === 'profesor') {
      return 'Programa Sociedades';
    }
    return 'Programa Residentes';
  }, [user?.tipo, user?.rol]);
  const typeKey = (tipo?: string) =>
    tipo === 'Programa Sociedades'
      ? 'programaSociedades'
      : tipo === 'Programa Residentes'
      ? 'programaResidentes'
      : '';
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [availableHospitals, setAvailableHospitals] = useState<any[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editar, setEditar] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordMenuAnchorEl, setPasswordMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isPasswordMenuOpen = Boolean(passwordMenuAnchorEl);
  const [passwordValue, setPasswordValue] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellidos: '',
    rol: user?.rol === 'profesor' ? 'participante' : 'residente',
    hospital: user?.hospital?._id || '',
    tipo: defaultProgramType
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [anchorElInforme, setAnchorElInforme] = useState<null | HTMLElement>(null);
  const [menuUsuario, setMenuUsuario] = useState<any>(null);

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedZonas, setSelectedZonas] = useState<string[]>([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedFases, setSelectedFases] = useState<string[]>([]);

  const handleOpenPasswordMenu = (event: React.MouseEvent<HTMLElement>) => {
    setPasswordMenuAnchorEl(event.currentTarget);
  };

  const handleClosePasswordMenu = () => {
    setPasswordMenuAnchorEl(null);
  };

  const fetchUsuarios = useCallback(async () => {
    try {
      let res;
      if (user?.rol === 'csm') {
        res = await api.get('/users');
      } else if (user?.rol === 'profesor') {
        res = await api.get(`/users/profesor/${user._id}/participantes`);
      } else if (user?.hospital?._id) {
        res = await api.get(`/users/hospital/${user.hospital._id}`);
      }
      if (res) {
        const filtrados = res.data.data.filter(
          (u: any) => u._id !== user?._id && u.tipo === user?.tipo
        );
        const usuariosConProgreso = await Promise.all(
          filtrados.map(async (u: any) => {
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
                  faseActual = `${t('adminPhases.phase')} ${numero}`;
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
        setUsuarios(usuariosConProgreso);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('tutorUsers.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.hospital?._id, user?.rol, user?.tipo, t]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios, t]);

  useEffect(() => {
    const fetchHospitals = async () => {
      if (user?.rol !== 'csm' || !user?.zona) {
        setAvailableHospitals([]);
        return;
      }

      try {
        const response = await api.get('/hospitals');
        const data = response.data?.data ?? response.data ?? [];
        const normalizedZona = user.zona.toUpperCase();
        const filtered = Array.isArray(data)
          ? data.filter(
              (hospital: any) =>
                typeof hospital?.zona === 'string' &&
                hospital.zona.toUpperCase() === normalizedZona,
            )
          : [];
        setAvailableHospitals(filtered);
      } catch {
        setAvailableHospitals([]);
      }
    };

    fetchHospitals();
  }, [user?.rol, user?.zona]);

  const handleCloseEditarDialog = (clearSelected = true) => {
    setOpenDialog(false);
    handleClosePasswordMenu();
    if (clearSelected) setSelected(null);
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>,
  ) => {
    const { name, value } = e.target as { name?: string; value: unknown };
    if (!name) return;
    setFormData({ ...formData, [name]: value as string });
  };

  const handleSubmit = async () => {
    try {
      setProcesando(true);
      

      if (editar && selected) {
        const res = await api.put(`/users/${selected._id}`, formData);
        setUsuarios(usuarios.map(u => u._id === selected._id ? res.data.data : u));
      } else {
        const res = await api.post('/users/invite', formData);
        setUsuarios([...usuarios, res.data.data]);
      }

      handleCloseEditarDialog();
      setSnackbar({
        open: true,
        message: editar ? t('tutorUsers.updated') : t('tutorUsers.invited'),
        severity: 'success'
      });

    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('tutorUsers.error'),
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleDelete = async (usuarioId: string) => {
    try {
      setProcesando(true);
      await api.delete(`/users/${usuarioId}`);

      setUsuarios(usuarios.filter(u => u._id !== usuarioId));
      setSnackbar({
        open: true,
        message: t('tutorUsers.deleted'),
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('tutorUsers.deleteError'),
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleOpenEliminarDialog = (usuario: any) => {
    setSelected(usuario);
    setOpenEliminarDialog(true);
  };

  const handleCloseEliminarDialog = () => {
    setOpenEliminarDialog(false);
    setSelected(null);
  };

  const handleConfirmEliminar = async () => {
    if (!selected) return;
    await handleDelete(selected._id);
    handleCloseEliminarDialog();
  };

  const handleOpenPasswordDialog = (usuario: any) => {
    setSelected(usuario);
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setPasswordValue('');
    setSelected(null);
  };

  const handleSendResetEmail = async (usuario: any) => {
    try {
      const res = await getUserResetToken(usuario._id);
      const resetToken = res.data.resetToken;
      const frontendUrl =
        process.env.REACT_APP_FRONTEND_URL || window.location.origin;
      const days = parseInt(
        process.env.REACT_APP_RESET_PASSWORD_EXPIRE_DAYS || '3',
        10,
      );
      const subject = encodeURIComponent(
        t('adminUsers.resetEmail.subject', { app: t('common.appName') }),
      );
      const body = encodeURIComponent(
        t('adminUsers.resetEmail.body', {
          name: usuario.nombre,
          app: t('common.appName'),
          link: `${frontendUrl}/reset-password/${resetToken}`,
          days,
        }),
      );
      const mailtoLink = `mailto:${usuario.email}?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;
      await clearResetNotifications(usuario._id);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('common.error'),
        severity: 'error',
      });
    }
  };

  const handleActualizarPassword = async () => {
    if (!selected) return;
    try {
      setProcesando(true);
      await updateUserPassword(selected._id, passwordValue);
      handleClosePasswordDialog();
      setSnackbar({
        open: true,
        message: t('adminUsers.passwordUpdated'),
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('adminUsers.passwordError'),
        severity: 'error'
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
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `informe-${fase}_${nombreUsuario}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('tutorUsers.loadError'),
        severity: 'error',
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

  const roleOptions = Array.from(
    new Set(usuarios.map((u) => u.rol).filter((r): r is string => Boolean(r))),
  );
  const hospitalOptions = useMemo(() => {
    const pairs: [string, any][] = [];
    availableHospitals.forEach((hospital) => {
      if (hospital?._id) {
        pairs.push([hospital._id, hospital]);
      }
    });
    usuarios
      .filter((u) => u.hospital)
      .forEach((u) => {
        pairs.push([u.hospital._id, u.hospital]);
      });
    return Array.from(new Map(pairs).values());
  }, [availableHospitals, usuarios]);
  const societyOptions = Array.from(
    new Map(
      usuarios
        .filter((u) => u.sociedad)
        .map((u) => [u.sociedad._id, u.sociedad]),
    ).values(),
  );
  const especialidadOptions = Array.from(
    new Set(
      usuarios
        .map((u) => u.especialidad)
        .filter((e): e is string => Boolean(e)),
    ),
  );
  const zonaOptions = Array.from(
    new Set(
      usuarios
        .map((u) => u.zona)
        .filter((z): z is string => Boolean(z)),
    ),
  );
  const tipoOptions = Array.from(
    new Set(
      usuarios
        .map((u) => u.tipo)
        .filter((t): t is string => Boolean(t)),
    ),
  );
  const faseOptions = Array.from(
    new Set(
      usuarios
        .map((u) => u.faseActual)
        .filter((f): f is string => Boolean(f)),
    ),
  );

  const displayUsuarios = usuarios
    .filter((u) =>
      selectedRoles.length > 0 ? selectedRoles.includes(u.rol) : true,
    )
    .filter((u) =>
      selectedHospitals.length > 0
        ? selectedHospitals.includes(
            u.hospital?._id || u.sociedad?._id || '',
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
        ? selectedFases.includes(u.faseActual ?? '')
        : true,
    );

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('tutorUsers.title')}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditar(false);
            setFormData({
              email: '',
              nombre: '',
              apellidos: '',
              rol: user?.rol === 'profesor' ? 'participante' : 'residente',
              hospital: user?.hospital?._id || '',
              tipo: defaultProgramType
            });
            setOpenDialog(true);
          }}
        >
          {t('tutorUsers.invite')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Autocomplete
          multiple
          options={roleOptions}
          value={selectedRoles}
          onChange={(e, newValue) =>
            setSelectedRoles(newValue as string[])
          }
          renderInput={(params) => (
            <TextField {...params} label={t('tutorUsers.fields.role')} />
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
            <TextField {...params} label={t('adminUsers.fields.zone')} />
          )}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          options={tipoOptions}
          value={selectedTipos}
          onChange={(e, newValue) =>
            setSelectedTipos(newValue as string[])
          }
          renderInput={(params) => (
            <TextField {...params} label={t('adminUsers.fields.type')} />
          )}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          options={faseOptions}
          value={selectedFases}
          onChange={(e, newValue) =>
            setSelectedFases(newValue as string[])
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('adminUsers.fields.phase', 'Fase')}
            />
          )}
          sx={{ minWidth: 200 }}
        />
        {['tutor', 'csm'].includes(user?.rol || '') && (
          <>
            <Autocomplete
              multiple
              options={hospitalOptions}
              getOptionLabel={(o) => o.nombre}
              value={hospitalOptions.filter((h) =>
                selectedHospitals.includes(h._id),
              )}
              onChange={(e, newValue) =>
                setSelectedHospitals(newValue.map((h: any) => h._id))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('adminUsers.fields.hospital')}
                />
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
                <TextField
                  {...params}
                  label={t('adminUsers.fields.specialty')}
                />
              )}
              sx={{ minWidth: 200 }}
            />
          </>
        )}
        {user?.rol === 'profesor' && (
          <Autocomplete
            multiple
            options={societyOptions}
            getOptionLabel={(o) => o.titulo}
            value={societyOptions.filter((s) =>
              selectedHospitals.includes(s._id),
            )}
            onChange={(e, newValue) =>
              setSelectedHospitals(newValue.map((s: any) => s._id))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('adminUsers.fields.society')}
              />
            )}
            sx={{ minWidth: 200 }}
          />
        )}
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('tutorUsers.table.name')}</TableCell>
                <TableCell>{t('tutorUsers.table.email')}</TableCell>
                <TableCell>{t('adminUsers.table.type')}</TableCell>
                <TableCell>{t('adminUsers.table.society')}</TableCell>
                <TableCell>{t('adminUsers.table.role')}</TableCell>
                <TableCell>{t('adminUsers.table.hospital')}</TableCell>
                <TableCell>{t('adminUsers.table.specialty')}</TableCell>
                <TableCell>{t('adminUsers.table.zone')}</TableCell>
                <TableCell>{t('adminUsers.table.currentPhase', 'Fase Actual')}</TableCell>
                <TableCell>{t('tutorUsers.table.status')}</TableCell>
                <TableCell sx={{ width: 40 }} />
                <TableCell align="right">{t('tutorUsers.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayUsuarios.map(usuario => (
                <TableRow key={usuario._id}>
                  <TableCell>{usuario.nombre} {usuario.apellidos}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    {usuario.tipo ? t(`types.${typeKey(usuario.tipo)}`) : '-'}
                  </TableCell>
                  <TableCell>{usuario.sociedad?.titulo || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(`roles.${usuario.rol}`)}
                      color={
                        usuario.rol === 'administrador'
                          ? 'primary'
                          : usuario.rol === 'tutor'
                          ? 'secondary'
                          : 'default'
                      }
                      size="small"
                      sx={getRoleChipSx(usuario.rol)}
                    />
                  </TableCell>
                  <TableCell>{usuario.hospital?.nombre || '-'}</TableCell>
                  <TableCell>{usuario.especialidad || '-'}</TableCell>
                  <TableCell>{usuario.zona || '-'}</TableCell>
                  <TableCell>{usuario.faseActual || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(
                        usuario.activo
                          ? 'tutorUsers.states.active'
                          : 'tutorUsers.states.inactive'
                      )}
                      color={usuario.activo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ width: 40 }}>
                    {usuario.fasesCirugia?.length ? (
                      <>
                        <Tooltip
                          title={t('tutorUsers.actions.downloadSurgeryReport', {
                            phase: t('adminPhases.phase').toLowerCase(),
                          })}
                        >
                          <IconButton onClick={(e) => handleOpenInformeMenu(e, usuario)}>
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
                              {t('tutorUsers.actions.downloadSurgeryReport', {
                                phase: fase.fase,
                              })}
                            </MenuItem>
                          ))}
                        </Menu>
                      </>
                    ) : null}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setEditar(true);
                        setSelected(usuario);
                        setFormData({
                          email: usuario.email,
                          nombre: usuario.nombre,
                          apellidos: usuario.apellidos,
                          rol: usuario.rol,
                          hospital: usuario.hospital?._id || '',
                          tipo: usuario.tipo || defaultProgramType
                        });
                        setOpenDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => handleCloseEditarDialog()}>
        <DialogTitle>{t(editar ? 'tutorUsers.edit' : 'tutorUsers.invite')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label={t('tutorUsers.form.email')} name="email" value={formData.email} onChange={handleChange} />
          <TextField fullWidth margin="dense" label={t('tutorUsers.form.name')} name="nombre" value={formData.nombre} onChange={handleChange} />
          <TextField fullWidth margin="dense" label={t('tutorUsers.form.surname')} name="apellidos" value={formData.apellidos} onChange={handleChange} />
          <FormControl fullWidth margin="dense">
            <InputLabel id="tutor-usuarios-role-label">
              {t('tutorUsers.form.role')}
            </InputLabel>
            <Select
              labelId="tutor-usuarios-role-label"
              label={t('tutorUsers.form.role')}
              name="rol"
              value={formData.rol}
              onChange={handleChange}
            >
              <MenuItem value="residente">{t('roles.residente')}</MenuItem>
              <MenuItem value="tutor">{t('roles.tutor')}</MenuItem>
            </Select>
          </FormControl>
          {user?.rol === 'csm' && (
            <Autocomplete
              options={hospitalOptions}
              getOptionLabel={(option) => option?.nombre ?? ''}
              value={
                hospitalOptions.find((h) => h._id === formData.hospital) || null
              }
              onChange={(_, newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  hospital: newValue?._id || '',
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="dense"
                  label={t('adminUsers.fields.hospital')}
                />
              )}
            />
          )}
        </DialogContent>
        <DialogActions sx={DIALOG_ACTIONS_SX}>
          <Button
            onClick={() => handleCloseEditarDialog()}
            variant="contained"
            sx={[
              ACTION_BUTTON_BASE_SX,
              (theme) => ({
                backgroundColor:
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[200]
                    : theme.palette.grey[700],
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? theme.palette.grey[300]
                      : theme.palette.grey[600],
                },
              }),
            ]}
          >
            {t('tutorUsers.dialog.cancel')}
          </Button>
          {editar && selected && (
            <>
              {PASSWORD_ACTION_ROLES.includes(user?.rol ?? '') && (
                <>
                  <Button
                    onClick={(event) => handleOpenPasswordMenu(event)}
                    variant="contained"
                    sx={[
                      ACTION_BUTTON_BASE_SX,
                      (theme) => getPasswordButtonStyles(theme),
                    ]}
                    endIcon={<ArrowDropDownIcon />}
                    aria-controls={
                      isPasswordMenuOpen ? 'password-actions-menu' : undefined
                    }
                    aria-haspopup="true"
                    aria-expanded={isPasswordMenuOpen ? 'true' : undefined}
                  >
                    {t('adminUsers.actions.changePassword')}
                  </Button>
                  <Menu
                    id="password-actions-menu"
                    anchorEl={passwordMenuAnchorEl}
                    open={isPasswordMenuOpen}
                    onClose={handleClosePasswordMenu}
                  >
                    <MenuItem
                      onClick={() => {
                        if (!selected) {
                          handleClosePasswordMenu();
                          return;
                        }
                        handleClosePasswordMenu();
                        handleOpenPasswordDialog(selected);
                        handleCloseEditarDialog(false);
                      }}
                    >
                      {t('adminUsers.actions.changePassword')}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        if (!selected) {
                          handleClosePasswordMenu();
                          return;
                        }
                        handleClosePasswordMenu();
                        void handleSendResetEmail(selected);
                      }}
                      sx={(theme) => ({
                        color: theme.palette.warning.main,
                        '&:hover': {
                          backgroundColor:
                            theme.palette.mode === 'light'
                              ? theme.palette.warning.light
                              : theme.palette.warning.dark,
                          color: theme.palette.getContrastText(
                            theme.palette.mode === 'light'
                              ? theme.palette.warning.light
                              : theme.palette.warning.dark,
                          ),
                        },
                      })}
                    >
                      {t('adminUsers.actions.sendResetLink')}
                    </MenuItem>
                  </Menu>
                </>
              )}

              <Button
                color="error"
                variant="contained"
                sx={ACTION_BUTTON_BASE_SX}
                startIcon={<DeleteIcon />}
                onClick={() => {
                  handleOpenEliminarDialog(selected);
                  handleCloseEditarDialog(false);
                }}
              >
                {t('tutorUsers.buttons.delete')}
              </Button>
            </>
          )}
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            sx={ACTION_BUTTON_BASE_SX}
            disabled={procesando}
          >
            {procesando
              ? t('tutorUsers.dialog.saving')
              : editar
              ? t('tutorUsers.dialog.save')
              : t('tutorUsers.dialog.invite')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>{t('adminUsers.password.title')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            id="password-update"
            label={t('adminUsers.password.label')}
            type="password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={CENTERED_DIALOG_ACTIONS_SX}>
          <Button
            onClick={() => handleClosePasswordDialog()}
            sx={{ minWidth: 140 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleActualizarPassword}
            variant="contained"
            disabled={procesando || !passwordValue}
            sx={(theme) => ({
              minWidth: 180,
              ...getPasswordButtonStyles(theme),
            })}
          >
            {procesando
              ? t('adminUsers.password.updating')
              : t('adminUsers.password.update')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEliminarDialog} onClose={handleCloseEliminarDialog}>
        <DialogTitle>{t('adminUsers.delete.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans
              i18nKey="adminUsers.delete.confirm"
              values={{
                name: `${selected?.nombre} ${selected?.apellidos}`,
              }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={CENTERED_DIALOG_ACTIONS_SX}>
          <Button onClick={handleCloseEliminarDialog} sx={{ minWidth: 140 }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmEliminar}
            color="error"
            variant="contained"
            disabled={procesando}
          >
            {procesando ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        open={downloadLoading}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TutorUsuarios;

