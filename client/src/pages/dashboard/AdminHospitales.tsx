import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AdminHospitales: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospitales, setHospitales] = useState<any[]>([]);
  const [openCrearDialog, setOpenCrearDialog] = useState(false);
  const [openEditarDialog, setOpenEditarDialog] = useState(false);
  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    telefono: '',
    email: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        setLoading(true);
        
        const res = await axios.get('/api/hospitals');
        setHospitales(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los hospitales');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitales();
  }, []);

  const handleOpenCrearDialog = () => {
    setFormData({
      nombre: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      telefono: '',
      email: ''
    });
    setOpenCrearDialog(true);
  };

  const handleCloseCrearDialog = () => {
    setOpenCrearDialog(false);
  };

  const handleOpenEditarDialog = (hospital: any) => {
    setSelectedHospital(hospital);
    setFormData({
      nombre: hospital.nombre,
      direccion: hospital.direccion || '',
      ciudad: hospital.ciudad || '',
      provincia: hospital.provincia || '',
      codigoPostal: hospital.codigoPostal || '',
      telefono: hospital.telefono || '',
      email: hospital.email || ''
    });
    setOpenEditarDialog(true);
  };

  const handleCloseEditarDialog = () => {
    setOpenEditarDialog(false);
    setSelectedHospital(null);
  };

  const handleOpenEliminarDialog = (hospital: any) => {
    setSelectedHospital(hospital);
    setOpenEliminarDialog(true);
  };

  const handleCloseEliminarDialog = () => {
    setOpenEliminarDialog(false);
    setSelectedHospital(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCrear = async () => {
    try {
      setProcesando(true);
      
      const res = await axios.post('/api/hospitals', formData);
      
      // Actualizar lista de hospitales
      setHospitales([...hospitales, res.data.data]);
      
      handleCloseCrearDialog();
      
      setSnackbar({
        open: true,
        message: 'Hospital creado correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el hospital');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al crear el hospital',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEditar = async () => {
    if (!selectedHospital) return;
    
    try {
      setProcesando(true);
      
      const res = await axios.put(`/api/hospitals/${selectedHospital._id}`, formData);
      
      // Actualizar lista de hospitales
      setHospitales(hospitales.map(h => h._id === selectedHospital._id ? res.data.data : h));
      
      handleCloseEditarDialog();
      
      setSnackbar({
        open: true,
        message: 'Hospital actualizado correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el hospital');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al actualizar el hospital',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedHospital) return;
    
    try {
      setProcesando(true);
      
      await axios.delete(`/api/hospitals/${selectedHospital._id}`);
      
      // Actualizar lista de hospitales
      setHospitales(hospitales.filter(h => h._id !== selectedHospital._id));
      
      handleCloseEliminarDialog();
      
      setSnackbar({
        open: true,
        message: 'Hospital eliminado correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar el hospital');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al eliminar el hospital',
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
          Gestión de Hospitales
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCrearDialog}
        >
          Nuevo Hospital
        </Button>
      </Box>
      
      {/* Resumen */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} component="div">
            <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">{hospitales.length}</Typography>
                <Typography variant="body2">Hospitales</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de hospitales */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabla de hospitales">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Provincia</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hospitales.map((hospital) => (
                <TableRow key={hospital._id} hover>
                  <TableCell>{hospital.nombre}</TableCell>
                  <TableCell>{hospital.ciudad || '-'}</TableCell>
                  <TableCell>{hospital.provincia || '-'}</TableCell>
                  <TableCell>{hospital.telefono || '-'}</TableCell>
                  <TableCell>{hospital.email || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenEditarDialog(hospital)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleOpenEliminarDialog(hospital)}
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
      
      {/* Diálogo para crear hospital */}
      <Dialog open={openCrearDialog} onClose={handleCloseCrearDialog}>
        <DialogTitle>Nuevo Hospital</DialogTitle>
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
            id="direccion"
            name="direccion"
            label="Dirección"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.direccion}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} component="div">
              <TextField
                margin="dense"
                id="ciudad"
                name="ciudad"
                label="Ciudad"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.ciudad}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} component="div">
              <TextField
                margin="dense"
                id="provincia"
                name="provincia"
                label="Provincia"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.provincia}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            id="codigoPostal"
            name="codigoPostal"
            label="Código Postal"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.codigoPostal}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="telefono"
            name="telefono"
            label="Teléfono"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.telefono}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="email"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleCrear} 
            color="primary"
            variant="contained"
            disabled={procesando || !formData.nombre}
          >
            {procesando ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para editar hospital */}
      <Dialog open={openEditarDialog} onClose={handleCloseEditarDialog}>
        <DialogTitle>Editar Hospital</DialogTitle>
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
            id="direccion"
            name="direccion"
            label="Dirección"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.direccion}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} component="div">
              <TextField
                margin="dense"
                id="ciudad"
                name="ciudad"
                label="Ciudad"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.ciudad}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} component="div">
              <TextField
                margin="dense"
                id="provincia"
                name="provincia"
                label="Provincia"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.provincia}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            id="codigoPostal"
            name="codigoPostal"
            label="Código Postal"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.codigoPostal}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="telefono"
            name="telefono"
            label="Teléfono"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.telefono}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="email"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEditar} 
            color="primary"
            variant="contained"
            disabled={procesando || !formData.nombre}
          >
            {procesando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para eliminar hospital */}
      <Dialog open={openEliminarDialog} onClose={handleCloseEliminarDialog}>
        <DialogTitle>Eliminar Hospital</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el hospital <strong>{selectedHospital?.nombre}</strong>? Esta acción no se puede deshacer y podría afectar a los usuarios asociados a este hospital.
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

export default AdminHospitales;
