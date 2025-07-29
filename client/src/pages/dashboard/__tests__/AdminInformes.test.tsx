import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminInformes from '../AdminInformes';

jest.mock('../../../api');

import api from '../../../api';

const mockedGet = (api as any).get as jest.Mock;

beforeEach(() => {
  mockedGet.mockResolvedValue({
    data: {
      data: [
        {
          _id: 'p1',
          residente: { nombre: 'Test', apellidos: 'User', hospital: { nombre: 'H1' } },
          fase: { nombre: 'F1' },
          estadoGeneral: 'en progreso',
          actividades: [{ estado: 'pendiente' }]
        }
      ]
    }
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

it('carga y muestra los informes', async () => {
  render(<AdminInformes />);
  expect(await screen.findByText(/Test User/)).toBeInTheDocument();
});
