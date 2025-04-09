import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
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
  Delete as DeleteIcon
  //Person as PersonIcon,
  //Email as EmailIcon
} from '@mui/icons-material';
//import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminUsuarios: React.FC = () => {
  //const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [hospitales, setHospitales] = useState<any[]>([]);
  const [openInvitarDialog, setOpenInvitarDialog] = useState(false);
  const [openEditarDialog, setOpenEditarDialog] = useState(false);
  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellidos: '',
    rol: 'residente',
    hospital: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener usuarios
        const usuariosRes = await axios.get('/api/users');
        setUsuarios(usuariosRes.data.data);
        
        // Obtener hospitales
        const hospitalesRes = await axios.get('/api/hospitals');
        setHospitales(hospitalesRes.data.data);
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
      hospital: hospitales.length > 0 ? hospitales[0]._id : ''
    });
    setOpenInvitarDialog(true);
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
      hospital: usuario.hospital?._id || ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleInvitar = async () => {
    try {
      setProcesando(true);
      
      const res = await axios.post('/api/users/invite', formData);
      
      // Actualizar lista de usuarios
      setUsuarios([...usuarios, res.data.data]);
      
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

  const handleEditar = async () => {
    if (!selectedUsuario) return;
    
    try {
      setProcesando(true);
      
      const res = await axios.put(`/api/users/${selectedUsuario._id}`, formData);
      
      // Actualizar lista de usuarios
      setUsuarios(usuarios.map(u => u._id === selectedUsuario._id ? res.data.data : u));
      
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
      
      await axios.delete(`/api/users/${selectedUsuario._id}`);
      
      // Actualizar lista de usuarios
      setUsuarios(usuarios.filter(u => u._id !== selectedUsuario._id));
      
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenInvitarDialog}
        >
          Invitar Usuario
        </Button>
      </Box>
      
      {/* Resumen */}
      <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" flexWrap="wrap" gap={2}>
  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
    <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">
          {usuarios.filter(u => u.rol === 'administrador').length}
        </Typography>
        <Typography variant="body2">Administradores</Typography>
      </CardContent>
    </Card>
  </Box>
  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
    <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">
          {usuarios.filter(u => u.rol === 'formador').length}
        </Typography>
        <Typography variant="body2">Formadores</Typography>
      </CardContent>
    </Card>
  </Box>
  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
    <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">
          {usuarios.filter(u => u.rol === 'residente').length}
        </Typography>
        <Typography variant="body2">Residentes</Typography>
      </CardContent>
    </Card>
  </Box>
</Box>

      </Paper>
      
      {/* Tabla de usuarios */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabla de usuarios">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
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
            SelectProps={{
              native: true
            }}
          >
            <option value="residente">Residente</option>
            <option value="formador">Formador</option>
            <option value="administrador">Administrador</option>
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
            SelectProps={{
              native: true
            }}
          >
            <option value="residente">Residente</option>
            <option value="formador">Formador</option>
            <option value="administrador">Administrador</option>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEditar} 
            color="primary"
            variant="contained"
            disabled={procesando || !formData.nombre || !formData.apellidos || ((formData.rol === 'residente' || formData.rol === 'formador') && !formData.hospital)}
          >
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
