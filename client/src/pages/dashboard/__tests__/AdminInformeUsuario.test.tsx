import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminInformeUsuario from '../AdminInformeUsuario';
import api from '../../../api';

jest.mock('../../../api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'u1' })
}));

const mockedGet = (api as any).get as jest.Mock;

beforeEach(() => {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/users/u1') {
      return Promise.resolve({ data: { data: { nombre: 'Test', apellidos: 'User' } } });
    }
    return Promise.resolve({ data: { data: [ { _id: 'p1', fase: { nombre: 'F1' }, actividades: [{ estado: 'validado' }], estadoGeneral: 'validado' } ] } });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

it('muestra el progreso del usuario', async () => {
  render(<AdminInformeUsuario />);
  expect(await screen.findByText(/Progreso de Test User/)).toBeInTheDocument();
});
