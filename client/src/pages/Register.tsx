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
import api from '../api';

interface Hospital {
  _id: string;
  nombre: string;
}

interface Sociedad {
  _id: string;
  titulo: string;
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
    hospital: '',
    especialidad: '',
    sociedad: '',
    tipo: '',
    rol: '',
    zona: ''
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [hospitales, setHospitales] = useState<Hospital[]>([]);
  const [sociedades, setSociedades] = useState<Sociedad[]>([]);
  const [showForm, setShowForm] = useState(false);

  const { nombre, apellidos, email, password, confirmPassword, codigoAcceso, consentimientoDatos, hospital, especialidad, sociedad, tipo, rol, zona } = formData;
  const { register, error, loading, clearError } = useAuth();

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const res = await fetch(`${apiUrl}/hospitals`);
        const data = await res.json();
        setHospitales(data.data);
      } catch (error) {
        console.error('Error cargando hospitales:', error);
      }
    };

    const fetchSociedades = async () => {
      try {
        const res = await api.get('/sociedades/public');
        setSociedades(res.data);
      } catch (error) {
        console.error('Error cargando sociedades:', error);
      }
    };

    fetchHospitales();
    fetchSociedades();
  }, []);

  useEffect(() => {
    const validateCode = async () => {
      if (!codigoAcceso) {
        setShowForm(false);
        return;
      }

      try {
        const res = await api.get(`/auth/codigos/${codigoAcceso}`);
        const { rol: rolResp, tipo: tipoResp } = res.data.data;
        setFormData((prev) => ({ ...prev, rol: rolResp, tipo: tipoResp }));
        setCodigoError(null);
        setShowForm(true);
      } catch (err) {
        setShowForm(false);
        setFormData((prev) => ({ ...prev, rol: '', tipo: '' }));
        setCodigoError('Código de acceso no válido');
      }
    };

    validateCode();
  }, [codigoAcceso]);

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

  const onSelectHospital = async (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

     if (value) {
      try {
        const res = await api.get(`/hospitals/${value}`);
        setFormData((prev) => ({ ...prev, zona: res.data.data.zona || '' }));
      } catch (error) {
        console.error('Error cargando zona del hospital:', error);
      }
    } else {
      setFormData((prev) => ({ ...prev, zona: '' }));
    }
  };

  const onSelectEspecialidad = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      especialidad: value
    }));
  };

  const onSelectSociedad = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      sociedad: value
    }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCodigoError(null);

    if (!nombre || !apellidos || !email || !password || !codigoAcceso) {
      return setCodigoError('Por favor, completa todos los campos obligatorios.');
    }

    if (rol === 'residente' && (!hospital || !especialidad)) {
      return setCodigoError('Hospital y especialidad requeridos');
    }

    if ((rol === 'formador' || rol === 'coordinador') && !hospital) {
      return setCodigoError('Hospital requerido');
    }

    if (tipo === 'Programa Sociedades' && !sociedad) {
      return setCodigoError('Sociedad requerida');
    }

    if (password !== confirmPassword) {
      return setPasswordError('Las contraseñas no coinciden');
    }

    if (!consentimientoDatos) return;

    try {
      await register({
        nombre,
        apellidos,
        email,
        password,
        rol,
        hospital,
        codigoAcceso,
        consentimientoDatos,
        especialidad,
        tipo,
        sociedad,
        zona
      });
     } catch (err: any) {
      setCodigoError(err.response?.data?.error || 'Código de acceso no válido');
    }
  };

  const hospitalRequired =
    rol === 'residente' || rol === 'formador' || rol === 'coordinador';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <img src="/logo.png" alt="Abex Excelencia Robótica" style={{ maxWidth: '200px', marginBottom: '16px' }} />
            <Typography variant="h4" component="h1" gutterBottom>Registro</Typography>
          </Box>

          <form onSubmit={onSubmit} style={{ width: '100%' }}>
            <TextField margin="normal" fullWidth name="codigoAcceso" label="Código de Acceso" value={codigoAcceso} onChange={onChange} disabled={loading} required />
            {codigoError && <Alert severity="error">{codigoError}</Alert>}

            {showForm && (
              <>
                <TextField margin="normal" fullWidth label="Nombre" name="nombre" value={nombre} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label="Apellidos" name="apellidos" value={apellidos} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label="Email" name="email" type="email" value={email} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label="Contraseña" name="password" type="password" value={password} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label="Confirmar Contraseña" name="confirmPassword" type="password" value={confirmPassword} onChange={onChange} disabled={loading} required />
                {passwordError && <Alert severity="warning">{passwordError}</Alert>}

                {(rol === 'residente' || rol === 'formador' || rol === 'coordinador' || rol === 'alumno' || rol === 'instructor') && (
                  <FormControl fullWidth margin="normal" required={hospitalRequired} disabled={loading}>
                    <InputLabel id="hospital-label">Hospital</InputLabel>
                    <Select labelId="hospital-label" id="hospital" name="hospital" value={hospital} label="Hospital" onChange={onSelectHospital}>
                      {hospitales.map((h) => (
                        <MenuItem key={h._id} value={h._id}>{h.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {rol === 'coordinador' && (
                  <TextField margin="normal" fullWidth label="Zona" name="zona" value={zona} disabled />
                )}

                {rol === 'residente' && (
                  <FormControl fullWidth margin="normal" required disabled={loading}>
                    <InputLabel id="especialidad-label">Especialidad</InputLabel>
                    <Select labelId="especialidad-label" id="especialidad" name="especialidad" value={especialidad} label="Especialidad" onChange={onSelectEspecialidad}>
                      <MenuItem value="URO">Urología (URO)</MenuItem>
                      <MenuItem value="GEN">Cirugía General (GEN)</MenuItem>
                      <MenuItem value="GYN">Ginecología (GYN)</MenuItem>
                      <MenuItem value="THOR">Torácica (THOR)</MenuItem>
                      <MenuItem value="ORL">Otorrino (ORL)</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {tipo === 'Programa Sociedades' && sociedades.length > 0 && (
                  <FormControl fullWidth margin="normal" required disabled={loading}>
                    <InputLabel id="sociedad-label">Sociedad</InputLabel>
                    <Select labelId="sociedad-label" id="sociedad" name="sociedad" value={sociedad} label="Sociedad" onChange={onSelectSociedad}>
                      <MenuItem value="">
                        <em>Ninguna</em>
                      </MenuItem>
                      {sociedades.map((s) => (
                        <MenuItem key={s._id} value={s._id}>{s.titulo}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

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
                      Acepto el tratamiento de mis datos personales según la{' '}
                      <Link href="/politica-privacidad" target="_blank">Política de Privacidad</Link> y cumplo con la LOPD.
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />

                <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading || !consentimientoDatos}>
                  {loading ? <CircularProgress size={24} /> : 'Registrarse'}
                </Button>
              </>
            )}
          </form>
        </Paper>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} Abex Excelencia Robótica</Typography>
          <Typography variant="body2" color="text.secondary">Powered by FARGV</Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
