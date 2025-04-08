#!/bin/bash

# Script para desplegar la plataforma en servicios gratuitos
# Este script prepara y despliega el backend en Render y el frontend en Netlify

echo "Preparando despliegue de la plataforma..."

# Directorio base
BASE_DIR="/home/ubuntu/davinci-platform"

# Crear archivo de configuración para Render
echo "Creando archivo de configuración para Render..."
cat > $BASE_DIR/render.yaml << EOL
services:
  - type: web
    name: davinci-platform-api
    env: node
    buildCommand: npm install
    startCommand: node src/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRE
        value: 30d
EOL

# Crear archivo de configuración para Netlify
echo "Creando archivo de configuración para Netlify..."
mkdir -p $BASE_DIR/client/public
cat > $BASE_DIR/client/netlify.toml << EOL
[build]
  base = "client/"
  publish = "build/"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://davinci-platform-api.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOL

# Crear archivo .env para el frontend
echo "Creando archivo .env para el frontend..."
cat > $BASE_DIR/client/.env << EOL
REACT_APP_API_URL=https://davinci-platform-api.onrender.com/api
EOL

# Crear archivo README con instrucciones de despliegue
echo "Creando archivo README con instrucciones de despliegue..."
cat > $BASE_DIR/DEPLOY.md << EOL
# Instrucciones de Despliegue

Este documento contiene las instrucciones para desplegar la plataforma de formación en tecnologías del robot da Vinci.

## Requisitos previos

- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (plan gratuito)
- Cuenta en [Render](https://render.com/) (plan gratuito)
- Cuenta en [Netlify](https://www.netlify.com/) (plan gratuito)

## Pasos para el despliegue

### 1. Base de datos (MongoDB Atlas)

1. Crear una cuenta en MongoDB Atlas si aún no tienes una
2. Crear un nuevo cluster (el plan M0 gratuito es suficiente)
3. Configurar un usuario y contraseña para la base de datos
4. Configurar el acceso a la red (permitir acceso desde cualquier lugar para desarrollo)
5. Obtener la cadena de conexión (URI)

### 2. Backend (Render)

1. Crear una cuenta en Render si aún no tienes una
2. Crear un nuevo servicio web
3. Conectar con el repositorio de GitHub
4. Configurar el servicio:
   - Nombre: davinci-platform-api
   - Entorno: Node
   - Comando de construcción: npm install
   - Comando de inicio: node src/server.js
5. Configurar variables de entorno:
   - NODE_ENV: production
   - MONGO_URI: (URI de MongoDB Atlas)
   - JWT_SECRET: (una cadena aleatoria segura)
   - JWT_EXPIRE: 30d
6. Desplegar el servicio

### 3. Frontend (Netlify)

1. Crear una cuenta en Netlify si aún no tienes una
2. Crear un nuevo sitio
3. Conectar con el repositorio de GitHub
4. Configurar el despliegue:
   - Directorio base: client
   - Comando de construcción: npm run build
   - Directorio de publicación: build
5. Configurar variables de entorno:
   - REACT_APP_API_URL: https://davinci-platform-api.onrender.com/api
6. Desplegar el sitio

## Verificación del despliegue

1. Acceder a la URL del frontend proporcionada por Netlify
2. Iniciar sesión con las credenciales de administrador
3. Verificar que todas las funcionalidades estén operativas

## Mantenimiento

- Los cambios en el código se desplegarán automáticamente al hacer push al repositorio
- Para actualizar las variables de entorno, acceder al panel de control de Render o Netlify
- Para realizar copias de seguridad de la base de datos, utilizar las herramientas de MongoDB Atlas
EOL

# Crear archivo de documentación para el usuario
echo "Creando documentación para el usuario..."
cat > $BASE_DIR/MANUAL_USUARIO.md << EOL
# Manual de Usuario - Plataforma de Formación da Vinci

Este manual proporciona instrucciones detalladas sobre cómo utilizar la plataforma de formación en tecnologías del robot da Vinci.

## Acceso a la plataforma

1. Abrir el navegador web y acceder a la URL proporcionada
2. Introducir las credenciales de acceso (email y contraseña)
3. Si es la primera vez que accedes con una invitación, deberás completar el registro

## Roles de usuario

### Residentes

Como residente, podrás:

1. Ver tu progreso general en el dashboard
2. Acceder a las diferentes fases del programa formativo
3. Registrar la realización de actividades
4. Ver el estado de tus actividades (pendientes, validadas, rechazadas)
5. Recibir notificaciones sobre validaciones

#### Registrar una actividad

1. Acceder a la sección "Mi Progreso"
2. Seleccionar la fase correspondiente
3. Buscar la actividad que has realizado
4. Hacer clic en "Registrar"
5. Añadir comentarios o notas si es necesario
6. Confirmar el registro

### Formadores

Como formador, podrás:

1. Ver estadísticas del hospital en el dashboard
2. Gestionar las validaciones de los residentes
3. Ver el progreso de los residentes asignados
4. Recibir notificaciones sobre nuevas actividades pendientes de validación

#### Validar una actividad

1. Acceder a la sección "Validaciones"
2. Revisar las actividades pendientes de validación
3. Seleccionar la actividad a validar
4. Revisar los detalles y comentarios del residente
5. Decidir si validar o rechazar la actividad
6. Añadir comentarios si es necesario
7. Confirmar la validación o rechazo

### Administradores

Como administrador, podrás:

1. Ver estadísticas generales en el dashboard
2. Gestionar usuarios (crear, editar, eliminar)
3. Gestionar hospitales (crear, editar, eliminar)
4. Gestionar fases y actividades del programa formativo
5. Acceder a todas las funcionalidades de formadores y residentes

#### Invitar a un nuevo usuario

1. Acceder a la sección "Usuarios"
2. Hacer clic en "Invitar Usuario"
3. Completar el formulario con los datos del usuario
4. Seleccionar el rol (residente, formador o administrador)
5. Si es residente o formador, seleccionar el hospital
6. Enviar la invitación

## Funcionalidades comunes

### Perfil de usuario

1. Hacer clic en tu avatar en la esquina superior derecha
2. Seleccionar "Perfil"
3. Actualizar tus datos personales
4. Cambiar tu contraseña si es necesario

### Notificaciones

1. Hacer clic en el icono de campana en la barra superior
2. Ver las notificaciones recientes
3. Marcar como leídas las notificaciones

## Soporte técnico

Si encuentras algún problema o tienes alguna duda, contacta con el administrador del sistema.
EOL

echo "Preparación para el despliegue completada."
echo "Consulta los archivos DEPLOY.md y MANUAL_USUARIO.md para más información."
