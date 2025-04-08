// src/pages/dashboard/Notificaciones.js

import React, { useState, useEffect } from 'react';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);

  // Simula obtener las notificaciones de una API o base de datos
  useEffect(() => {
    // Aquí puedes poner una llamada a la API o lógica para obtener las notificaciones
    setNotificaciones([
      { id: 1, message: 'Notificación 1', read: false },
      { id: 2, message: 'Notificación 2', read: false },
    ]);
  }, []);

  const marcarComoLeida = (id) => {
    setNotificaciones(notificaciones.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  return (
    <div>
      <h1>Notificaciones</h1>
      <ul>
        {notificaciones.map((notif) => (
          <li key={notif.id}>
            <span style={{ textDecoration: notif.read ? 'line-through' : 'none' }}>
              {notif.message}
            </span>
            {!notif.read && (
              <button onClick={() => marcarComoLeida(notif.id)}>
                Marcar como leída
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notificaciones;
