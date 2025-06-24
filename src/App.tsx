import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Contexto de autenticación
import { AuthProvider } from "./context/AuthContext";

// Componentes de enrutamiento
import PrivateRoute from "./components/routing/PrivateRoute";
import AdminRoute from "./components/routing/AdminRoute";
import FormadorRoute from "./components/routing/FormadorRoute";
import ResidenteRoute from "./components/routing/ResidenteRoute";

// Páginas públicas
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Páginas del dashboard
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import ResidenteProgreso from "./pages/dashboard/ResidenteProgreso";
import FormadorValidaciones from "./pages/dashboard/FormadorValidaciones";
import AdminUsuarios from "./pages/dashboard/AdminUsuarios";
import AdminHospitales from "./pages/dashboard/AdminHospitales";
import AdminFases from "./pages/dashboard/AdminFases";
import Perfil from "./pages/dashboard/Perfil";
import Notificaciones from "./pages/dashboard/Notificaciones";
import AdminValidaciones from "./pages/dashboard/AdminValidaciones";

// Tema personalizado con colores de Abex e Intuitive
const theme = createTheme({
  palette: {
    primary: {
      main: "#1E5B94", // Azul Abex
      light: "#4c7fb3",
      dark: "#153e67",
    },
    secondary: {
      main: "#6AB023", // Verde Abex
      light: "#8cc94f",
      dark: "#4a7b18",
    },
    background: {
      default: "#f5f5f5",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#ff9800",
    },
    info: {
      main: "#1A2B3C", // Azul oscuro Intuitive
    },
    success: {
      main: "#4caf50",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register/:token" element={<Register />} />

            {/* Ruta raíz redirige a dashboard o login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Rutas del dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardHome />} />

              {/* Rutas para residentes */}
              <Route
                path="progreso"
                element={
                  <ResidenteRoute>
                    <ResidenteProgreso />
                  </ResidenteRoute>
                }
              />

              {/* Rutas para formadores */}
              <Route
                path="validaciones"
                element={
                  <FormadorRoute>
                    <FormadorValidaciones />
                  </FormadorRoute>
                }
              />
              <Route
                path="usuarios"
                element={
                  <FormadorRoute>
                    <AdminUsuarios />
                  </FormadorRoute>
                }
              />

              {/* Rutas para administradores */}
              <Route
                path="usuarios"
                element={
                  <AdminRoute>
                    <AdminUsuarios />
                  </AdminRoute>
                }
              />
              <Route
                path="hospitales"
                element={
                  <AdminRoute>
                    <AdminHospitales />
                  </AdminRoute>
                }
              />
              <Route
                path="fases"
                element={
                  <AdminRoute>
                    <AdminFases />
                  </AdminRoute>
                }
              />
              <Route
                path="validaciones-admin"
                element={<AdminValidaciones />} // ← sin AdminRoute por ahora
              />


              {/* Rutas comunes */}
              <Route path="perfil" element={<Perfil />} />
              <Route path="notificaciones" element={<Notificaciones />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
