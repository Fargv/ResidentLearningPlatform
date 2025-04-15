import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const DebugDashboard = () => {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);

    if (!storedToken) {
      setStatus('❌ Token no encontrado en localStorage');
      return;
    }

    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      setDecoded(payload);
      setStatus('✅ Token válido y decodificado');
    } catch (error) {
      setStatus('❌ Token no válido o corrupto');
    }
  }, []);

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Typography variant="h4" gutterBottom>
        🛠️ Debug Panel - Diagnóstico de Sesión
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Estado del token:</Typography>
        <Chip label={status} color={status.includes('✅') ? 'success' : 'error'} sx={{ mt: 1 }} />

        <Typography variant="h6" sx={{ mt: 3 }}>Token JWT (abreviado):</Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
          {token ? `${token.slice(0, 60)}...` : 'No disponible'}
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }}>Usuario decodificado:</Typography>
        <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 6 }}>
          {decoded ? JSON.stringify(decoded, null, 2) : 'No decodificado'}
        </pre>

        <Typography variant="h6" sx={{ mt: 3 }}>Contexto de usuario (`useAuth`):</Typography>
        <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 6 }}>
          {user ? JSON.stringify(user, null, 2) : 'No cargado'}
        </pre>
      </Paper>
    </Box>
  );
};

export default DebugDashboard;
