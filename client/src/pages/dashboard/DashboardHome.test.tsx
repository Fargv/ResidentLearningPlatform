import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardHome from './DashboardHome';

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
      fechaConvocatoria: '2025-01-01'
    }
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('clicking milestone opens dialog', async () => {
  render(<DashboardHome />);
  const item = await screen.findByText('Convocatoria');
  await userEvent.click(item);
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
});



