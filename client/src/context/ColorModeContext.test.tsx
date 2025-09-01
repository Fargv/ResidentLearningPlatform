import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
