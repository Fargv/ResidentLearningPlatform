import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Hospital/Sociedad</TableCell>
              <TableCell>Rol</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow
                key={u._id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/dashboard/progreso-usuario/${u._id}`)}
              >
                <TableCell>{u.nombre} {u.apellidos}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.hospital?.nombre || u.sociedad?.titulo || '-'}</TableCell>
                <TableCell>{u.rol}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminProgresoUsuarios;
