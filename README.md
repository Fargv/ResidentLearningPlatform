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
El script determina automáticamente la ruta del proyecto por lo que puede ejecutarse desde cualquier directorio.

### Pruebas
```bash
./test.sh
```
Al igual que `dev.sh`, este script se puede ejecutar desde cualquier ubicación ya que calcula la raíz del repositorio.

### Despliegue
```bash
./deploy.sh
```
Ver `DEPLOY.md` para instrucciones detalladas de despliegue.

## Documentación
- `DEPLOY.md`: Instrucciones detalladas para el despliegue en servicios gratuitos
- `MANUAL_USUARIO.md`: Manual de usuario con instrucciones para cada rol

## Ejecución de scripts de migración
Los cambios en el esquema pueden requerir ejecutar scripts ubicados en la carpeta
`scripts/`. Estos se lanzan manualmente y **solo una vez** tras actualizar a una
nueva versión que lo indique.

### Prerrequisitos
1. Configurar la variable `MONGO_URI` con la cadena de conexión a tu base de
   datos (en un archivo `.env` o exportándola en la terminal).
2. Tener instalado Node.js.

### Cómo ejecutarlos
Cada script se ejecuta con Node:

```bash
node scripts/migrateLegacyData.js
node scripts/migrateOrdenFases.js
node scripts/updateFaseOrden.js
node scripts/ensureOrdenUnique.js
```
`migrateLegacyData.js` adapta datos antiguos y `ensureOrdenUnique.js` crea el
índice único en el campo `orden`. Los demás actualizan el orden de las fases.

## Inicialización del progreso
Al registrar un usuario con rol de **residente** se crea un progreso
formativo por cada fase del programa. Si alguna fase no tiene
actividades asociadas, la función de inicialización registrará una
advertencia en consola y no generará un `ProgresoResidente` para esa
fase.

## Migración de datos antiguos
Si trabajas con una base de datos creada antes de la versión que incluye el
campo `nombre` en `Fase` y la referencia `actividad` en los progresos, ejecuta:

```bash
node scripts/migrateLegacyData.js
```

El script actualiza las fases que todavía usan el campo `titulo`, rellena el
orden con el número de la fase y vincula cada actividad de los registros de
`ProgresoResidente` con su documento `Actividad` correspondiente.


## Licencia
Propiedad de Abex Excelencia Robótica. Todos los derechos reservados.
