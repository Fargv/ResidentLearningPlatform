
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, LinearProgress, Alert, Snackbar,
  Autocomplete, Tooltip, CircularProgress, Backdrop, Menu, MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { getRoleChipSx } from '../../utils/roleChipColors';
import { FaseCirugia } from '../../types/FaseCirugia';

const TutorUsuarios: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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

  const [openDialog, setOpenDialog] = useState(false);
  const [editar, setEditar] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellidos: '',
    rol: user?.rol === 'profesor' ? 'participante' : 'residente',
    hospital: user?.hospital?._id || ''
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
            if (["residente", "participante"].includes(u.rol)) {
              try {
                const progRes = await api.get(`/progreso/residente/${u._id}`);
                fasesCirugia = progRes.data.data
                  .filter(
                    (p: any) =>
                      p.estadoGeneral === "validado" &&
                      p.actividades.some(
                        (a: any) =>
                          a.tipo === "cirugia" && a.estado === "validado",
                      ),
                  )
                  .map((p: any) => ({ id: p._id, fase: p.fase.nombre }));
              } catch {
                fasesCirugia = [];
              }
            }
            return { ...u, fasesCirugia };
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
  }, [fetchUsuarios]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as string]: value });
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

      setOpenDialog(false);
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

  const handleDownloadInforme = async (
    progresoId: string,
    fase: string,
    nombreUsuario: string,
    usuario?: any,
  ) => {
    setDownloadLoading(true);
    try {
      const res = await api.get(`/informe-cirugias/${progresoId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `informe-cirugias-${fase}_${nombreUsuario}.xlsx`,
      );
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
  const hospitalOptions = Array.from(
    new Map(
      usuarios
        .filter((u) => u.hospital)
        .map((u) => [u.hospital._id, u.hospital]),
    ).values(),
  );
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
              hospital: user?.hospital?._id || ''
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
                <TableCell>{t('tutorUsers.table.status')}</TableCell>
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
                  <TableCell align="right">
                    {usuario.fasesCirugia && usuario.fasesCirugia.length > 0 && (
                      <>
                        <Tooltip title="Descargar informes">
                          <IconButton
                            onClick={(e) => handleOpenInformeMenu(e, usuario)}
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
                                  menuUsuario,
                                );
                                handleCloseInformeMenu();
                              }}
                            >
                              {fase.fase}
                            </MenuItem>
                          ))}
                        </Menu>
                      </>
                    )}
                    <IconButton
                      onClick={() => {
                        setEditar(true);
                        setSelected(usuario);
                        setFormData({
                          email: usuario.email,
                          nombre: usuario.nombre,
                          apellidos: usuario.apellidos,
                          rol: usuario.rol,
                          hospital: usuario.hospital?._id || ''
                        });
                        setOpenDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(usuario._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{t(editar ? 'tutorUsers.edit' : 'tutorUsers.invite')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label={t('tutorUsers.form.email')} name="email" value={formData.email} onChange={handleChange} />
          <TextField fullWidth margin="dense" label={t('tutorUsers.form.name')} name="nombre" value={formData.nombre} onChange={handleChange} />
          <TextField fullWidth margin="dense" label={t('tutorUsers.form.surname')} name="apellidos" value={formData.apellidos} onChange={handleChange} />
          <TextField
            select
            fullWidth
            margin="dense"
            label={t('tutorUsers.form.role')}
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            slotProps={{ select: { native: true } }}
          >
            <option value="residente">{t('roles.residente')}</option>
            <option value="tutor">{t('roles.tutor')}</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('tutorUsers.dialog.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={procesando}>
            {procesando ? t('tutorUsers.dialog.saving') : editar ? t('tutorUsers.dialog.save') : t('tutorUsers.dialog.invite')}
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

