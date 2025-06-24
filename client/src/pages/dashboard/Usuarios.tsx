import React from 'react';
import { useAuth } from '../../context/AuthContext';
import FormadorUsuarios from './FormadorUsuarios';
import AdminUsuarios from './AdminUsuarios';

const Usuarios: React.FC = () => {
  const { user } = useAuth();

  if (user?.rol === 'administrador') {
    return <AdminUsuarios />;
  }

  // FormadorRoute garantiza que solo formadores o administradores lleguen aquí
  return <FormadorUsuarios />;
};

export default Usuarios;