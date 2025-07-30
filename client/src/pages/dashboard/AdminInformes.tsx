import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

interface Usuario {
  _id: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo?: string;
  hospital?: { nombre: string } | null;
  sociedad?: { titulo: string } | null;
}

const AdminInformes: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/users');
        setUsuarios(res.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los informes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Progreso de Usuarios
      </Typography>
      <TextField
        variant="outlined"
        placeholder="Buscar por nombre o email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TableContainer component={Paper}>
        <Table size="small" stickyHeader aria-label="tabla de usuarios">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Programa</TableCell>
              <TableCell>Hospital/Sociedad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios
              .filter((u) => {
                const query = search.toLowerCase();
                return (
                  u.nombre.toLowerCase().includes(query) ||
                  u.apellidos.toLowerCase().includes(query) ||
                  u.email.toLowerCase().includes(query)
                );
              })
              .map((u) => (
              <TableRow
                key={u._id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/dashboard/progreso-usuario/${u._id}`)}
              >
                <TableCell>{u.nombre} {u.apellidos}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.tipo || '-'}</TableCell>
                <TableCell>{u.hospital?.nombre || u.sociedad?.titulo || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminInformes;
