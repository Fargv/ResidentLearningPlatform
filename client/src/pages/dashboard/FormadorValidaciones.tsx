import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  //Grid,
  Card,
  CardContent,
  //Divider,
  Button,
  Chip,
  LinearProgress,
  List,
  //ListItem,
  //ListItemText,
  //ListItemAvatar,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tab,
  Tabs
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  //Pending as PendingIcon,
  Error as ErrorIcon
  //School as SchoolIcon
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
      id={`validaciones-tabpanel-${index}`}
      aria-labelledby={`validaciones-tab-${index}`}
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

const FormadorValidaciones: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [validadas, setValidadas] = useState<any[]>([]);
  const [rechazadas, setRechazadas] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openValidarDialog, setOpenValidarDialog] = useState(false);
  const [openRechazarDialog, setOpenRechazarDialog] = useState(false);
  const [selectedProgreso, setSelectedProgreso] = useState<any>(null);
  const [comentarios, setComentarios] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [firmaDigital, setFirmaDigital] = useState('');

  const fetchValidaciones = async () => {
  try {
    setLoading(true);

    const respuesta = await axios.get('/api/progreso/formador/validaciones/pendientes');
    const { pendientes, validadas, rechazadas } = respuesta.data.data || {};
console.log('Validaciones recibidas:', { pendientes, validadas, rechazadas });
    setPendientes(pendientes || []);
setValidadas(validadas || []);
setRechazadas(rechazadas || []);

  } catch (err: any) {
    setError(err.response?.data?.error || 'Error al cargar las validaciones');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (user?.rol === 'formador') {
    fetchValidaciones();
  }
}, [user]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenValidarDialog = (progreso: any) => {
    setSelectedProgreso(progreso);
    setComentarios('');
    setFirmaDigital(`${user?.nombre} ${user?.apellidos} - ${new Date().toLocaleDateString()}`);
    setOpenValidarDialog(true);
  };

  const handleCloseValidarDialog = () => {
    setOpenValidarDialog(false);
    setSelectedProgreso(null);
    setComentarios('');
    setFirmaDigital('');
  };

  const handleOpenRechazarDialog = (progreso: any) => {
    setSelectedProgreso(progreso);
    setComentarios('');
    setOpenRechazarDialog(true);
  };

  const handleCloseRechazarDialog = () => {
    setOpenRechazarDialog(false);
    setSelectedProgreso(null);
    setComentarios('');
  };

  const handleValidar = async () => {
  if (!selectedProgreso || !firmaDigital) return;

  setProcesando(true);
  try {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/progreso/${selectedProgreso.progresoId}/actividad/${selectedProgreso.index}/validar`,
      {
        comentarios,
        firmaDigital,
      }
    );
    handleCloseValidarDialog();
    fetchValidaciones(); // Refresca la lista desde el backend
  } catch (error) {
    console.error('Error al validar actividad:', error);
  } finally {
    setProcesando(false);
  }
};

const handleRechazar = async () => {
  if (!selectedProgreso || !comentarios) return;

  setProcesando(true);
  try {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/progreso/${selectedProgreso.progresoId}/actividad/${selectedProgreso.index}/rechazar`,
      {
        comentarios,
      }
    );
    handleCloseRechazarDialog();
    fetchValidaciones(); // Refresca la lista desde el backend
  } catch (error) {
    console.error('Error al rechazar actividad:', error);
  } finally {
    setProcesando(false);
  }
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
      <Typography variant="h4" component="h1" gutterBottom>
        Validaciones
      </Typography>
      
      {/* Resumen */}
      <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" flexWrap="wrap" gap={2}>
  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
    <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">{pendientes.length}</Typography>
        <Typography variant="body2">Pendientes</Typography>
      </CardContent>
    </Card>
  </Box>

  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
    <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">{validadas.length}</Typography>
        <Typography variant="body2">Validadas</Typography>
      </CardContent>
    </Card>
  </Box>

  <Box sx={{ p: 2, flexBasis: { xs: '100%', sm: '33.333%' } }}>
    <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
      <CardContent>
        <Typography variant="h4">{rechazadas.length}</Typography>
        <Typography variant="body2">Rechazadas</Typography>
      </CardContent>
    </Card>
  </Box>
</Box>

      </Paper>
      
      {/* Pestañas */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="validaciones tabs"
          >
            <Tab 
              label={`Pendientes (${pendientes.length})`} 
              id="validaciones-tab-0"
              aria-controls="validaciones-tabpanel-0"
            />
            <Tab 
              label={`Validadas (${validadas.length})`} 
              id="validaciones-tab-1"
              aria-controls="validaciones-tabpanel-1"
            />
            <Tab 
              label={`Rechazadas (${rechazadas.length})`} 
              id="validaciones-tab-2"
              aria-controls="validaciones-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Panel de Pendientes */}
        <TabPanel value={tabValue} index={0}>
          {pendientes.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No hay validaciones pendientes
            </Typography>
          ) : (
            <List>
              {pendientes.map((progreso) => (
                <Paper key={progreso._id} sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 2,
                        flexBasis: { xs: '100%', sm: '75%' },
                        flexGrow: 1,
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Actividad: {progreso.actividad.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fase: {progreso.fase?.nombre || 'Sin fase'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Residente: {progreso.residente.nombre} {progreso.residente.apellidos}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fecha: {new Date(progreso.fechaCreacion).toLocaleDateString()}
                      </Typography>
                      {progreso.actividad.comentariosResidente && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Comentarios:</strong> {progreso.actividad.comentariosResidente}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        flexBasis: { xs: '100%', sm: '25%' },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleOpenValidarDialog({ progresoId: progreso.progresoId, index: progreso.index, ...progreso })}
                        fullWidth
                      >
                        Validar
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<ErrorIcon />}
                        onClick={() => handleOpenRechazarDialog({ progresoId: progreso.progresoId, index: progreso.index, ...progreso })}
                        fullWidth
                      >
                        Rechazar
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
        
        {/* Panel de Validadas */}
        <TabPanel value={tabValue} index={1}>
          {validadas.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No hay validaciones completadas
            </Typography>
          ) : (
            <List>
              {validadas.map(progreso => (
                <Paper key={progreso._id} sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
  <Box
    sx={{
      p: 2,
      flexBasis: { xs: '100%', sm: '75%' }, // 9/12
      flexGrow: 1
    }}
  >
    <Typography variant="h6">
      {progreso.actividad.nombre}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Fase: {progreso.actividad.fase.nombre}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
        {progreso.residente.nombre.charAt(0)}
      </Avatar>
      <Typography variant="body2">
        {progreso.residente.nombre} {progreso.residente.apellidos}
      </Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Validado el: {new Date(progreso.fechaActualizacion || progreso.fechaCreacion).toLocaleDateString()}
    </Typography>
    {progreso.validaciones && progreso.validaciones.length > 0 && (
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>Comentarios:</strong> {progreso.validaciones[0].comentarios}
      </Typography>
    )}
  </Box>

  <Box
    sx={{
      p: 2,
      flexBasis: { xs: '100%', sm: '25%' }, // 3/12
      display: 'flex',
      justifyContent: 'flex-end'
    }}
  >
    <Chip
      icon={<CheckCircleIcon />}
      label="Validado"
      color="success"
      variant="outlined"
    />
  </Box>
</Box>

                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
        
        {/* Panel de Rechazadas */}
        <TabPanel value={tabValue} index={2}>
          {rechazadas.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No hay validaciones rechazadas
            </Typography>
          ) : (
            <List>
              {rechazadas.map(progreso => (
                <Paper key={progreso._id} sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
  <Box
    sx={{
      p: 2,
      flexBasis: { xs: '100%', sm: '75%' }, // 9/12
      flexGrow: 1
    }}
  >
    <Typography variant="h6">
      {progreso.actividad.nombre}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Fase: {progreso.actividad.fase.nombre}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
        {progreso.residente.nombre.charAt(0)}
      </Avatar>
      <Typography variant="body2">
        {progreso.residente.nombre} {progreso.residente.apellidos}
      </Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Rechazado el: {new Date(progreso.fechaActualizacion || progreso.fechaCreacion).toLocaleDateString()}
    </Typography>
    {progreso.comentariosRechazo && (
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>Motivo:</strong> {progreso.comentariosRechazo}
      </Typography>
    )}
  </Box>

  <Box
    sx={{
      p: 2,
      flexBasis: { xs: '100%', sm: '25%' }, // 3/12
      display: 'flex',
      justifyContent: 'flex-end'
    }}
  >
    <Chip
      icon={<ErrorIcon />}
      label="Rechazado"
      color="error"
      variant="outlined"
    />
  </Box>
</Box>

                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>
      
      {/* Diálogo para validar */}
      <Dialog open={openValidarDialog} onClose={handleCloseValidarDialog}>
        <DialogTitle>Validar Actividad</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Estás validando la actividad <strong>{selectedProgreso?.actividad?.nombre}</strong> del residente <strong>{selectedProgreso?.residente?.nombre} {selectedProgreso?.residente?.apellidos}</strong>.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="comentarios"
            label="Comentarios (opcional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="firma"
            label="Firma Digital"
            type="text"
            fullWidth
            variant="outlined"
            value={firmaDigital}
            onChange={(e) => setFirmaDigital(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseValidarDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleValidar} 
            color="success"
            variant="contained"
            disabled={procesando || !firmaDigital}
          >
            {procesando ? 'Procesando...' : 'Validar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para rechazar */}
      <Dialog open={openRechazarDialog} onClose={handleCloseRechazarDialog}>
        <DialogTitle>Rechazar Actividad</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Estás rechazando la actividad <strong>{selectedProgreso?.actividad?.nombre}</strong> del residente <strong>{selectedProgreso?.residente?.nombre} {selectedProgreso?.residente?.apellidos}</strong>.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="comentarios"
            label="Motivo del rechazo"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRechazarDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleRechazar} 
            color="error"
            variant="contained"
            disabled={procesando || !comentarios}
          >
            {procesando ? 'Procesando...' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormadorValidaciones;
