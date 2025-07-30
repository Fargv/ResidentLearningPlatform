import React from 'react';
import { Box, Typography, Card, CardActionArea, CardContent } from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminConfiguracion: React.FC = () => {
  const navigate = useNavigate();
  const env = process.env.REACT_APP_ENV || (window as any).REACT_APP_ENV;
  const isDev = env === 'dev';

  const actions = [
    { label: 'Hospitales', path: '/dashboard/hospitals', icon: <HospitalIcon sx={{ fontSize: 40 }} /> },
    { label: 'Sociedades', path: '/dashboard/sociedades', icon: <GroupIcon sx={{ fontSize: 40 }} /> },
    { label: 'Programa Residentes', path: '/dashboard/fases', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
    { label: 'Programa Sociedades', path: '/dashboard/fases-soc', icon: <AssignmentIcon sx={{ fontSize: 40 }} /> },
    { label: 'Access Codes', path: '/dashboard/access-codes', icon: <SettingsIcon sx={{ fontSize: 40 }} /> },
    ...(isDev ? [{ label: 'Debug', path: '/dashboard/debug', icon: <BugReportIcon sx={{ fontSize: 40 }} /> }] : [])
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configuración
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {actions.map(action => (
          <Box key={action.label} sx={{ width: { xs: '100%', sm: '48%', md: '31%', lg: '23%' } }}>
            <Card>
              <CardActionArea onClick={() => navigate(action.path)}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  {action.icon}
                  <Typography variant="subtitle1" sx={{ mt: 1, textAlign: 'center' }}>
                    {action.label}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AdminConfiguracion;
