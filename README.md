# Plataforma de Formación en Tecnologías del Robot da Vinci

Este proyecto implementa una plataforma web completa para llevar el seguimiento del programa de formación en tecnologías del robot da Vinci para residentes de hospitales.

## Características principales

- Sistema de autenticación con diferentes roles (residentes, formadores, administradores)
- Seguimiento del progreso de los residentes a través de las diferentes fases del programa
- Validación de actividades por parte de los formadores
- Panel de administración para gestionar usuarios, hospitales, fases y actividades
- Diseño moderno y responsive con la identidad visual de Abex Excelencia Robótica e Intuitive Surgical

## Estructura del proyecto

```
davinci-platform/
├── src/                    # Backend (Node.js, Express, MongoDB)
│   ├── config/             # Configuración del servidor
│   ├── controllers/        # Controladores de la API
│   ├── middleware/         # Middleware (autenticación, errores)
│   ├── models/             # Modelos de datos
│   ├── routes/             # Rutas de la API
│   ├── utils/              # Utilidades
│   └── server.js           # Punto de entrada del servidor
├── client/                 # Frontend (React, TypeScript, Material-UI)
│   ├── public/             # Archivos estáticos
│   ├── src/                # Código fuente
│   │   ├── components/     # Componentes reutilizables
│   │   ├── context/        # Contextos de React (autenticación)
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── App.tsx         # Componente principal
│   │   └── index.tsx       # Punto de entrada
│   └── package.json        # Dependencias del frontend
├── test.sh                 # Script para pruebas
├── dev.sh                  # Script para desarrollo
├── deploy.sh               # Script para despliegue
├── DEPLOY.md               # Instrucciones de despliegue
├── MANUAL_USUARIO.md       # Manual de usuario
└── package.json            # Dependencias del backend
```

## Tecnologías utilizadas

### Backend
- Node.js
- Express
- MongoDB
- JWT para autenticación
- Bcrypt para encriptación de contraseñas

### Frontend
- React
- TypeScript
- Material-UI
- React Router
- Axios para peticiones HTTP

## Instalación y ejecución

### Requisitos previos
- Node.js (v14 o superior)
- MongoDB (local o Atlas)

### Instalación
1. Clonar el repositorio
2. Instalar dependencias del backend: `npm install`
3. Instalar dependencias del frontend: `cd client && npm install`

### Ejecución en desarrollo
```bash
./dev.sh
```

### Pruebas
```bash
./test.sh
```

### Despliegue
```bash
./deploy.sh
```
Ver `DEPLOY.md` para instrucciones detalladas de despliegue.

## Documentación
- `DEPLOY.md`: Instrucciones detalladas para el despliegue en servicios gratuitos
- `MANUAL_USUARIO.md`: Manual de usuario con instrucciones para cada rol

## Inicialización del progreso
Al registrar un usuario con rol de **residente** se crea un progreso
formativo por cada fase del programa. Si alguna fase no tiene
actividades asociadas, la función de inicialización registrará una
advertencia en consola y no generará un `ProgresoResidente` para esa
fase.

## Licencia
Propiedad de Abex Excelencia Robótica. Todos los derechos reservados.
