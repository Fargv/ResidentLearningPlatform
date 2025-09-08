import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Notificaciones from './Notificaciones';

jest.mock('../../api', () => ({
  getNotificaciones: jest.fn(),
  marcarNotificacionLeida: jest.fn(),
  getUserResetToken: jest.fn(),
  clearResetNotifications: jest.fn(),
}));

let mockedNavigate: jest.Mock;
jest.mock('react-router-dom', () => ({
  useNavigate: () => {
    mockedNavigate = jest.fn();
    return mockedNavigate;
  },
}));

import { getNotificaciones, marcarNotificacionLeida } from '../../api';

const mockedGet = getNotificaciones as jest.Mock;
const mockedMarcar = marcarNotificacionLeida as jest.Mock;

beforeEach(() => {
  i18n.changeLanguage('es');
  mockedGet.mockResolvedValue({
    data: {
      data: [
        {
          _id: '1',
          mensaje: 'Test',
          fechaCreacion: new Date().toISOString(),
          leida: false,
          enlace: '/foo',
        },
      ],
    },
  });
  mockedMarcar.mockResolvedValue({});
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

  const rowText = await screen.findByText('Test');
  fireEvent.click(rowText.closest('tr')!);

  await waitFor(() => {
    expect(mockedMarcar).toHaveBeenCalledWith('1');
    expect(mockedNavigate).toHaveBeenCalledWith('/foo');
  });
  await waitFor(() => expect(screen.queryByText('Test')).not.toBeInTheDocument());
});
