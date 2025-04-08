import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NotFound: React.FC = () => {
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
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 700, color: 'primary.main' }}>
            404
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Página no encontrada
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            La página que estás buscando no existe o ha sido movida.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard"
          >
            Volver al Dashboard
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFound;
