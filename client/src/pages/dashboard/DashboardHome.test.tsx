import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardHome from './DashboardHome';
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
  mockedUseAuth.mockReturnValue({
    user: {
      _id: 'u1',
      nombre: 'Test',
      rol: 'alumno',
      tipo: 'Programa Sociedades',
      sociedad: { _id: 's1' }
    }
  } as any);

  mockedGet.mockResolvedValue({
    data: {
      titulo: 'Soc Test',
      status: 'ACTIVO',
      fechaModulosOnline: '2025-01-01'
    }
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('clicking milestone opens dialog', async () => {
  i18n.changeLanguage('es');
  render(
    <I18nextProvider i18n={i18n}>
      <DashboardHome />
    </I18nextProvider>
  );
  const item = await screen.findByText(/Convocatoria/);
  await userEvent.click(item);
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
});

test('no progress fetch for admin resident program user', async () => {
  mockedUseAuth.mockReturnValue({
    user: {
      _id: 'admin1',
      nombre: 'Admin',
      rol: 'administrador',
      tipo: 'Programa Residentes'
    }
  } as any);

  i18n.changeLanguage('es');
  render(
    <I18nextProvider i18n={i18n}>
      <DashboardHome />
    </I18nextProvider>
  );

  expect(mockedGet).not.toHaveBeenCalledWith(
    expect.stringContaining('/progreso/residente')
  );
});
