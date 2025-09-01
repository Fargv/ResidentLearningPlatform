import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTheme } from '@mui/material/styles';
import { ColorModeProvider, useColorMode } from './ColorModeContext';

const TestComponent = () => {
  const { mode, toggleColorMode } = useColorMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={toggleColorMode}>toggle</button>
    </div>
  );
};

const ThemeConsumer = () => {
  const theme = useTheme();
  return (
    <span data-testid="info">
      {theme.palette.info.main}-{theme.palette.info.contrastText}
    </span>
  );
};

beforeEach(() => {
  localStorage.clear();
});

test('default mode is light', () => {
  render(
    <ColorModeProvider>
      <TestComponent />
    </ColorModeProvider>
  );
  expect(screen.getByTestId('mode')).toHaveTextContent('light');
});

test('toggleColorMode switches mode and persists choice', () => {
  render(
    <ColorModeProvider>
      <TestComponent />
    </ColorModeProvider>
  );

  fireEvent.click(screen.getByText('toggle'));

  expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  expect(localStorage.getItem('colorMode')).toBe('dark');
});

test('info palette updates with mode', () => {
  render(
    <ColorModeProvider>
      <TestComponent />
      <ThemeConsumer />
    </ColorModeProvider>
  );

  expect(screen.getByTestId('info')).toHaveTextContent('#1976d2-#fff');

  fireEvent.click(screen.getByText('toggle'));

  expect(screen.getByTestId('info')).toHaveTextContent('#90caf9-#000');
});
