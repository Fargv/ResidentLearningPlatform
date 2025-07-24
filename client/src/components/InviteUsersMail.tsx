import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import api from '../api';

interface InviteUsersMailProps {
  open: boolean;
  onClose: () => void;
}

interface AccessCode {
  codigo: string;
  rol: string;
}

const roles = [
  'residente',
  'formador',
  'coordinador',
  'administrador',
  'alumno',
  'instructor',
];

const InviteUsersMail: React.FC<InviteUsersMailProps> = ({ open, onClose }) => {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [role, setRole] = useState('');
  const [code, setCode] = useState('');
  const [emails, setEmails] = useState<string[]>(['']);

  useEffect(() => {
    if (open) {
      api
        .get('/access-codes')
        .then((res) => {
          const data = res.data.data || res.data;
          setAccessCodes(data);
        })
        .catch(() => {
          setAccessCodes([]);
        });
    }
  }, [open]);

  useEffect(() => {
    if (role) {
      const found = accessCodes.find((c) => c.rol === role);
      setCode(found?.codigo || '');
      setEmails(['']);
    }
  }, [role, accessCodes]);

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const handleAddEmail = () => {
    setEmails((prev) => [...prev, '']);
  };

  const handleSend = () => {
    const bcc = emails.filter((e) => e.trim()).join(',');
    if (!bcc || !role || !code) {
      return;
    }
    const env = process.env.REACT_APP_ENV || (window as any).REACT_APP_ENV;
    const registerUrl =
      env === 'dev'
        ? 'https://residentlearningplatform.netlify.app/register'
        : 'https://academicprogramdavinci.netlify.app/register';
    const body = `Te has sido invitado como ${role} en la plataforma.\n\nCódigo de acceso: ${code}\nRegistro: ${registerUrl}`;
    const mailtoLink =
      `mailto:?bcc=${encodeURIComponent(bcc)}` +
      `&subject=${encodeURIComponent('Invitación plataforma')}` +
      `&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Invitar Usuarios</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Todos los usuarios deben tener el mismo rol. Al cambiar el rol se
          reinicia la lista de correos.
        </DialogContentText>
        <TextField
          select
          margin="dense"
          label="Rol"
          fullWidth
          SelectProps={{ native: true }}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          sx={{ mt: 2 }}
        >
          <option value="" disabled>
            Selecciona un rol
          </option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </TextField>
        {role && (
          <Typography sx={{ mt: 2 }}>Código de acceso: {code || '—'}</Typography>
        )}
        <Box sx={{ mt: 2 }}>
          {emails.map((email, idx) => (
            <TextField
              key={idx}
              label={`Email ${idx + 1}`}
              type="email"
              fullWidth
              value={email}
              onChange={(e) => handleEmailChange(idx, e.target.value)}
              sx={{ mb: 2 }}
            />
          ))}
          <Button variant="outlined" onClick={handleAddEmail}>
            Añadir
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSend} disabled={!role || !code}>
          Enviar invitación
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteUsersMail;
