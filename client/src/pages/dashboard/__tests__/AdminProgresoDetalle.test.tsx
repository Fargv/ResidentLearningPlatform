import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminProgresoDetalle from '../AdminProgresoDetalle';

jest.mock('../../../api');
jest.mock('../../../context/AuthContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ userId: '1' })
}));

import api from '../../../api';
import { useAuth } from '../../../context/AuthContext';

const mockedGet = (api as any).get as jest.Mock;
const mockedPost = (api as any).post as jest.Mock;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

beforeEach(() => {
  mockedUseAuth.mockReturnValue({ user: { rol: 'administrador' } } as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

it('muestra las fases del usuario', async () => {
  mockedGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'p1',
            fase: { numero: 1, nombre: 'F1' },
            estadoGeneral: 'en progreso',
            actividades: []
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: { data: { nombre: 'A', apellidos: 'B' } }
    });

  render(<AdminProgresoDetalle />);

  expect(await screen.findByText('Progreso de A B')).toBeInTheDocument();
  expect(await screen.findByText(/Fase 1/)).toBeInTheDocument();
});

it('muestra controles para administradores', async () => {
  mockedGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'p1',
            fase: { numero: 1, nombre: 'F1' },
            estadoGeneral: 'en progreso',
            actividades: [{ nombre: 'A1', estado: 'pendiente' }]
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: { data: { nombre: 'A', apellidos: 'B' } }
    });

  render(<AdminProgresoDetalle />);

  await screen.findByText(/Fase 1/);
  expect(screen.getByLabelText('Estado fase')).toBeInTheDocument();
  expect(screen.getByLabelText('Estado actividad')).toBeInTheDocument();
});

it('oculta controles para usuarios no administradores', async () => {
  mockedUseAuth.mockReturnValue({ user: { rol: 'residente' } } as any);
  mockedGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'p1',
            fase: { numero: 1, nombre: 'F1' },
            estadoGeneral: 'en progreso',
            actividades: []
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: { data: { nombre: 'A', apellidos: 'B' } }
    });

  render(<AdminProgresoDetalle />);

  await screen.findByText(/Fase 1/);
  expect(screen.queryByLabelText('Estado fase')).not.toBeInTheDocument();
});

it('muestra mensaje de error si la actualización falla', async () => {
  mockedGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'p1',
            fase: { numero: 1, nombre: 'F1' },
            estadoGeneral: 'en progreso',
            actividades: []
          }
        ]
      }
    })
    .mockResolvedValueOnce({
      data: { data: { nombre: 'A', apellidos: 'B' } }
    });

  mockedPost.mockRejectedValue({ response: { data: { error: 'No permitido' } } });

  render(<AdminProgresoDetalle />);

  await screen.findByText(/Fase 1/);

  fireEvent.change(screen.getByLabelText('Estado fase'), { target: { value: 'validado' } });

  expect(await screen.findByText('No permitido')).toBeInTheDocument();
});
