import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminUsuarios from './AdminUsuarios';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

jest.mock('../../api');
jest.mock('../../context/AuthContext');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGet = (api as any).get as jest.Mock;

beforeEach(() => {
  mockedUseAuth.mockReturnValue({ user: { rol: 'administrador' } } as any);
  i18n.changeLanguage('es');
});

afterEach(() => {
  jest.clearAllMocks();
});

test('muestra boton Crear progreso cuando no existe progreso', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: false }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  expect(await screen.findByText('Crear progreso')).toBeInTheDocument();
});

test('no muestra boton cuando tiene progreso', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: true }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  await screen.findByText('Res A');
  expect(screen.queryByText('Crear progreso')).not.toBeInTheDocument();
});

test('muestra boton Cambiar contraseña para administradores', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: false }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  expect(await screen.findByText('Cambiar contraseña')).toBeInTheDocument();
});

test('muestra botones Editar y Eliminar', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: false }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  expect(await screen.findByText('Editar')).toBeInTheDocument();
  expect(screen.getByText('Eliminar')).toBeInTheDocument();
});
