// src/pages/dashboard/Perfil.js

import React, { useEffect, useState } from 'react';

const Perfil = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Aquí podrías hacer una llamada API para obtener la información del perfil del usuario
    // Por ahora solo simula datos de ejemplo.
    setUserInfo({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      role: 'Admin'
    });
  }, []);

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Perfil de {userInfo.name}</h1>
      <p>Email: {userInfo.email}</p>
      <p>Rol: {userInfo.role}</p>
    </div>
  );
};

export default Perfil;
