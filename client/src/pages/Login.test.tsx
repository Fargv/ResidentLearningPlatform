import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import i18n from '../i18n';

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    error: null,
    loading: false,
    clearError: jest.fn()
  })
}));

const cases: Array<[string, string]> = [
  ['en', 'Password'],
  ['fr', 'Mot de passe'],
  ['de', 'Passwort'],
  ['it', 'Password'],
  ['ca', 'Contrasenya'],
  ['gl', 'Contrasinal'],
  ['eu', 'Pasahitza'],
  ['pt', 'Senha']
];

test.each(cases)('renders Password label when language is %s', async (lang, label) => {
  await i18n.changeLanguage(lang);
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
  expect(screen.getByLabelText(label)).toBeInTheDocument();
});
