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

test('renders Password label when language is English', async () => {
  await i18n.changeLanguage('en');
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
  expect(screen.getByLabelText('Password')).toBeInTheDocument();
});
