import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  //Grid,
  // Card,
  // CardContent,
  // Divider,
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
  //Chip,
  LinearProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
  //LocalHospital as HospitalIcon
} from '@mui/icons-material';
import BackButton from '../../components/BackButton';
import api from '../../api';
import { useTranslation, Trans } from 'react-i18next';

interface Hospital {
  _id: string;
  nombre: string;
  codigoNumerico?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  telefono?: string;
  email?: string;
  tipoSistema?: string;
  zona?: string;
}

const AdminHospitales: React.FC = () => {
  //const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospitales, setHospitales] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<
    'nombre' | 'ciudad' | 'provincia' | 'zona' | 'telefono' | 'email'
  >('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openCrearDialog, setOpenCrearDialog] = useState(false);
  const [openEditarDialog, setOpenEditarDialog] = useState(false);
  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [usuariosAsociados, setUsuariosAsociados] = useState(0);
  const [formData, setFormData] = useState<Omit<Hospital, '_id'>>({
        nombre: '',
        codigoNumerico: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
        telefono: '',
        email: '',
        tipoSistema: '',
        zona: ''
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
      const res = await api.get('/hospitals');
      setHospitales(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || t('adminHospitals.loadError'));
    } finally {
      setLoading(false);
    }
  };

  fetchHospitales();
}, [t]);

  const handleOpenCrearDialog = () => {
    setFormData({
      nombre: '',
      codigoNumerico: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      telefono: '',
      email: '',
      tipoSistema: '',
      zona: ''
    });
    setOpenCrearDialog(true);
  };

  const handleCloseCrearDialog = () => {
    setOpenCrearDialog(false);
  };

  const handleOpenEditarDialog = (hospital: Hospital) => {

    setSelectedHospital(hospital);
    setFormData({
      nombre: hospital.nombre,
      codigoNumerico: hospital.codigoNumerico || '',
      direccion: hospital.direccion || '',
      ciudad: hospital.ciudad || '',
      provincia: hospital.provincia || '',
      codigoPostal: hospital.codigoPostal || '',
      telefono: hospital.telefono || '',
      email: hospital.email || '',
      tipoSistema: hospital.tipoSistema || '',
      zona: hospital.zona || ''
    });
    setOpenEditarDialog(true);
  };

  const handleCloseEditarDialog = () => {
    setOpenEditarDialog(false);
    setSelectedHospital(null);
  };

  const handleOpenEliminarDialog = async (hospital: Hospital) => {

    setSelectedHospital(hospital);
    setUsuariosAsociados(0);
    try {
      const res = await api.get(`/hospitals/${hospital._id}/stats`);
      const { residentes = 0, formadores = 0 } = res.data.data || {};
      setUsuariosAsociados(residentes + formadores);
    } catch {
      setUsuariosAsociados(0);
    }
    setOpenEliminarDialog(true);
  };

  const handleCloseEliminarDialog = () => {
    setOpenEliminarDialog(false);
    setSelectedHospital(null);
    setUsuariosAsociados(0);
  };

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<{ name?: string; value: unknown }> | any
) => {
  const { name, value } = e.target;
  setFormData({
    ...formData,
    [name as string]: value
  });
};

  const handleCrear = async () => {
    try {
      setProcesando(true);
      
      const res = await api.post('/hospitals', {
        ...formData,
        codigoNumerico: parseInt(formData.codigoNumerico as any)
      });
      
      // Actualizar lista de hospitales
      setHospitales([...hospitales, res.data.data]);
      
      handleCloseCrearDialog();
      
      setSnackbar({
        open: true,
        message: t('adminHospitals.createSuccess'),
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || t('adminHospitals.createError'));
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('adminHospitals.createError'),
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
      
      const res = await api.put(`/hospitals/${selectedHospital._id}`, {
        ...formData,
        codigoNumerico: parseInt(formData.codigoNumerico as any)
      });
      
      // Actualizar lista de hospitales
      setHospitales(hospitales.map(h => h._id === selectedHospital._id ? res.data.data : h));
      
      handleCloseEditarDialog();
      
      setSnackbar({
        open: true,
        message: t('adminHospitals.updateSuccess'),
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || t('adminHospitals.updateError'));
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('adminHospitals.updateError'),
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
      
      await api.delete(`/hospitals/${selectedHospital._id}`);
      
      // Actualizar lista de hospitales
      setHospitales(hospitales.filter(h => h._id !== selectedHospital._id));
      
      handleCloseEliminarDialog();
      
      setSnackbar({
        open: true,
        message: t('adminHospitals.deleteSuccess'),
        severity: 'success'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || t('adminHospitals.deleteError'));
      
      setSnackbar({
        open: true,
        message: err.response?.data?.error || t('adminHospitals.deleteError'),
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

  const handleSort = (
    field: 'nombre' | 'ciudad' | 'provincia' | 'zona' | 'telefono' | 'email'
  ) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const displayHospitales = hospitales
    .filter((h) => h.nombre.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = ((a as any)[sortField] || '') as string;
      const bVal = ((b as any)[sortField] || '') as string;
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

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
          {t('adminHospitals.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BackButton sx={{ mr: 1 }} />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCrearDialog}
          >
            {t('adminHospitals.new')}
          </Button>
        </Box>
      </Box>

      <TextField
        variant="outlined"
        placeholder={t('adminHospitals.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />

      {/* Tabla de hospitales */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label={t('adminHospitals.table.aria')}>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort('nombre')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminHospitals.table.name')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('ciudad')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminHospitals.table.city')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('provincia')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminHospitals.table.province')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('zona')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminHospitals.table.zone')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('telefono')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminHospitals.table.phone')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('email')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminHospitals.table.email')}
                </TableCell>
                <TableCell align="right">{t('adminHospitals.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayHospitales.map((hospital) => (
                <TableRow key={hospital._id} hover>
                  <TableCell>{hospital.nombre}</TableCell>
                  <TableCell>{hospital.ciudad || '-'}</TableCell>
                  <TableCell>{hospital.provincia || '-'}</TableCell>
                  <TableCell>{hospital.zona || '-'}</TableCell>
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
        <DialogTitle>{t('adminHospitals.create.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label={t('adminHospitals.fields.name')}
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
            id="codigoNumerico"
            name="codigoNumerico"
            label={t('adminHospitals.fields.numericCode')}
            type="number"
            fullWidth
            variant="outlined"
            value={formData.codigoNumerico}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="direccion"
            name="direccion"
            label={t('adminHospitals.fields.address')}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.direccion}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
<Box display="flex" flexWrap="wrap" gap={2}>
  <Box flex="1 1 100%" maxWidth={{ xs: '100%', sm: 'calc(50% - 8px)' }} p={2}>
    <TextField
      margin="dense"
      id="ciudad"
      name="ciudad"
      label={t('adminHospitals.fields.city')}
      type="text"
      fullWidth
      variant="outlined"
      value={formData.ciudad}
      onChange={handleChange}
    />
  </Box>
  <Box flex="1 1 100%" maxWidth={{ xs: '100%', sm: 'calc(50% - 8px)' }} p={2}>
    <TextField
      margin="dense"
      id="provincia"
      name="provincia"
      label={t('adminHospitals.fields.province')}
      type="text"
      fullWidth
      variant="outlined"
      value={formData.provincia}
      onChange={handleChange}
    />
  </Box>
</Box>


        <FormControl fullWidth margin="dense">
          <InputLabel id="zona-label">{t('adminHospitals.fields.zone')}</InputLabel>
          <Select
            labelId="zona-label"
            id="zona"
            name="zona"
            value={formData.zona}
            label={t('adminHospitals.fields.zone')}
            onChange={handleChange}
          >
            <MenuItem value="NORDESTE">NORDESTE</MenuItem>
            <MenuItem value="NORTE">NORTE</MenuItem>
            <MenuItem value="CENTRO">CENTRO</MenuItem>
            <MenuItem value="ANDALUCÍA">ANDALUCÍA</MenuItem>
            <MenuItem value="PORTUGAL">PORTUGAL</MenuItem>
            <MenuItem value="LEVANTE">LEVANTE</MenuItem>
            <MenuItem value="CANARIAS">CANARIAS</MenuItem>
          </Select>
        </FormControl>

          <TextField
            margin="dense"
            id="codigoPostal"
            name="codigoPostal"
            label={t('adminHospitals.fields.postalCode')}
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
            label={t('adminHospitals.fields.phone')}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.telefono}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            id="tipoSistema"
            name="tipoSistema"
            label={t('adminHospitals.fields.systemType')}
            fullWidth
            variant="outlined"
            value={formData.tipoSistema}
            onChange={handleChange}
            required
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="Xi">Xi</option>
            <option value="X">X</option>
            <option value="SP">SP</option>
            <option value="Otro">{t('adminHospitals.system.other')}</option>
          </TextField>
          <TextField
            margin="dense"
            id="email"
            name="email"
            label={t('adminHospitals.fields.email')}
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCrearDialog} color="primary">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleCrear} 
            color="primary"
            variant="contained"
             disabled={
              procesando ||
              !formData.nombre ||
              !formData.codigoNumerico ||
              !formData.tipoSistema
            }
          >
            {procesando ? t('common.creating') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar hospital */}
      <Dialog open={openEditarDialog} onClose={handleCloseEditarDialog}>
        <DialogTitle>{t('adminHospitals.edit.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label={t('adminHospitals.fields.name')}
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
            id="codigoNumerico"
            name="codigoNumerico"
            label={t('adminHospitals.fields.numericCode')}
            type="number"
            fullWidth
            variant="outlined"
            value={formData.codigoNumerico}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="direccion"
            name="direccion"
            label={t('adminHospitals.fields.address')}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.direccion}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
<Box display="flex" flexWrap="wrap" gap={2}>
  <Box flex="1 1 100%" maxWidth={{ xs: '100%', sm: 'calc(50% - 8px)' }} p={2}>
    <TextField
      margin="dense"
      id="ciudad"
      name="ciudad"
      label={t('adminHospitals.fields.city')}
      type="text"
      fullWidth
      variant="outlined"
      value={formData.ciudad}
      onChange={handleChange}
    />
  </Box>
  <Box flex="1 1 100%" maxWidth={{ xs: '100%', sm: 'calc(50% - 8px)' }} p={2}>
    <TextField
      margin="dense"
      id="provincia"
      name="provincia"
      label={t('adminHospitals.fields.province')}
      type="text"
      fullWidth
      variant="outlined"
      value={formData.provincia}
      onChange={handleChange}
    />
  </Box>
</Box>     
            <FormControl fullWidth margin="dense">
            <InputLabel id="zona-edit-label">{t('adminHospitals.fields.zone')}</InputLabel>
            <Select
              labelId="zona-edit-label"
              id="zona-edit"
              name="zona"
              value={formData.zona}
              label={t('adminHospitals.fields.zone')}
              onChange={handleChange}
            >
              <MenuItem value="NORDESTE">NORDESTE</MenuItem>
              <MenuItem value="NORTE">NORTE</MenuItem>
              <MenuItem value="CENTRO">CENTRO</MenuItem>
              <MenuItem value="ANDALUCÍA">ANDALUCÍA</MenuItem>
              <MenuItem value="PORTUGAL">PORTUGAL</MenuItem>
              <MenuItem value="LEVANTE">LEVANTE</MenuItem>
              <MenuItem value="CANARIAS">CANARIAS</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            id="codigoPostal"
            name="codigoPostal"
            label={t('adminHospitals.fields.postalCode')}
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
            label={t('adminHospitals.fields.phone')}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.telefono}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            id="tipoSistema"
            name="tipoSistema"
            label={t('adminHospitals.fields.systemType')}
            fullWidth
            variant="outlined"
            value={formData.tipoSistema}
            onChange={handleChange}
            required
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="Xi">Xi</option>
            <option value="X">X</option>
            <option value="SP">SP</option>
            <option value="Otro">{t('adminHospitals.system.other')}</option>
          </TextField>
          <TextField
            margin="dense"
            id="email"
            name="email"
            label={t('adminHospitals.fields.email')}
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditarDialog} color="primary">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleEditar} 
            color="primary"
            variant="contained"
            disabled={
              procesando ||
              !formData.nombre ||
              !formData.codigoNumerico ||
              !formData.tipoSistema
            }
          >
            {procesando ? t('common.saving') : t('common.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para eliminar hospital */}
      <Dialog open={openEliminarDialog} onClose={handleCloseEliminarDialog}>
        <DialogTitle>{t('adminHospitals.delete.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans
              i18nKey="adminHospitals.delete.confirm"
              values={{ name: selectedHospital?.nombre, count: usuariosAsociados }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEliminarDialog} color="primary">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleEliminar}
            color="error"
            variant="contained"
            disabled={procesando}
          >
            {procesando ? t('common.deleting') : t('common.delete')}
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
