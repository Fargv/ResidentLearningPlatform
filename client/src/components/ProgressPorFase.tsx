import React from 'react';
import { Paper, Box, Typography, LinearProgress } from '@mui/material';

export interface Fase {
  nombre: string;
  porcentaje: number; // entre 0 y 100
  bloqueada?: boolean;
}

export interface Props {
  fases: Fase[];
  onFaseClick?: (fase: Fase, index: number) => void;
}

const ProgressPorFase: React.FC<Props> = ({ fases, onFaseClick }) => {
  const visibles = fases.filter((f) => !f.bloqueada);

  return (
    <Box display="flex" flexWrap="wrap" gap={2} justifyContent="flex-start">
      {visibles.map((fase, idx) => (
        <Box
          key={fase.nombre ?? idx}
          sx={{ flex: '1 1 220px', minWidth: 200 }}
          onClick={() => onFaseClick?.(fase, idx)}
        >
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box
              sx={{
                backgroundColor: '#1E5B94',
                color: 'white',
                textAlign: 'center',
                borderRadius: 1,
                mb: 2,
                p: 1,
              }}
            >
              <Typography variant="subtitle1">{fase.nombre}</Typography>
            </Box>
            <Box>
              <LinearProgress
                variant="determinate"
                value={fase.porcentaje}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#c6efce',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#1E5B94',
                  },
                }}
              />
              <Typography variant="body2" align="right" sx={{ mt: 1 }}>
                {fase.porcentaje}%
              </Typography>
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default ProgressPorFase;
