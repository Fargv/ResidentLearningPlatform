import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminProgresoUsuarios from '../AdminProgresoUsuarios';

jest.mock('../../../api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

import api from '../../../api';

const mockedGet = (api as any).get as jest.Mock;

it('muestra usuarios en la tabla', async () => {
  mockedGet.mockResolvedValue({
    data: { data: [{ _id: '1', nombre: 'A', apellidos: 'B', email: 'a@b.com', rol: 'residente', hospital: { nombre: 'H1' } }] }
  });
  render(
    <MemoryRouter>
      <AdminProgresoUsuarios />
    </MemoryRouter>
  );
  expect(await screen.findByText('A B')).toBeInTheDocument();
  expect(screen.getByText('a@b.com')).toBeInTheDocument();
});
