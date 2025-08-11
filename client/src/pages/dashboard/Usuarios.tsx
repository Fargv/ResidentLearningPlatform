import React from 'react';
import { useAuth } from '../../context/AuthContext';
import TutorUsuarios from './TutorUsuarios';
import AdminUsuarios from './AdminUsuarios';

const Usuarios: React.FC = () => {
  const { user } = useAuth();

  if (user?.rol === 'administrador') {
    return <AdminUsuarios />;
  }

  // TutorRoute garantiza que solo tutores o administradores lleguen aquí
  return <TutorUsuarios />;
};

export default Usuarios;
