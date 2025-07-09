import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import {
  getNotificaciones,
  marcarNotificacionLeida,
  eliminarNotificacion
} from '../../api';

interface Notificacion {
  _id: string;
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
  tipo?: string;
}

interface NotificacionesProps {
  onChange?: () => void;
}

const Notificaciones: React.FC<NotificacionesProps> = ({ onChange }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getNotificaciones();
      setNotificaciones(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarcarLeida = async (id: string) => {
    try {
      await marcarNotificacionLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n._id === id ? { ...n, leida: true } : n))
      );
      onChange?.();
    } catch (err: any) {
      console.error('Error marcando notificación como leída', err);
    }
  };

  const handleEliminar = async (id: string) => {
    try {
      await eliminarNotificacion(id);
      setNotificaciones((prev) => prev.filter((n) => n._id !== id));
      onChange?.();
    } catch (err: any) {
      console.error('Error eliminando notificación', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
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
      <Typography variant="h4" gutterBottom>
        Notificaciones
      </Typography>
      {notificaciones.length === 0 ? (
        <Typography>No hay notificaciones</Typography>
      ) : (
        <List>
          {notificaciones.map((n) => (
            <ListItem key={n._id} divider>
              <ListItemText
                primary={n.mensaje}
                secondary={new Date(n.fechaCreacion).toLocaleString()}
              />
              {n.tipo && (
                <Chip
                  label={n.tipo}
                  size="small"
                  color={n.leida ? 'default' : 'primary'}
                  sx={{ mr: 1 }}
                />
              )}
              <ListItemSecondaryAction>
                {!n.leida && (
                  <IconButton edge="end" aria-label="read" onClick={() => handleMarcarLeida(n._id)}>
                    <DoneIcon />
                  </IconButton>
                )}
                <IconButton edge="end" aria-label="delete" onClick={() => handleEliminar(n._id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default Notificaciones;