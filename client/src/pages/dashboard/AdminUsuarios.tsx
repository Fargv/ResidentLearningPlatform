import React, { useState, useEffect } from 'react';
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
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as VpnKeyIcon
  
  //Person as PersonIcon,
  //Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api, { createUser, updateUserPassword } from '../../api';

const AdminUsuarios: React.FC = () => {
  const { user } = useAuth();
  const rolesResidentes = ['residente', 'formador', 'administrador'];
  const rolesSociedades = ['alumno', 'instructor', 'administrador'];
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
  const [passwordValue, setPasswordValue] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellidos: '',
    rol: 'residente',
    hospital: '',
    especialidad: '',
    tipo: '',
    sociedad: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  const roleOptions =
    formData.tipo === 'Programa Sociedades' ? rolesSociedades : rolesResidentes;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  
        const usuariosRes = await api.get('/users');

        setUsuariosLista(usuariosRes.data.data); // <-- aquí es donde fallaba antes

        const hospitalesRes = await api.get('/hospitals');

        setHospitales(hospitalesRes.data.data);

        const sociedadesRes = await api.get('/sociedades');
        setSociedades(sociedadesRes.data.filter((s: any) => s.status === 'ACTIVO'));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const handleOpenInvitarDialog = () => {
    setFormData({
      email: '',
      nombre: '',
      apellidos: '',
      rol: 'residente',
      hospital: hospitales.length > 0 ? hospitales[0]._id : '',
      especialidad: '',
      tipo: '',
      sociedad: sociedades.length > 0 ? sociedades[0]._id : ''
    });
    setOpenInvitarDialog(true);
  };

const handleOpenCrearDialog = () => {
    setFormData({
      email: '',
      nombre: '',
      apellidos: '',
      rol: 'residente',
      hospital: hospitales.length > 0 ? hospitales[0]._id : '',
      especialidad: '',
      tipo: '',
      sociedad: sociedades.length > 0 ? sociedades[0]._id : ''
    });
    setPasswordValue('');
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
      hospital: usuario.hospital?._id || '',
      especialidad: usuario.especialidad || '',
      tipo: usuario.tipo || '',
      sociedad: usuario.sociedad?._id || ''
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
    setPasswordValue('');
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedUsuario(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name as string]: value };
    if (name === 'tipo') {
      if (value === 'Programa Residentes') {
        updated.sociedad = '';
        updated.rol = 'residente';
      } else if (value === 'Programa Sociedades') {
        updated.rol = 'alumno';
      }
    }
    setFormData(updated);
  };

  const handleInvitar = async () => {
    try {
      setProcesando(true);
      
      const res = await api.post('/users/invite', formData);
      
      // Actualizar lista de usuarios
      setUsuariosLista([...usuarios, res.data.data]);
      
      handleCloseInvitarDialog();
      
      setSnackbar({
        open: true,
        message: 'Invitación enviada correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar la invitación');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al enviar la invitación',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

   const handleCrear = async () => {
    try {
      setProcesando(true);
      const res = await createUser({ ...formData, password: passwordValue });
      setUsuariosLista([...usuarios, res.data.data]);
      handleCloseCrearDialog();
      setSnackbar({ open: true, message: 'Usuario creado correctamente', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Error al crear el usuario', severity: 'error' });
    } finally {
      setProcesando(false);
    }
  };


  const handleEditar = async () => {
    if (!selectedUsuario) return;
    
    try {
      setProcesando(true);
      
      const payload = { ...formData } as any;
      if (payload.tipo === 'Programa Residentes') {
        payload.sociedad = null;
      }

      const res = await api.put(`/users/${selectedUsuario._id}`, payload);
      
      // Actualizar lista de usuarios
      setUsuariosLista(usuarios.map(u => u._id === selectedUsuario._id ? res.data.data : u));
      
      handleCloseEditarDialog();
      
      setSnackbar({
        open: true,
        message: 'Usuario actualizado correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el usuario');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al actualizar el usuario',
        severity: 'error'
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
      setUsuariosLista(usuarios.filter(u => u._id !== selectedUsuario._id));
      
      handleCloseEliminarDialog();
      
      setSnackbar({
        open: true,
        message: 'Usuario eliminado correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar el usuario');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al eliminar el usuario',
        severity: 'error'
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
      setSnackbar({ open: true, message: 'Contraseña actualizada', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Error al actualizar la contraseña', severity: 'error' });
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
      message: 'Progreso formativo creado con éxito',
      severity: 'success'
    });
  } catch (err: any) {
    setSnackbar({
      open: true,
      message: err.response?.data?.error || 'Error al crear el progreso',
      severity: 'error'
    });
  } finally {
    setProcesando(false);
  }
};
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
    <Box sx={{ px: 3, py: 2 }}>
      {/* Cabecera */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.rol === 'administrador'
            ? 'Gestión de Todos los Usuarios'
            : 'Usuarios de Tu Hospital'}
        </Typography>
  
        <Box>
          {user?.rol === 'administrador' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleOpenCrearDialog}
              sx={{ mr: 1 }}
            >
              Crear Usuario
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenInvitarDialog}
          >
            Invitar Usuario
          </Button>
        </Box>
      </Box>
      
      {/* Tabla de usuarios */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabla de usuarios">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Sociedad</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario._id} hover>
                  <TableCell>
                    {usuario.nombre} {usuario.apellidos}
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.tipo || '-'}</TableCell>
                  <TableCell>{usuario.sociedad?.titulo || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                      color={
                        usuario.rol === 'administrador'
                          ? 'primary'
                          : usuario.rol === 'formador'
                            ? 'secondary'
                            : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{usuario.hospital?.nombre || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={usuario.activo ? 'Activo' : 'Inactivo'} 
                      color={usuario.activo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditarDialog(usuario)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                     <IconButton
                        color="error"
                        onClick={() => handleOpenEliminarDialog(usuario)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                      {user?.rol === 'administrador' && (
                        <IconButton
                          color="secondary"
                          onClick={() => handleOpenPasswordDialog(usuario)}
                          size="small"
                          title="Cambiar contraseña"
                        >
                          <VpnKeyIcon />
                        </IconButton>
                      )}
                      {usuario.rol === 'residente' && (
                        <IconButton
                          color="warning"
                          onClick={() => handleCrearProgreso(usuario._id)}
                          size="small"
                          title="Crear Progreso Formativo"
                        >
                          ⚙️
                        </IconButton>
                      )}
                    </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Diálogo para invitar usuario */}
      <Dialog open={openInvitarDialog} onClose={handleCloseInvitarDialog}>
        <DialogTitle>Invitar Usuario</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Introduce los datos del usuario que deseas invitar. Se enviará un correo electrónico con un enlace para completar el registro.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="email"
            name="email"
            label="Email"
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
            id="nombre"
            name="nombre"
            label="Nombre"
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
            label="Apellidos"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.apellidos}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="tipo"
            name="tipo"
            label="Tipo"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.tipo}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="tipo"
            name="tipo"
            label="Tipo"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.tipo}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            id="tipo"
            name="tipo"
            label="Tipo"
            fullWidth
            variant="outlined"
            value={formData.tipo}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="Programa Residentes">Programa Residentes</option>
            <option value="Programa Sociedades">Programa Sociedades</option>
          </TextField>
          <TextField
            select
            margin="dense"
            id="rol"
            name="rol"
            label="Rol"
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
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </TextField>
          {(formData.rol === 'residente' || formData.rol === 'formador') && (
            <TextField
              select
              margin="dense"
              id="hospital"
              name="hospital"
              label="Hospital"
              fullWidth
              variant="outlined"
              value={formData.hospital}
              onChange={handleChange}
              required
              SelectProps={{
                native: true
              }}
            >
              {hospitales.map((hospital) => (
                <option key={hospital._id} value={hospital._id}>
                  {hospital.nombre}
                </option>
              ))}
            </TextField>
          )}
           {formData.tipo === 'Programa Sociedades' && (
            <TextField
              select
              margin="dense"
              id="sociedad"
              name="sociedad"
              label="Sociedad"
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
          <TextField
            select
            margin="dense"
            id="sociedad"
            name="sociedad"
            label="Sociedad"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvitarDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleInvitar} 
            color="primary"
            variant="contained"
            disabled={procesando || !formData.email || !formData.nombre || !formData.apellidos || ((formData.rol === 'residente' || formData.rol === 'formador') && !formData.hospital)}
          >
            {procesando ? 'Enviando...' : 'Enviar Invitación'}
          </Button>
        </DialogActions>
      </Dialog>
      
          {/* Diálogo para actualizar contraseña */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Actualizar Contraseña</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="password-update"
            label="Nueva contraseña"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancelar</Button>
          <Button
            onClick={handleActualizarPassword}
            variant="contained"
            color="secondary"
            disabled={procesando || !passwordValue}
          >
            {procesando ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear usuario directamente */}
      <Dialog open={openCrearDialog} onClose={handleCloseCrearDialog}>
        <DialogTitle>Crear Usuario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="email-create"
            name="email"
            label="Email"
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
            label="Contraseña"
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
            label="Nombre"
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
            label="Apellidos"
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
            id="tipo-create"
            name="tipo"
            label="Tipo"
            fullWidth
            variant="outlined"
            value={formData.tipo}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="Programa Residentes">Programa Residentes</option>
            <option value="Programa Sociedades">Programa Sociedades</option>
          </TextField>
          <TextField
            select
            margin="dense"
            id="rol-create"
            name="rol"
            label="Rol"
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
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </TextField>
          {(formData.rol === 'residente' || formData.rol === 'formador') && (
            <TextField
              select
              margin="dense"
              id="hospital-create"
              name="hospital"
              label="Hospital"
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
          {formData.rol === 'residente' && (
            <TextField
              select
              margin="dense"
              id="especialidad-create"
              name="especialidad"
              label="Especialidad"
              fullWidth
              variant="outlined"
              value={formData.especialidad}
              onChange={handleChange}
              required
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="URO">URO</option>
              <option value="GEN">GEN</option>
              <option value="GYN">GYN</option>
              <option value="THOR">THOR</option>
              <option value="ORL">ORL</option>
            </TextField>
          )}
          {formData.tipo === 'Programa Sociedades' && (
            <TextField
              select
              margin="dense"
              id="sociedad-create"
              name="sociedad"
              label="Sociedad"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearDialog}>Cancelar</Button>
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
              ((formData.rol === 'residente' || formData.rol === 'formador') && !formData.hospital) ||
              (formData.rol === 'residente' && !formData.especialidad)
            }
          >
            {procesando ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar usuario */}
      <Dialog open={openEditarDialog} onClose={handleCloseEditarDialog}>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label="Nombre"
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
            label="Apellidos"
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
            label="Rol"
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
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </TextField>
          {(formData.rol === 'residente' || formData.rol === 'formador') && (
            <TextField
              select
              margin="dense"
              id="hospital"
              name="hospital"
              label="Hospital"
              fullWidth
              variant="outlined"
              value={formData.hospital}
              onChange={handleChange}
              required
              SelectProps={{
                native: true
              }}
            >
              {hospitales.map((hospital) => (
                <option key={hospital._id} value={hospital._id}>
                  {hospital.nombre}
                </option>
              ))}
            </TextField>
          )}
          {formData.rol === 'residente' && (
            <TextField
              select
              margin="dense"
              id="especialidad"
              name="especialidad"
              label="Especialidad"
              fullWidth
              variant="outlined"
              value={formData.especialidad}
              onChange={handleChange}
              required
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="URO">URO</option>
              <option value="GEN">GEN</option>
              <option value="GYN">GYN</option>
              <option value="THOR">THOR</option>
              <option value="ORL">ORL</option>
            </TextField>
          )}
          <TextField
            select
            margin="dense"
            id="sociedad"
            name="sociedad"
            label="Sociedad"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEditar} 
            color="primary"
            variant="contained"
            disabled={
              procesando ||
              !formData.nombre ||
              !formData.apellidos ||
              ((formData.rol === 'residente' || formData.rol === 'formador') && !formData.hospital) ||
              (formData.rol === 'residente' && !formData.especialidad)
            }          >
            {procesando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para eliminar usuario */}
      <Dialog open={openEliminarDialog} onClose={handleCloseEliminarDialog}>
        <DialogTitle>Eliminar Usuario</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUsuario?.nombre} {selectedUsuario?.apellidos}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEliminarDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminar} 
            color="error"
            variant="contained"
            disabled={procesando}
          >
            {procesando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUsuarios;