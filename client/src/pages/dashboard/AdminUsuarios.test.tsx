import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUsuarios from './AdminUsuarios';
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
const mockedPut = (api as any).put as jest.Mock;

beforeEach(() => {
  mockedUseAuth.mockReturnValue({ user: { rol: 'administrador' } } as any);
  i18n.changeLanguage('es');
});

afterEach(() => {
  jest.clearAllMocks();
});

test('muestra boton Ver Progreso cuando tiene progreso', async () => {
  mockedGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'u1',
            nombre: 'Res',
            apellidos: 'A',
            email: 'r@a.com',
            rol: 'residente',
            tipo: 'Programa Residentes',
            tieneProgreso: true,
          },
        ],
      },
    })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  expect(await screen.findByText('Ver Progreso')).toBeInTheDocument();
});

test('muestra boton Crear progreso cuando no existe progreso', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: false }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  expect(await screen.findByText('Crear progreso')).toBeInTheDocument();
});

test('muestra boton Ver Progreso cuando tiene progreso', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: true }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  await screen.findByText('Res A');
  expect(screen.getByText('Ver Progreso')).toBeInTheDocument();
  expect(screen.queryByText('Crear progreso')).not.toBeInTheDocument();
});

test('muestra boton Cambiar contraseña para administradores', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: false }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  expect(await screen.findByText('Cambiar contraseña')).toBeInTheDocument();
});

test('muestra botones Editar y Eliminar', async () => {
  mockedGet
    .mockResolvedValueOnce({ data: { data: [
      { _id: 'u1', nombre: 'Res', apellidos: 'A', email: 'r@a.com', rol: 'residente', tipo: 'Programa Residentes', tieneProgreso: false }
    ] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );
  expect(await screen.findByText('Editar')).toBeInTheDocument();
  expect(screen.getByText('Eliminar')).toBeInTheDocument();
});

test('muestra advertencia en columna Tutor cuando residente no tiene tutor', async () => {
  mockedGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'u1',
            nombre: 'Res',
            apellidos: 'A',
            email: 'r@a.com',
            rol: 'residente',
            tipo: 'Programa Residentes',
            tutor: null,
          },
        ],
      },
    })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: [] });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );

  const nameCell = await screen.findByText('Res A');
  const row = nameCell.closest('tr') as HTMLElement;
  const cells = within(row).getAllByRole('cell');
  expect(cells[7]).toHaveTextContent(i18n.t('adminUsers.noTutor'));
});

test('envía tutor vacío al desasignar en edición', async () => {
  mockedGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'u1',
            nombre: 'Res',
            apellidos: 'A',
            email: 'r@a.com',
            rol: 'residente',
            tipo: 'Programa Residentes',
            hospital: { _id: 'h1', nombre: 'H1' },
            especialidad: 'URO',
            tutor: { _id: 't1', nombre: 'Tut', apellidos: 'Uno' },
          },
        ],
      },
    })
    .mockResolvedValueOnce({ data: { data: [{ _id: 'h1', nombre: 'H1', zona: 'NORTE' }] } })
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: { data: [{ _id: 't1', nombre: 'Tut', apellidos: 'Uno' }] } });

  mockedPut.mockResolvedValueOnce({ data: { data: {} } });

  render(
    <I18nextProvider i18n={i18n}>
      <AdminUsuarios />
    </I18nextProvider>
  );

  const editBtn = await screen.findByRole('button', {
    name: i18n.t('adminUsers.actions.edit'),
  });
  await userEvent.click(editBtn);

  const tutorSelect = await screen.findByLabelText(
    i18n.t('adminUsers.fields.tutor')
  );
  await userEvent.selectOptions(tutorSelect, '');

  const saveBtn = screen.getByRole('button', {
    name: i18n.t('common.saveChanges'),
  });
  await userEvent.click(saveBtn);

  await waitFor(() => {
    expect(mockedPut).toHaveBeenCalledWith(
      '/users/u1',
      expect.objectContaining({ tutor: '' })
    );
  });
});
