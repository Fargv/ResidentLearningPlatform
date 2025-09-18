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
import { useTranslation } from 'react-i18next';

interface Hospital {
  _id: string;
  nombre: string;
}

interface Sociedad {
  _id: string;
  titulo: string;
}

const legacyRoles: Record<string, string> = {
  formador: 'tutor',
  coordinador: 'csm',
  instructor: 'profesor',
  alumno: 'participante'
};

const Register: React.FC = () => {
  const { t } = useTranslation();
  const zonaOptions = [
    'NORDESTE',
    'NORTE',
    'CENTRO',
    'ANDALUCÍA',
    'PORTUGAL',
    'LEVANTE',
    'CANARIAS'
  ];
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
        const mappedRol = legacyRoles[rolResp] || rolResp;
        setFormData((prev) => ({
          ...prev,
          rol: mappedRol,
          tipo: tipoResp,
          ...(mappedRol === 'csm' && { hospital: '', sociedad: '' })
        }));
        setCodigoError(null);
        setShowForm(true);
      } catch (err) {
        setShowForm(false);
        setFormData((prev) => ({ ...prev, rol: '', tipo: '' }));
        setCodigoError(t('register.invalidAccessCode'));
      }
    };

    validateCode();
  }, [codigoAcceso, t]);

  const onChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) clearError();

    if ((name === 'password' || name === 'confirmPassword') && value !== formData.password) {
      setPasswordError(t('register.passwordsMismatch'));
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
    // La zona se completará en el backend usando el hospital seleccionado
    if (!value) {
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
      return setCodigoError(t('register.requiredFields'));
    }

    if ((rol === 'residente' || rol === 'tutor') && (!hospital || !especialidad)) {
      return setCodigoError(t('register.hospitalAndSpecialtyRequired'));
    }

    if (tipo === 'Programa Sociedades' && !sociedad) {
      return setCodigoError(t('register.societyRequired'));
    }
    if (password !== confirmPassword) {
      return setPasswordError(t('register.passwordsMismatch'));
    }

    if (!consentimientoDatos) return;

    try {
      const payload: any = {
        nombre,
        apellidos,
        email,
        password,
        rol,
        codigoAcceso,
        consentimientoDatos,
        tipo
      };
      if (hospital) payload.hospital = hospital;
      if (especialidad) payload.especialidad = especialidad;
      if (sociedad) payload.sociedad = sociedad;
      if (zona) payload.zona = zona;

      await register(payload);
    } catch (err: any) {
      setCodigoError(err.response?.data?.error || t('register.invalidAccessCode'));
    }
  };

  const hospitalRequired = rol === 'residente' || rol === 'tutor';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <img src="/logo.png" alt="Abex Excelencia Robótica" style={{ maxWidth: '200px', marginBottom: '16px' }} />
            <Typography variant="h4" component="h1" gutterBottom>{t('register.title')}</Typography>
          </Box>

          <form onSubmit={onSubmit} style={{ width: '100%' }}>
            <TextField margin="normal" fullWidth name="codigoAcceso" label={t('register.accessCode')} value={codigoAcceso} onChange={onChange} disabled={loading} required />
            {codigoError && <Alert severity="error">{codigoError}</Alert>}

            {showForm && (
              <>
                <TextField margin="normal" fullWidth label={t('register.name')} name="nombre" value={nombre} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label={t('register.surname')} name="apellidos" value={apellidos} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label={t('register.email')} name="email" type="email" value={email} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label={t('register.password')} name="password" type="password" value={password} onChange={onChange} disabled={loading} required />
                <TextField margin="normal" fullWidth label={t('register.confirmPassword')} name="confirmPassword" type="password" value={confirmPassword} onChange={onChange} disabled={loading} required />
                {passwordError && <Alert severity="warning">{passwordError}</Alert>}

                {(rol === 'residente' || rol === 'tutor' || rol === 'participante' || rol === 'profesor') && (
                  <FormControl fullWidth margin="normal" required={hospitalRequired} disabled={loading}>
                    <InputLabel id="hospital-label">{t('register.hospital')}</InputLabel>
                    <Select labelId="hospital-label" id="hospital" name="hospital" value={hospital} label={t('register.hospital')} onChange={onSelectHospital}>
                      {hospitales.map((h) => (
                        <MenuItem key={h._id} value={h._id}>{h.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {rol === 'csm' && (
                  <FormControl fullWidth margin="normal" required disabled={loading}>
                    <InputLabel id="zona-label">{t('register.zone')}</InputLabel>
                    <Select labelId="zona-label" id="zona" name="zona" value={zona} label={t('register.zone')} onChange={(e) => onChange(e as any)}>
                      {zonaOptions.map((z) => (
                        <MenuItem key={z} value={z}>
                          {z}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {(rol === 'residente' || rol === 'tutor') && (
                  <FormControl fullWidth margin="normal" required disabled={loading}>
                    <InputLabel id="especialidad-label">{t('register.specialty')}</InputLabel>
                    <Select labelId="especialidad-label" id="especialidad" name="especialidad" value={especialidad} label={t('register.specialty')} onChange={onSelectEspecialidad}>
                      <MenuItem value="ALL">{t('register.specialties.ALL')}</MenuItem>
                      <MenuItem value="URO">{t('register.specialties.URO')}</MenuItem>
                      <MenuItem value="GEN">{t('register.specialties.GEN')}</MenuItem>
                      <MenuItem value="GYN">{t('register.specialties.GYN')}</MenuItem>
                      <MenuItem value="THOR">{t('register.specialties.THOR')}</MenuItem>
                      <MenuItem value="ORL">{t('register.specialties.ORL')}</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {tipo === 'Programa Sociedades' && sociedades.length > 0 && (
                  <FormControl fullWidth margin="normal" required disabled={loading}>
                    <InputLabel id="sociedad-label">{t('register.society')}</InputLabel>
                    <Select labelId="sociedad-label" id="sociedad" name="sociedad" value={sociedad} label={t('register.society')} onChange={onSelectSociedad}>
                      <MenuItem value="">
                        <em>{t('register.none')}</em>
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
                      {t('register.consentPrefix')}
                      <Link href="/politica-privacidad" target="_blank">{t('register.privacyPolicy')}</Link>
                      {t('register.consentSuffix')}
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />

                <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading || !consentimientoDatos}>
                  {loading ? <CircularProgress size={24} /> : t('register.registerButton')}
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
