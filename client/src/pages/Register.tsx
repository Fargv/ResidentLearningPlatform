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
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';

interface Hospital {
  _id: string;
  nombre: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    codigoAcceso: '',
    consentimientoDatos: false,
    hospital: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [hospitales, setHospitales] = useState<Hospital[]>([]);

  const { nombre, apellidos, email, password, confirmPassword, codigoAcceso, consentimientoDatos, hospital } = formData;
  const { register, error, loading, clearError } = useAuth();

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        console.log("Usando API URL:", apiUrl);
        const res = await fetch(`${apiUrl}/hospitales`);
        const data = await res.json();
        setHospitales(data.data);
      } catch (error) {
        console.error('Error cargando hospitales:', error);
      }
    };

    fetchHospitales();
  }, []);

  const onChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) clearError();

    if ((name === 'password' || name === 'confirmPassword') && value !== formData.password) {
      setPasswordError('Las contraseñas no coinciden');
    } else {
      setPasswordError(null);
    }
  };

  const onSelectHospital = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setCodigoError(null);

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (!consentimientoDatos) return;

    let rol: 'residente' | 'formador';
    if (codigoAcceso === 'ABEXRES2025') {
      rol = 'residente';
    } else if (codigoAcceso === 'ABEXFOR2025') {
      rol = 'formador';
    } else {
      setCodigoError('Código de acceso no válido');
      return;
    }

    await register({ nombre, apellidos, email, password, rol, hospital });
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
          sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <img
              src="/logo.png"
              alt="Abex Excelencia Robótica"
              style={{ maxWidth: '200px', marginBottom: '16px' }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              Registro de Usuario
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Plataforma de Formación en Tecnologías del Robot da Vinci
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {codigoError && (
            <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
              {codigoError}
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
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="codigoAcceso"
              label="Código de Acceso"
              id="codigoAcceso"
              value={codigoAcceso}
              onChange={onChange}
              disabled={loading}
            />
            <FormControl fullWidth margin="normal" required disabled={loading}>
              <InputLabel id="hospital-label">Hospital</InputLabel>
              <Select
                labelId="hospital-label"
                id="hospital"
                name="hospital"
                value={hospital}
                label="Hospital"
                onChange={onSelectHospital}
              >
                {hospitales.map((h) => (
                  <MenuItem key={h._id} value={h._id}>
                    {h.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              {loading ? <CircularProgress size={24} /> : 'Registrarse'}
            </Button>
          </Box>
        </Paper>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Abex Excelencia Robótica
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Powered by FARGV
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
