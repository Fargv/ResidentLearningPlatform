import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import api from '../../api';
import BackButton from '../../components/BackButton';
import { useTranslation } from 'react-i18next';
import RichTextDescriptionField from '../../components/RichTextDescriptionField';

interface Sociedad {
  _id?: string;
  titulo: string;
  status?: string;
  urlLogo?: string;
  responsablePrograma?: string;
  fechaConvocatoria?: string;
  fechaPresentacion?: string;
  fechaModulosOnline?: string;
  fechaSimulacion?: string;
  fechaAtividadesFirstAssistant?: string;
  fechaModuloOnlineStepByStep?: string;
  fechaHandOn?: string;
  programInfo?: string;
}

const AdminSociedades = () => {
  const [sociedades, setSociedades] = useState<Sociedad[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof Sociedad>('titulo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<Sociedad>({
    titulo: '',
    status: 'ACTIVO',
    urlLogo: '',
    responsablePrograma: '',
    fechaConvocatoria: '',
    fechaPresentacion: '',
    fechaModulosOnline: '',
    fechaSimulacion: '',
    fechaAtividadesFirstAssistant: '',
    fechaModuloOnlineStepByStep: '',
    fechaHandOn: '',
    programInfo: ''
  });

  const { t } = useTranslation();

  const fetchSociedades = useCallback(async () => {
    const res = await api.get('/sociedades');
    setSociedades(res.data);
  }, []);

  useEffect(() => {
    fetchSociedades();
  }, [fetchSociedades]);


  const handleOpen = (s?: Sociedad) => {
    if (s) {
      setFormData({
        ...s,
        status: s.status || 'ACTIVO',
        urlLogo: s.urlLogo || '',
        responsablePrograma: s.responsablePrograma || '',
        fechaConvocatoria: s.fechaConvocatoria?.slice(0, 10) || '',
        fechaPresentacion: s.fechaPresentacion?.slice(0, 10) || '',
        fechaModulosOnline: s.fechaModulosOnline?.slice(0, 10) || '',
        fechaSimulacion: s.fechaSimulacion?.slice(0, 10) || '',
        fechaAtividadesFirstAssistant: s.fechaAtividadesFirstAssistant?.slice(0, 10) || '',
        fechaModuloOnlineStepByStep: s.fechaModuloOnlineStepByStep?.slice(0, 10) || '',
        fechaHandOn: s.fechaHandOn?.slice(0, 10) || '',
        programInfo: s.programInfo || ''
      });
    } else {
      setFormData({
        titulo: '',
        status: 'ACTIVO',
        urlLogo: '',
        responsablePrograma: '',
        fechaConvocatoria: '',
        fechaPresentacion: '',
        fechaModulosOnline: '',
        fechaSimulacion: '',
        fechaAtividadesFirstAssistant: '',
        fechaModuloOnlineStepByStep: '',
        fechaHandOn: '',
        programInfo: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      status: 'ACTIVO',
      urlLogo: '',
      responsablePrograma: '',
      fechaConvocatoria: '',
      fechaPresentacion: '',
      fechaModulosOnline: '',
      fechaSimulacion: '',
      fechaAtividadesFirstAssistant: '',
      fechaModuloOnlineStepByStep: '',
      fechaHandOn: '',
      programInfo: ''
    });
    setOpen(false);
  };

  const handleProgramInfoChange = (value?: string) => {
    setFormData((prev) => ({ ...prev, programInfo: value || '' }));
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

  const handleSave = async () => {
    if (formData._id) {
      await api.put(`/sociedades/${formData._id}`, formData);
    } else {
      await api.post('/sociedades', formData);
    }
    fetchSociedades();
    handleClose();
  };

  const handleSort = (field: keyof Sociedad) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/sociedades/${id}`);
    fetchSociedades();
  };

  const displaySociedades = sociedades
    .filter((s) => s.titulo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = (a as any)[sortField] || '';
      const bVal = (b as any)[sortField] || '';
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

 return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('adminSocieties.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BackButton sx={{ mr: 1 }} />
          <Button variant="contained" onClick={() => handleOpen()}>
            {t('adminSocieties.new')}
          </Button>
        </Box>
      </Box>

      <TextField
        variant="outlined"
        placeholder={t('adminSocieties.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort('titulo')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.title')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('status')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.status')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaConvocatoria')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.convocatoria')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaPresentacion')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.presentacion')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaModulosOnline')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.modOnline')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaSimulacion')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.simulacion')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaAtividadesFirstAssistant')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.firstAssistant')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaModuloOnlineStepByStep')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.stepByStep')}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('fechaHandOn')}
                  sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
                >
                  {t('adminSocieties.table.handsOn')}
                </TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'primary.light', color: 'common.white' }}>
                  {t('adminSocieties.table.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displaySociedades.map((s) => (
                <TableRow key={s._id} hover>
                  <TableCell>{s.titulo}</TableCell>
                  <TableCell>{s.status || '-'}</TableCell>
                  <TableCell>{s.fechaConvocatoria?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaPresentacion?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaModulosOnline?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaSimulacion?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaAtividadesFirstAssistant?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaModuloOnlineStepByStep?.slice(0, 10) || '-'}</TableCell>
                  <TableCell>{s.fechaHandOn?.slice(0, 10) || '-'}</TableCell>
                  <TableCell align="right">
                    <Button onClick={() => handleOpen(s)} size="small">
                      {t('adminSocieties.buttons.edit')}
                    </Button>
                    <Button color="error" onClick={() => handleDelete(s._id!)} size="small">
                      {t('adminSocieties.buttons.delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>


      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {formData._id ? t('adminSocieties.dialog.editTitle') : t('adminSocieties.dialog.createTitle')}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label={t('adminSocieties.fields.titulo')}
            name="titulo"
            fullWidth
            value={formData.titulo}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="status-label">{t('adminSocieties.fields.status')}</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formData.status}
              label={t('adminSocieties.fields.status')}
              onChange={handleChange}
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label={t('adminSocieties.fields.urlLogo')}
            name="urlLogo"
            fullWidth
            value={formData.urlLogo}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label={t('adminSocieties.fields.responsablePrograma')}
            name="responsablePrograma"
            fullWidth
            value={formData.responsablePrograma}
            onChange={handleChange}
          />
          <RichTextDescriptionField
            label={t('adminSocieties.fields.programInfo')}
            value={formData.programInfo ?? ''}
            onChange={handleProgramInfoChange}
            minHeight={160}
          />
          {[
            'fechaConvocatoria',
            'fechaPresentacion',
            'fechaModulosOnline',
            'fechaSimulacion',
            'fechaAtividadesFirstAssistant',
            'fechaModuloOnlineStepByStep',
            'fechaHandOn'
          ].map((field) => (
            <TextField
              key={field}
              margin="dense"
              label={t(`adminSocieties.fields.${field}`)}
              name={field}
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={(formData as any)[field] || ''}
              onChange={handleChange}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('adminSocieties.buttons.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>
            {t('adminSocieties.buttons.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSociedades;
