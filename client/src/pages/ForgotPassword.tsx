import React, { useState } from 'react';
import { Box, Container, Paper, Typography, TextField, Button, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const env = process.env.REACT_APP_ENV || (window as any).REACT_APP_ENV;
  const adminUrl =
    env === 'dev'
      ? 'http://localhost:3000/dashboard/usuarios'
      : 'https://residentlearningplatform.netlify.app/dashboard/usuarios';
  const mailtoLink =
    `mailto:fernando.acedorico@abexsl.es` +
    `?subject=${encodeURIComponent('Solicitud de reseteo de contraseña')}` +
    `&body=${encodeURIComponent(
      `El usuario ${userEmail || '[sin email]'} necesita reseteo de contraseña.\n\n` +
      `Enlace al dashboard de administración de usuarios: ${adminUrl}`
    )}`;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        py: 4,
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
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            ¿Olvidaste tu contraseña?
          </Typography>
          <Typography variant="body1" gutterBottom>
            Para resetear la contraseña póngase en contacto con el administrador del sistema.
          </Typography>
          <TextField
            margin="normal"
            fullWidth
            label="Tu email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href={mailtoLink}
            sx={{ mt: 2 }}
          >
            Enviar correo al administrador
          </Button>
          <Box sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/login" underline="hover">
              Volver al inicio de sesión
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
