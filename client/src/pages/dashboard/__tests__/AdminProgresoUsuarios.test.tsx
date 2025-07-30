import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminProgresoUsuarios from '../AdminProgresoUsuarios';

const mockNavigate = jest.fn();

jest.mock('../../../api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import api from '../../../api';
const mockedGet = (api as any).get as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

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

it('filtra por nombre y email', async () => {
  mockedGet.mockResolvedValue({
    data: {
      data: [
        { _id: '1', nombre: 'Anna', apellidos: 'Lee', email: 'anna@ex.com', rol: 'residente', hospital: { nombre: 'H1' } },
        { _id: '2', nombre: 'Bob', apellidos: 'Ray', email: 'bob@example.com', rol: 'residente', hospital: { nombre: 'H2' } }
      ]
    }
  });

  render(
    <MemoryRouter>
      <AdminProgresoUsuarios />
    </MemoryRouter>
  );

  expect(await screen.findByText('Anna Lee')).toBeInTheDocument();

  const input = screen.getByPlaceholderText('Buscar por nombre o email');
  await userEvent.type(input, 'bob');

  expect(screen.queryByText('Anna Lee')).not.toBeInTheDocument();
  expect(screen.getByText('Bob Ray')).toBeInTheDocument();
});

it('muestra boton y la fila no es clickeable', async () => {
  mockedGet.mockResolvedValue({
    data: { data: [{ _id: '1', nombre: 'A', apellidos: 'B', email: 'a@b.com', rol: 'residente', hospital: { nombre: 'H1' } }] }
  });

  render(
    <MemoryRouter>
      <AdminProgresoUsuarios />
    </MemoryRouter>
  );

  const row = await screen.findByText('A B');
  const tr = row.closest('tr') as HTMLElement;
  expect(tr).not.toHaveStyle('cursor: pointer');
  fireEvent.click(tr);
  expect(mockNavigate).not.toHaveBeenCalled();

  const btn = screen.getByRole('button', { name: /Ver Progreso/i });
  expect(btn).toBeInTheDocument();
  fireEvent.click(btn);
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard/progreso-usuario/1');
});

