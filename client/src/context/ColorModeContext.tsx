import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PaletteMode } from '@mui/material';

type ColorModeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

const getInitialMode = (): PaletteMode => {
  try {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('colorMode') as PaletteMode | null;
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary:
        mode === 'light'
          ? {
              main: '#1E5B94',
              light: '#4c7fb3',
              dark: '#153e67',
              contrastText: '#ffffff',
            }
          : {
              main: '#90caf9',
              light: '#c3fdff',
              dark: '#5d99c6',
              contrastText: '#0b1929',
            },
      secondary:
        mode === 'light'
          ? {
              main: '#6AB023',
              light: '#8cc94f',
              dark: '#4a7b18',
              contrastText: '#ffffff',
            }
          : {
              main: '#a5d6a7',
              light: '#d7ffd9',
              dark: '#75a478',
              contrastText: '#08240f',
            },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      error:
        mode === 'light'
          ? {
              main: '#d32f2f',
              light: '#ef5350',
              dark: '#9a0007',
              contrastText: '#ffffff',
            }
          : {
              main: '#ef9a9a',
              light: '#ffcdd2',
              dark: '#c62828',
              contrastText: '#3a0000',
            },
      warning:
        mode === 'light'
          ? {
              main: '#ff9800',
              light: '#ffb74d',
              dark: '#c66900',
              contrastText: '#1b0b00',
            }
          : {
              main: '#ffcc80',
              light: '#ffe0b2',
              dark: '#ffa726',
              contrastText: '#2f1600',
            },
      info:
        mode === 'light'
          ? {
              main: '#1976d2',
              light: '#63a4ff',
              dark: '#004ba0',
              contrastText: '#ffffff',
            }
          : {
              main: '#90caf9',
              light: '#c3fdff',
              dark: '#5d99c6',
              contrastText: '#0b1929',
            },
      success:
        mode === 'light'
          ? {
              main: '#4caf50',
              light: '#81c784',
              dark: '#357a38',
              contrastText: '#ffffff',
            }
          : {
              main: '#a5d6a7',
              light: '#d7ffd9',
              dark: '#75a478',
              contrastText: '#08240f',
            },
      divider: mode === 'light' ? '#e0e0e0' : '#2d2d2d',
    },
    typography: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 500 },
      h2: { fontWeight: 500 },
      h3: { fontWeight: 500 },
      h4: { fontWeight: 500 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow:
              mode === 'light'
                ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                : '0 2px 8px rgba(0, 0, 0, 0.4)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow:
              mode === 'light'
                ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                : '0 2px 8px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
  });

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('colorMode', mode);
      }
    } catch {
      // noop
    }
  }, [mode]);

  const toggleColorMode = () =>
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const ctxValue = useMemo(() => ({ mode, toggleColorMode }), [mode]);
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={ctxValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within a ColorModeProvider');
  return ctx;
};
