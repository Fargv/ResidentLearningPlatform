import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminProgresoDetalle from '../AdminProgresoDetalle';

jest.mock('../../../api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ userId: '1' })
}));

import api from '../../../api';

const mockedGet = (api as any).get as jest.Mock;

it('muestra las fases del usuario', async () => {
  mockedGet.mockResolvedValue({
    data: { data: [{ _id: 'p1', fase: { numero: 1, nombre: 'F1' }, estadoGeneral: 'en progreso', actividades: [] }] }
  });
  render(<AdminProgresoDetalle />);
  expect(await screen.findByText(/Fase 1/)).toBeInTheDocument();
});
