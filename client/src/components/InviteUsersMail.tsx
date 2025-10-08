import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';
import type { SelectChangeEvent } from '@mui/material/Select';
import api from '../api';
import Role from '../types/roles';

type ProgramType = 'Programa Residentes' | 'Programa Sociedades';

interface BasicEntity {
  _id: string;
  nombre: string;
}

interface InviteUsersMailProps {
  open: boolean;
  onClose: () => void;
  hospitals: BasicEntity[];
  societies: BasicEntity[];
}

interface AccessCode {
  codigo: string;
  rol: Role;
  tipo: ProgramType;
}

const roles = Object.values(Role) as Role[];
const isRole = (v: string): v is Role => (roles as string[]).includes(v);

const legacyRoleMap: Record<string, Role> = {
  formador: Role.TUTOR,
  coordinador: Role.CSM,
  instructor: Role.PROFESOR,
  alumno: Role.PARTICIPANTE,
};

const zoneOptions = [
  'NORDESTE',
  'NORTE',
  'CENTRO',
  'ANDALUCÍA',
  'PORTUGAL',
  'LEVANTE',
  'CANARIAS',
];

const normalizeRoleValue = (value: string): Role | undefined => {
  if (isRole(value)) {
    return value;
  }

  return legacyRoleMap[value];
};

