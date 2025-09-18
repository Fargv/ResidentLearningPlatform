# Instrucciones de Despliegue

Este documento contiene las instrucciones para desplegar la plataforma de formación en tecnologías del robot da Vinci.

## Requisitos previos

- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (plan gratuito)
- Cuenta en [Render](https://render.com/) (plan gratuito)
- Cuenta en [Netlify](https://www.netlify.com/) (plan gratuito)

## Pasos para el despliegue

### 1. Base de datos (MongoDB Atlas)

1. Crear una cuenta en MongoDB Atlas si aún no tienes una.
2. Crear un nuevo cluster (el plan M0 gratuito es suficiente).
3. Configurar un usuario y contraseña para la base de datos.
4. Configurar el acceso a la red (permitir acceso desde cualquier lugar para desarrollo).
5. Obtener la cadena de conexión (URI).

### 2. Backend (Render)

1. Crear una cuenta en Render si aún no tienes una.
2. Crear un nuevo servicio web.
3. Conectar con el repositorio de GitHub.
4. Configurar el servicio:
   - Nombre: `davinci-platform-api`
   - Entorno: Node
   - Comando de construcción: `npm install`
   - Comando de inicio: `node src/server.js`
5. Configurar variables de entorno:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: URI de MongoDB Atlas
   - `JWT_SECRET`: Una cadena aleatoria segura
   - `JWT_EXPIRE`: `30d`
   - `FRONTEND_URL`: URL pública del frontend (por ejemplo, `https://tu-sitio.netlify.app`)
   - `BREVO_API_KEY`: Clave API transaccional de Brevo
   - `BREVO_SENDER_EMAIL`: Remitente autenticado en Brevo
   - `BREVO_SENDER_NAME`: Nombre que verán los destinatarios
   - `RESEND_API_KEY`: (Opcional) Clave de Resend si se utiliza como alternativa

   ⚠️ Asegúrate de que `BREVO_SENDER_EMAIL` y `BREVO_SENDER_NAME` correspondan al mismo remitente verificado en Brevo. Si alguno de los valores no coincide con un remitente validado, Brevo rechazará el envío de correos transaccionales.
6. Desplegar el servicio.

### 3. Frontend (Netlify)

1. Crear una cuenta en Netlify si aún no tienes una.
2. Crear un nuevo sitio.
3. Conectar con el repositorio de GitHub.
4. Configurar el despliegue:
   - Directorio base: `client`
   - Comando de construcción: `npm run build`
   - Directorio de publicación: `build`
5. Configurar variables de entorno:
   - `REACT_APP_API_URL`: `https://davinci-platform-api.onrender.com/api`
6. Desplegar el sitio.

## Verificación del despliegue

1. Acceder a la URL del frontend proporcionada por Netlify.
2. Iniciar sesión con las credenciales de administrador.
3. Verificar que todas las funcionalidades estén operativas.

## Mantenimiento

- Los cambios en el código se desplegarán automáticamente al hacer push al repositorio.
- Para actualizar las variables de entorno, acceder al panel de control de Render o Netlify.
- Para realizar copias de seguridad de la base de datos, utilizar las herramientas de MongoDB Atlas.