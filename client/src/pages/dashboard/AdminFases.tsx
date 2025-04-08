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
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminFases: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fases, setFases] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openCrearFaseDialog, setOpenCrearFaseDialog] = useState(false);
  const [openEditarFaseDialog, setOpenEditarFaseDialog] = useState(false);
  const [openEliminarFaseDialog, setOpenEliminarFaseDialog] = useState(false);
  const [openCrearActividadDialog, setOpenCrearActividadDialog] = useState(false);
  const [openEditarActividadDialog, setOpenEditarActividadDialog] = useState(false);
  const [openEliminarActividadDialog, setOpenEliminarActividadDialog] = useState(false);
  const [selectedFase, setSelectedFase] = useState<any>(null);
  const [selectedActividad, setSelectedActividad] = useState<any>(null);
  const [faseFormData, setFaseFormData] = useState({
    numero: '',
    nombre: '',
    descripcion: ''
  });
  const [actividadFormData, setActividadFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'teorica',
    fase: '',
    orden: ''
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
        
        // Obtener fases
        const fasesRes = await axios.get('/api/fases');
        setFases(fasesRes.data.data);
        
        // Obtener actividades
        const actividadesRes = await axios.get('/api/actividades');
        setActividades(actividadesRes.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handlers para Fases
  const handleOpenCrearFaseDialog = () => {
    setFaseFormData({
      numero: '',
      nombre: '',
      descripcion: ''
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
      descripcion: fase.descripcion || ''
    });
    setOpenEditarFaseDialog(true);
  };

  const handleCloseEditarFaseDialog = () => {
    setOpenEditarFaseDialog(false);
    setSelectedFase(null);
  };

  const handleOpenEliminarFaseDialog = (fase: any) => {
    setSelectedFase(fase);
    setOpenEliminarFaseDialog(true);
  };

  const handleCloseEliminarFaseDialog = () => {
    setOpenEliminarFaseDialog(false);
    setSelectedFase(null);
  };

  const handleFaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFaseFormData({
      ...faseFormData,
      [name]: value
    });
  };

  const handleCrearFase = async () => {
    try {
      setProcesando(true);
      
      const res = await axios.post('/api/fases', {
        ...faseFormData,
        numero: parseInt(faseFormData.numero)
      });
      
      // Actualizar lista de fases
      setFases([...fases, res.data.data]);
      
      handleCloseCrearFaseDialog();
      
      setSnackbar({
        open: true,
        message: 'Fase creada correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la fase');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al crear la fase',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEditarFase = async () => {
    if (!selectedFase) return;
    
    try {
      setProcesando(true);
      
      const res = await axios.put(`/api/fases/${selectedFase._id}`, {
        ...faseFormData,
        numero: parseInt(faseFormData.numero)
      });
      
      // Actualizar lista de fases
      setFases(fases.map(f => f._id === selectedFase._id ? res.data.data : f));
      
      handleCloseEditarFaseDialog();
      
      setSnackbar({
        open: true,
        message: 'Fase actualizada correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar la fase');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al actualizar la fase',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarFase = async () => {
    if (!selectedFase) return;
    
    try {
      setProcesando(true);
      
      await axios.delete(`/api/fases/${selectedFase._id}`);
      
      // Actualizar lista de fases
      setFases(fases.filter(f => f._id !== selectedFase._id));
      
      // Eliminar actividades asociadas
      setActividades(actividades.filter(a => a.fase._id !== selectedFase._id));
      
      handleCloseEliminarFaseDialog();
      
      setSnackbar({
        open: true,
        message: 'Fase eliminada correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar la fase');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al eliminar la fase',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  // Handlers para Actividades
  const handleOpenCrearActividadDialog = (fase: any) => {
    setActividadFormData({
      nombre: '',
      descripcion: '',
      tipo: 'teorica',
      fase: fase._id,
      orden: ''
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
      descripcion: actividad.descripcion || '',
      tipo: actividad.tipo,
      fase: actividad.fase._id,
      orden: actividad.orden.toString()
    });
    setOpenEditarActividadDialog(true);
  };

  const handleCloseEditarActividadDialog = () => {
    setOpenEditarActividadDialog(false);
    setSelectedActividad(null);
  };

  const handleOpenEliminarActividadDialog = (actividad: any) => {
    setSelectedActividad(actividad);
    setOpenEliminarActividadDialog(true);
  };

  const handleCloseEliminarActividadDialog = () => {
    setOpenEliminarActividadDialog(false);
    setSelectedActividad(null);
  };

  const handleActividadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActividadFormData({
      ...actividadFormData,
      [name]: value
    });
  };

  const handleCrearActividad = async () => {
    try {
      setProcesando(true);
      
      const res = await axios.post('/api/actividades', {
        ...actividadFormData,
        orden: parseInt(actividadFormData.orden)
      });
      
      // Actualizar lista de actividades
      setActividades([...actividades, res.data.data]);
      
      handleCloseCrearActividadDialog();
      
      setSnackbar({
        open: true,
        message: 'Actividad creada correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la actividad');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al crear la actividad',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEditarActividad = async () => {
    if (!selectedActividad) return;
    
    try {
      setProcesando(true);
      
      const res = await axios.put(`/api/actividades/${selectedActividad._id}`, {
        ...actividadFormData,
        orden: parseInt(actividadFormData.orden)
      });
      
      // Actualizar lista de actividades
      setActividades(actividades.map(a => a._id === selectedActividad._id ? res.data.data : a));
      
      handleCloseEditarActividadDialog();
      
      setSnackbar({
        open: true,
        message: 'Actividad actualizada correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar la actividad');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al actualizar la actividad',
        severity: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarActividad = async () => {
    if (!selectedActividad) return;
    
    try {
      setProcesando(true);
      
      await axios.delete(`/api/actividades/${selectedActividad._id}`);
      
      // Actualizar lista de actividades
      setActividades(actividades.filter(a => a._id !== selectedActividad._id));
      
      handleCloseEliminarActividadDialog();
      
      setSnackbar({
        open: true,
        message: 'Actividad eliminada correctamente',
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar la actividad');
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al eliminar la actividad',
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
          Fases y Actividades
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCrearFaseDialog}
        >
          Nueva Fase
        </Button>
      </Box>
      
      {/* Resumen */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">{fases.length}</Typography>
                <Typography variant="body2">Fases</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h4">{actividades.length}</Typography>
                <Typography variant="body2">Actividades</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Pestañas de fases */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            aria-label="fases tabs"
          >
            {fases.sort((a, b) => a.numero - b.numero).map((fase, index) => (
              <Tab 
                key={fase._id} 
                label={`Fase ${fase.numero}: ${fase.nombre}`} 
                id={`fases-tab-${index}`}
                aria-controls={`fases-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>
        
        {fases.sort((a, b) => a.numero - b.numero).map((fase, index) => (
          <TabPanel key={fase._id} value={tabValue} index={index}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Fase {fase.numero}: {fase.nombre}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditarFaseDialog(fase)}
                  sx={{ mr: 1 }}
                >
                  Editar Fase
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleOpenEliminarFaseDialog(fase)}
                >
                  Eliminar Fase
                </Button>
              </Box>
            </Box>
            
            <Typography variant="body1" paragraph>
              {fase.descripcion}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Actividades
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCrearActividadDialog(fase)}
              >
                Nueva Actividad
              </Button>
            </Box>
            
            <TableContainer>
              <Table aria-label={`actividades de fase ${fase.numero}`}>
                <TableHead>
                  <TableRow>
                    <TableCell>Orden</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actividades
                    .filter(actividad => actividad.fase._id === fase._id)
                    .sort((a, b) => a.orden - b.orden)
                    .map((actividad) => (
                      <TableRow key={actividad._id} hover>
                        <TableCell>{actividad.orden}</TableCell>
                        <TableCell>{actividad.nombre}</TableCell>
                        <TableCell>
                          <Chip 
                            label={actividad.tipo === 'teorica' ? 'Teórica' : actividad.tipo === 'practica' ? 'Práctica' : 'Evaluación'} 
                            color={
                              actividad.tipo === 'teorica' 
                                ? 'primary' 
                                : actividad.tipo === 'practica' 
                                  ? 'secondary' 
                                  : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{actividad.descripcion}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenEditarActividadDialog(actividad)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleOpenEliminarActividadDialog(actividad)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {actividades.filter(actividad => actividad.fase._id === fase._id).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay actividades en esta fase
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        ))}
        
        {fases.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No hay fases creadas. Crea una nueva fase para comenzar.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Diálogo para crear fase */}
      <Dialog open={openCrearFaseDialog} onClose={handleCloseCrearFaseDialog}>
        <DialogTitle>Nueva Fase</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="numero"
            name="numero"
            label="Número"
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
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={faseFormData.nombre}
            onChange={handleFaseChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="descripcion"
            name="descripcion"
            label="Descripción"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={faseFormData.descripcion}
            onChange={handleFaseChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearFaseDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleCrearFase} 
            color="primary"
            variant="contained"
            disabled={procesando || !faseFormData.numero || !faseFormData.nombre}
          >
            {procesando ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para editar fase */}
      <Dialog open={openEditarFaseDialog} onClose={handleCloseEditarFaseDialog}>
        <DialogTitle>Editar Fase</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="numero"
            name="numero"
            label="Número"
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
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={faseFormData.nombre}
            onChange={handleFaseChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="descripcion"
            name="descripcion"
            label="Descripción"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={faseFormData.descripcion}
            onChange={handleFaseChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarFaseDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEditarFase} 
            color="primary"
            variant="contained"
            disabled={procesando || !faseFormData.numero || !faseFormData.nombre}
          >
            {procesando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para eliminar fase */}
      <Dialog open={openEliminarFaseDialog} onClose={handleCloseEliminarFaseDialog}>
        <DialogTitle>Eliminar Fase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la fase <strong>{selectedFase?.nombre}</strong>? Esta acción no se puede deshacer y eliminará todas las actividades asociadas a esta fase.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEliminarFaseDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarFase} 
            color="error"
            variant="contained"
            disabled={procesando}
          >
            {procesando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para crear actividad */}
      <Dialog open={openCrearActividadDialog} onClose={handleCloseCrearActividadDialog}>
        <DialogTitle>Nueva Actividad</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Creando actividad para la fase: <strong>{selectedFase?.nombre}</strong>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label="Nombre"
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
            label="Descripción"
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
            label="Tipo"
            fullWidth
            variant="outlined"
            value={actividadFormData.tipo}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
            SelectProps={{
              native: true
            }}
          >
            <option value="teorica">Teórica</option>
            <option value="practica">Práctica</option>
            <option value="evaluacion">Evaluación</option>
          </TextField>
          <TextField
            margin="dense"
            id="orden"
            name="orden"
            label="Orden"
            type="number"
            fullWidth
            variant="outlined"
            value={actividadFormData.orden}
            onChange={handleActividadChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearActividadDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleCrearActividad} 
            color="primary"
            variant="contained"
            disabled={procesando || !actividadFormData.nombre || !actividadFormData.orden}
          >
            {procesando ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para editar actividad */}
      <Dialog open={openEditarActividadDialog} onClose={handleCloseEditarActividadDialog}>
        <DialogTitle>Editar Actividad</DialogTitle>
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
            value={actividadFormData.nombre}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="descripcion"
            name="descripcion"
            label="Descripción"
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
            label="Tipo"
            fullWidth
            variant="outlined"
            value={actividadFormData.tipo}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
            SelectProps={{
              native: true
            }}
          >
            <option value="teorica">Teórica</option>
            <option value="practica">Práctica</option>
            <option value="evaluacion">Evaluación</option>
          </TextField>
          <TextField
            select
            margin="dense"
            id="fase"
            name="fase"
            label="Fase"
            fullWidth
            variant="outlined"
            value={actividadFormData.fase}
            onChange={handleActividadChange}
            required
            sx={{ mb: 2 }}
            SelectProps={{
              native: true
            }}
          >
            {fases.sort((a, b) => a.numero - b.numero).map((fase) => (
              <option key={fase._id} value={fase._id}>
                Fase {fase.numero}: {fase.nombre}
              </option>
            ))}
          </TextField>
          <TextField
            margin="dense"
            id="orden"
            name="orden"
            label="Orden"
            type="number"
            fullWidth
            variant="outlined"
            value={actividadFormData.orden}
            onChange={handleActividadChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarActividadDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEditarActividad} 
            color="primary"
            variant="contained"
            disabled={procesando || !actividadFormData.nombre || !actividadFormData.orden || !actividadFormData.fase}
          >
            {procesando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para eliminar actividad */}
      <Dialog open={openEliminarActividadDialog} onClose={handleCloseEliminarActividadDialog}>
        <DialogTitle>Eliminar Actividad</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la actividad <strong>{selectedActividad?.nombre}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEliminarActividadDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarActividad} 
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

export default AdminFases;
