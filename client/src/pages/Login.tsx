import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,

} from '@mui/material';
import { useAuth } from '../context/AuthContext';
//import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { email, password } = formData;
  const { login, error, loading, clearError } = useAuth();
  //const navigate = useNavigate();
//const location = useLocation();

  // Obtener la ubicación anterior si existe
  //const from = location.state?.from?.pathname || '/dashboard';

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) clearError();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(email, password);
    // La redirección se maneja en el useEffect del AuthContext
  };

  return (
    <Box
  sx={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'background.default',
    py: 4
  }}
>
  <Container maxWidth="sm">
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 2
      }}
    >
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <img
          src="/logo.png"
          alt="Abex Excelencia Robótica"
          style={{ maxWidth: '200px', marginBottom: '16px' }}
        />
        <Typography variant="h4" component="h1" gutterBottom>
          Plataforma de Formación
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Tecnologías del Robot da Vinci
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit} sx={{ width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={onChange}
          disabled={loading}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Contraseña"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={onChange}
          disabled={loading}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
        </Button>

        <Box sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>
      </Box>
    </Paper>

    <Box sx={{ mt: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Abex Excelencia Robótica
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Powered by Intuitive Surgical
      </Typography>
    </Box>
  </Container>
</Box>

  );
};

export default Login;
