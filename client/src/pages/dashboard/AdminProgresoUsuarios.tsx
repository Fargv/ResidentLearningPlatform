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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data.data || res.data);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Hospital/Sociedad</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .filter((u) => {
                const q = search.toLowerCase();
                return (
                  u.nombre.toLowerCase().includes(q) ||
                  u.apellidos.toLowerCase().includes(q) ||
                  u.email.toLowerCase().includes(q)
                );
              })
              .map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell>{u.nombre} {u.apellidos}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.hospital?.nombre || u.sociedad?.titulo || '-'}</TableCell>
                  <TableCell>{u.rol}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/dashboard/progreso-usuario/${u._id}`)}
                      sx={{ minWidth: 150 }}
                    >
                      Ver Progreso
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

