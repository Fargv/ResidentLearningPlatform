import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  const loginButton = screen.getByRole('button', { name: /iniciar sesi\u00f3n/i });
  expect(loginButton).toBeInTheDocument();
});