const InviteUsersMail: React.FC<InviteUsersMailProps> = ({
  open,
  onClose,
  hospitals,
  societies,
}) => {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [role, setRole] = useState<Role | ''>('');
  const [selectedCode, setSelectedCode] = useState<AccessCode | null>(null);
  const [emails, setEmails] = useState<string[]>(['']);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedSociety, setSelectedSociety] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [feedback, setFeedback] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!role) {
      setSelectedCode(null);
      setFeedback(null);
      return;
    }

    const found =
      accessCodes.find((c) => normalizeRoleValue(c.rol) === role) || null;

    setSelectedCode(found);
    setEmails(['']);

    if (![Role.RESIDENTE, Role.TUTOR].includes(role)) {
      setSelectedHospital('');
    }

    if (![Role.PARTICIPANTE, Role.PROFESOR].includes(role)) {
      setSelectedSociety('');
    }

    if (role !== Role.CSM) {
      setSelectedZone('');
    }

    if (!found) {
      setFeedback({
        type: 'error',
        message: 'No hay código configurado para este rol.',
      });
    } else {
      setFeedback(null);
    }
  }, [role, accessCodes]);

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const handleAddEmail = () => {
    if (submitting) return;
    setEmails((prev) => [...prev, '']);
  };

  const resetForm = () => {
    setRole('');
    setSelectedCode(null);
    setEmails(['']);
    setSelectedHospital('');
    setSelectedSociety('');
    setSelectedZone('');
    setFeedback(null);
  };

  const closeDialog = () => {
    resetForm();
    onClose();
  };

  const handleDialogClose: DialogProps['onClose'] = () => {
    if (submitting) return;
    closeDialog();
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    const trimmed = emails.map((email) => email.trim());
    const filled = trimmed.filter((email) => email.length > 0);
    const validEmails = filled.filter(isValidEmail);
    const requiresHospital =
      role === Role.RESIDENTE || role === Role.TUTOR;
    const requiresSociety =
      role === Role.PARTICIPANTE || role === Role.PROFESOR;
    const requiresZone = role === Role.CSM;

    if (!role) {
      setFeedback({
        type: 'error',
        message: 'Selecciona un rol válido.',
      });
      return;
    }

    if (!selectedCode) {
      setFeedback({
        type: 'error',
        message: 'No hay código configurado para este rol.',
      });
      return;
    }

    if (filled.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Introduce al menos un correo electrónico.',
      });
      return;
    }

    if (validEmails.length !== filled.length) {
      setFeedback({
        type: 'error',
        message: 'Revisa que todos los correos electrónicos sean válidos.',
      });
      return;
    }

    if (requiresHospital && !selectedHospital) {
      setFeedback({
        type: 'error',
        message: 'Selecciona un hospital para este rol.',
      });
      return;
    }

    if (requiresSociety && !selectedSociety) {
      setFeedback({
        type: 'error',
        message: 'Selecciona una sociedad para este rol.',
      });
      return;
    }

    if (requiresZone && !selectedZone) {
      setFeedback({
        type: 'error',
        message: 'Selecciona una zona para este rol.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const payloadBase: Record<string, string> = {
        rol: role,
        tipo: selectedCode.tipo,
      };

      if (requiresHospital) {
        payloadBase.hospital = selectedHospital;
      }

      if (requiresSociety) {
        payloadBase.sociedad = selectedSociety;
      }

      if (requiresZone) {
        payloadBase.zona = selectedZone;
      }

      const results = await Promise.allSettled(
        validEmails.map((email) =>
          api.post('/users/invite', {
            ...payloadBase,
            email,
          }),
        ),
      );

      const failures = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      if (failures.length > 0) {
        const firstError = failures[0].reason as any;
        const errorMessage =
          firstError?.response?.data?.error ||
          firstError?.message ||
          'No se pudieron enviar algunas invitaciones.';
        const successCount = results.length - failures.length;
        const message =
          successCount > 0
            ? `Se enviaron ${successCount} invitaciones, pero otras fallaron: ${errorMessage}`
            : errorMessage;

        setFeedback({ type: 'error', message });
        return;
      }

      setFeedback({
        type: 'success',
        message:
          validEmails.length === 1
            ? 'Invitación enviada correctamente.'
            : 'Invitaciones enviadas correctamente.',
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
      closeDialog();
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'No se pudo enviar la invitación.';
      setFeedback({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const requiresHospitalSelection =
    role === Role.RESIDENTE || role === Role.TUTOR;
  const requiresSocietySelection =
    role === Role.PARTICIPANTE || role === Role.PROFESOR;
  const requiresZoneSelection = role === Role.CSM;

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>Invitar Usuarios</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Todos los usuarios deben tener el mismo rol. Al cambiar el rol se
          reinicia la lista de correos.
        </DialogContentText>
        <FormControl
          fullWidth
          margin="dense"
          sx={{ mt: 2 }}
          disabled={submitting}
        >
          <InputLabel id="invite-users-role-label">Rol</InputLabel>
          <Select
            labelId="invite-users-role-label"
            label="Rol"
            value={role}
            onChange={(event: SelectChangeEvent<string>) => {
              const v = event.target.value;
              setRole(isRole(v) ? v : '');
            }}
          >
            <MenuItem value="" disabled>
              Selecciona un rol
            </MenuItem>
            {roles.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {role && (
          <Box sx={{ mt: 2 }}>
            <Typography>
              Código de acceso: {selectedCode?.codigo || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Programa: {selectedCode?.tipo || '—'}
            </Typography>
          </Box>
        )}
        {requiresHospitalSelection && (
          <FormControl
            fullWidth
            margin="dense"
            sx={{ mt: 2 }}
            disabled={submitting || hospitals.length === 0}
          >
            <InputLabel id="invite-users-hospital-label">Hospital</InputLabel>
            <Select
              labelId="invite-users-hospital-label"
              label="Hospital"
              value={selectedHospital}
              onChange={(event: SelectChangeEvent<string>) =>
                setSelectedHospital(event.target.value)
              }
            >
              <MenuItem value="" disabled>
                Selecciona un hospital
              </MenuItem>
              {hospitals.map((hospital) => (
                <MenuItem key={hospital._id} value={hospital._id}>
                  {hospital.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {requiresZoneSelection && (
          <FormControl
            fullWidth
            margin="dense"
            sx={{ mt: 2 }}
            disabled={submitting}
          >
            <InputLabel id="invite-users-zone-label">Zona</InputLabel>
            <Select
              labelId="invite-users-zone-label"
              label="Zona"
              value={selectedZone}
              onChange={(event: SelectChangeEvent<string>) =>
                setSelectedZone(event.target.value)
              }
            >
              <MenuItem value="" disabled>
                Selecciona una zona
              </MenuItem>
              {zoneOptions.map((zone) => (
                <MenuItem key={zone} value={zone}>
                  {zone}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {requiresSocietySelection && (
          <FormControl
            fullWidth
            margin="dense"
            sx={{ mt: 2 }}
            disabled={submitting || societies.length === 0}
          >
            <InputLabel id="invite-users-society-label">Sociedad</InputLabel>
            <Select
              labelId="invite-users-society-label"
              label="Sociedad"
              value={selectedSociety}
              onChange={(event: SelectChangeEvent<string>) =>
                setSelectedSociety(event.target.value)
              }
            >
              <MenuItem value="" disabled>
                Selecciona una sociedad
              </MenuItem>
              {societies.map((society) => (
                <MenuItem key={society._id} value={society._id}>
                  {society.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
              disabled={submitting}
              sx={{ mb: 2 }}
            />
          ))}
          <Button
            variant="outlined"
            onClick={handleAddEmail}
            disabled={submitting}
          >
            Añadir
          </Button>
        </Box>
        {feedback && (
          <Alert severity={feedback.type} sx={{ mt: 2 }}>
            {feedback.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={
            submitting ||
            !role ||
            emails.every((email) => !email.trim()) ||
            (requiresHospitalSelection && !selectedHospital) ||
            (requiresSocietySelection && !selectedSociety) ||
            (requiresZoneSelection && !selectedZone)
          }
        >
          {submitting ? 'Enviando…' : 'Enviar invitación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteUsersMail;
