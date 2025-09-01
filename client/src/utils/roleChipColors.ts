import { SxProps, Theme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

const roleChipColors: Record<string, SxProps<Theme>> = {
  administrador: { bgcolor: 'error.main', color: 'white' },
  csm: { bgcolor: 'success.main', color: 'white' },
  tutor: { bgcolor: 'primary.main', color: 'white' },
  profesor: { bgcolor: 'primary.main', color: 'white' },
  participante: { bgcolor: grey[500], color: 'white' },
  residente: { bgcolor: grey[500], color: 'white' },
};

export const getRoleChipSx = (role?: string): SxProps<Theme> =>
  roleChipColors[role ?? ''] || { bgcolor: grey[500], color: 'white' };

export default roleChipColors;
