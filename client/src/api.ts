// src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export const getNotificaciones = () => api.get('/notificaciones');
export const getNotificacionesNoLeidas = () => api.get('/notificaciones/no-leidas');
export const marcarNotificacionLeida = (id: string) => api.put(`/notificaciones/${id}/leer`);
export const eliminarNotificacion = (id: string) => api.delete(`/notificaciones/${id}`);
export const updateProfile = (data: { nombre: string; apellidos: string; email: string }) =>
  api.put('/auth/updatedetails', data);
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.put('/auth/updatepassword', data);

// Admin user management
export const createUser = (data: Record<string, any>) => api.post('/users', data);
export const updateUserPassword = (id: string, newPassword: string) =>
  api.put(`/users/${id}/password`, { password: newPassword });

export const getTutors = (hospital: string, especialidad: string) =>
  api.get('/users/tutores', { params: { hospital, especialidad } });

export const getUserResetToken = (id: string) =>
  api.post(`/users/${id}/reset-password`);


