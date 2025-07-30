import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminInformes from '../AdminInformes';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();

jest.mock('../../../api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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

it('muestra boton y la fila no es clickeable', async () => {
  render(
    <MemoryRouter>
      <AdminInformes />
    </MemoryRouter>
  );

  const row = await screen.findByText(/Test User/);
  const tr = row.closest('tr') as HTMLElement;
  expect(tr).not.toHaveStyle('cursor: pointer');

  fireEvent.click(tr);
  expect(mockNavigate).not.toHaveBeenCalled();

  const btn = screen.getByRole('button', { name: /Ver Progreso/i });
  expect(btn).toBeInTheDocument();

  fireEvent.click(btn);
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard/progreso-usuario/u1');
});

it('filtra usuarios por nombre o email', async () => {
  mockedGet.mockResolvedValueOnce({
    data: {
      data: [
        {
          _id: 'u1',
          nombre: 'Alice',
          apellidos: 'Smith',
          email: 'alice@example.com',
          tipo: 'Programa Residentes',
          hospital: { nombre: 'H1' }
        },
        {
          _id: 'u2',
          nombre: 'Bob',
          apellidos: 'Doe',
          email: 'bob@example.com',
          tipo: 'Programa Residentes',
          hospital: { nombre: 'H2' }
        }
      ]
    }
  });

  render(
    <MemoryRouter>
      <AdminInformes />
    </MemoryRouter>
  );

  expect(await screen.findByText('Alice Smith')).toBeInTheDocument();

  const input = screen.getByPlaceholderText('Buscar por nombre o email');
  await userEvent.type(input, 'bob');

  expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  expect(screen.getByText('Bob Doe')).toBeInTheDocument();
});


