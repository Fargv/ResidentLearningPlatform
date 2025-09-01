import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';

interface User {
  _id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  hospital?: { nombre: string } | null;
  sociedad?: { titulo: string } | null;
}

const AdminProgresoUsuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'nombre' | 'email' | 'hospital' | 'rol'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        const all = res.data.data || res.data;
        setUsers(all.filter((u: User) => u.rol === 'residente' || u.rol === 'participante'));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  const handleSort = (field: 'nombre' | 'email' | 'hospital' | 'rol') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const displayUsers = users
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.apellidos.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';
      switch (sortField) {
        case 'email':
        case 'nombre':
        case 'rol':
          aVal = (a as any)[sortField] || '';
          bVal = (b as any)[sortField] || '';
          break;
        case 'hospital':
          aVal = a.hospital?.nombre || a.sociedad?.titulo || '';
          bVal = b.hospital?.nombre || b.sociedad?.titulo || '';
          break;
        default:
          break;
      }
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('adminUserProgress.title')}
      </Typography>
      <TextField
        variant="outlined"
        placeholder={t('adminUserProgress.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                onClick={() => handleSort('nombre')}
                sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
              >
                {t('adminUserProgress.table.name')}
              </TableCell>
              <TableCell
                onClick={() => handleSort('email')}
                sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
              >
                {t('adminUserProgress.table.email')}
              </TableCell>
              <TableCell
                onClick={() => handleSort('hospital')}
                sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
              >
                {t('adminUserProgress.table.hospitalSociety')}
              </TableCell>
              <TableCell
                onClick={() => handleSort('rol')}
                sx={{ cursor: 'pointer', backgroundColor: 'primary.light', color: 'common.white' }}
              >
                {t('adminUserProgress.table.role')}
              </TableCell>
              <TableCell
                align="right"
                sx={{ backgroundColor: 'primary.light', color: 'common.white' }}
              >
                {t('adminUserProgress.table.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayUsers.map((u) => (
              <TableRow key={u._id} hover>
                <TableCell>{u.nombre} {u.apellidos}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.hospital?.nombre || u.sociedad?.titulo || '-'}</TableCell>
                <TableCell>{t(`roles.${u.rol}`)}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/dashboard/progreso-usuario/${u._id}`)}
                      sx={{ minWidth: 150 }}
                    >
                      {t('adminUserProgress.viewProgress')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminProgresoUsuarios;

