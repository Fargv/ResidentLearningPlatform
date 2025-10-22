import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Notificaciones from './Notificaciones';

jest.mock('../../api', () => ({
  getNotificaciones: jest.fn(),
  marcarNotificacionLeida: jest.fn(),
  sendResetPasswordEmail: jest.fn(),
  clearResetNotifications: jest.fn(),
  eliminarNotificacion: jest.fn(),
}));

let mockedNavigate: jest.Mock;
jest.mock('react-router-dom', () => ({
  useNavigate: () => {
    mockedNavigate = jest.fn();
    return mockedNavigate;
  },
}));

import { getNotificaciones, marcarNotificacionLeida, eliminarNotificacion } from '../../api';

const mockedGet = getNotificaciones as jest.Mock;
const mockedMarcar = marcarNotificacionLeida as jest.Mock;
const mockedEliminar = eliminarNotificacion as jest.Mock;

beforeEach(() => {
  i18n.changeLanguage('es');
  mockedGet.mockResolvedValue({
    data: {
      data: [
        {
          _id: '1',
          mensaje: 'Test1',
          fechaCreacion: new Date().toISOString(),
          leida: false,
          enlace: '/foo',
        },
        {
          _id: '2',
          mensaje: 'Test2',
          fechaCreacion: new Date().toISOString(),
          leida: false,
        }
      ],
    },
  });
  mockedMarcar.mockResolvedValue({});
  mockedEliminar.mockResolvedValue({});
});

afterEach(() => {
  jest.clearAllMocks();
});

test('marca la notificación como leída al abrirla', async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <Notificaciones />
    </I18nextProvider>
  );

  const rowText = await screen.findByText('Test1');
  fireEvent.click(rowText.closest('tr')!);

  await waitFor(() => {
    expect(mockedMarcar).toHaveBeenCalledWith('1', true);
    expect(mockedNavigate).toHaveBeenCalledWith('/foo');
  });
  await waitFor(() => expect(screen.queryByText('Test1')).not.toBeInTheDocument());
});

test('marca múltiples notificaciones con la barra de herramientas', async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <Notificaciones />
    </I18nextProvider>
  );

  const row1 = await screen.findByText('Test1');
  const row2 = await screen.findByText('Test2');
  fireEvent.click(within(row1.closest('tr')!).getByRole('checkbox'));
  fireEvent.click(within(row2.closest('tr')!).getByRole('checkbox'));

  fireEvent.click(screen.getByLabelText('mark-read'));

  await waitFor(() => {
    expect(mockedMarcar).toHaveBeenCalledWith('1', true);
    expect(mockedMarcar).toHaveBeenCalledWith('2', true);
  });
});

test('elimina múltiples notificaciones con la barra de herramientas', async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <Notificaciones />
    </I18nextProvider>
  );

  const row1 = await screen.findByText('Test1');
  const row2 = await screen.findByText('Test2');
  fireEvent.click(within(row1.closest('tr')!).getByRole('checkbox'));
  fireEvent.click(within(row2.closest('tr')!).getByRole('checkbox'));

  fireEvent.click(screen.getByLabelText('delete'));

  await waitFor(() => {
    expect(mockedEliminar).toHaveBeenCalledWith('1');
    expect(mockedEliminar).toHaveBeenCalledWith('2');
  });
});

test('muestra nombre y email en notificaciones de reseteo de contraseña', async () => {
  const mensaje = 'User (user@test.com) ha solicitado un reseteo de contraseña.';
  mockedGet.mockResolvedValueOnce({
    data: {
      data: [
        {
          _id: '1',
          mensaje,
          fechaCreacion: new Date().toISOString(),
          leida: false,
          tipo: 'passwordReset'
        }
      ]
    }
  });

  render(
    <I18nextProvider i18n={i18n}>
      <Notificaciones />
    </I18nextProvider>
  );

  expect(await screen.findByText(mensaje)).toBeInTheDocument();
});
