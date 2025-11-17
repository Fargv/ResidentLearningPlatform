import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface PhaseProgressChartProps {
  phaseName: string;
  pendiente: number;
  completado: number;
  rechazado: number;
  validado: number;
}

const PhaseProgressChart: React.FC<PhaseProgressChartProps> = ({
  phaseName,
  pendiente,
  completado,
  rechazado,
  validado,
}) => {
  const theme = useTheme();
  const colors = [
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    theme.palette.success.main,
  ];

  const data = [
    { name: 'Pendiente', value: pendiente },
    { name: 'Completado', value: completado },
    { name: 'Rechazado', value: rechazado },
    { name: 'Validado', value: validado },
  ];

  return (
    <Box textAlign="center">
      <Typography variant="subtitle1" gutterBottom>{phaseName}</Typography>
      <PieChart width={250} height={250}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </Box>
  );
};

export default PhaseProgressChart;
