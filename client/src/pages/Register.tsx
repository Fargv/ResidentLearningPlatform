import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface InvitacionData {
  email: string;
  nombre: string;
  apellidos: string;
  rol: string;
  hospital?: {
    nombre: string;
  };
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    password: '',
    confirmPassword: '',
    consentimientoDatos: false
  });
  const [invitacion, setInvitacion] = useState<InvitacionData | null>(null);
  const [loadingInvitacion, setLoadingInvitacion] = useState(true);
  const [invitacionError, setInvitacionError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const { nombre, apellidos, password, confirmPassword, consentimientoDatos } = formData;
  const { register, error, loading, clearError } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  // Verificar token de invitación
  useEffect(() => {
    const verificarToken = async () => {
      try {
        const res = await axios.get(`/api/users/invite/verify/${token}`);
        setInvitacion(res.data.data);
        
        // Pre-llenar el formulario con los datos de la invitación
        setFormData(prevState => ({
          ...prevState,
          nombre: res.data.data.nombre || '',
          apellidos: res.data.data.apellidos || ''
        }));
      } catch (err: any) {
        setInvitacionError(err.response?.data?.error || 'Token de invitación inválido o expirado');
      } finally {
        setLoadingInvitacion(false);
      }
    };

    if (token) {
      verificarToken();
    } else {
      setInvitacionError('No se proporcionó un token de invitación');
      setLoadingInvitacion(false);
    }
  }, [token]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'consentimientoDatos' ? checked : value 
    });
    
    if (error) clearError();
    
    // Validar contraseñas
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword' && value !== password) {
        setPasswordError('Las contraseñas no coinciden');
      } else if (name === 'password' && confirmPassword && value !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
      } else {
        setPasswordError(null);
      }
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar contraseñas
    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (!consentimientoDatos) {
      return;
    }
    
    // Registrar usuario
    if (token) {
      await register({
        nombre,
        apellidos,
        password,
        token,
        consentimientoDatos
      });
    }
  };

  if (loadingInvitacion) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (invitacionError) {
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
            <Typography variant="h5" component="h1" gutterBottom>
              Error de Invitación
            </Typography>
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {invitacionError}
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
            >
              Volver al Inicio de Sesión
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
              Completar Registro
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Plataforma de Formación en Tecnologías del Robot da Vinci
            </Typography>
          </Box>

          {invitacion && (
            <Box sx={{ mb: 3, width: '100%' }}>
              <Alert severity="info">
                <Typography variant="body1">
                  <strong>Email:</strong> {invitacion.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Rol:</strong> {invitacion.rol === 'residente' ? 'Residente' : invitacion.rol === 'formador' ? 'Formador' : 'Administrador'}
                </Typography>
                {invitacion.hospital && (
                  <Typography variant="body1">
                    <strong>Hospital:</strong> {invitacion.hospital.nombre}
                  </Typography>
                )}
              </Alert>
            </Box>
          )}

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
              id="nombre"
              label="Nombre"
              name="nombre"
              autoComplete="given-name"
              autoFocus
              value={nombre}
              onChange={onChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="apellidos"
              label="Apellidos"
              name="apellidos"
              autoComplete="family-name"
              value={apellidos}
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
              autoComplete="new-password"
              value={password}
              onChange={onChange}
              disabled={loading}
              error={!!passwordError}
              helperText={passwordError}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={onChange}
              disabled={loading}
              error={!!passwordError}
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="consentimientoDatos"
                  checked={consentimientoDatos}
                  onChange={onChange}
                  color="primary"
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  Acepto el tratamiento de mis datos personales de acuerdo con la{' '}
                  <Link href="/politica-privacidad" target="_blank">
                    Política de Privacidad
                  </Link>
                  {' '}y cumplo con la LOPD.
                </Typography>
              }
              sx={{ mt: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || !consentimientoDatos}
            >
              {loading ? <CircularProgress size={24} /> : 'Completar Registro'}
            </Button>
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

export default Register;
