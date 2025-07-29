import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminInformes from '../AdminInformes';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../api');

import api from '../../../api';

const mockedGet = (api as any).get as jest.Mock;

beforeEach(() => {
  mockedGet.mockResolvedValue({
    data: {
      data: [
        {
          _id: 'u1',
          nombre: 'Test',
          apellidos: 'User',
          email: 'test@example.com',
          tipo: 'Programa Residentes',
          hospital: { nombre: 'H1' }
        }
      ]
    }
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

it('carga y muestra los informes', async () => {
  render(
    <MemoryRouter>
      <AdminInformes />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Test User/)).toBeInTheDocument();
});
