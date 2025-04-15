const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/database');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const faseRoutes = require('./routes/faseRoutes');
const actividadRoutes = require('./routes/actividadRoutes');
const progresoRoutes = require('./routes/progresoRoutes');
const adjuntoRoutes = require('./routes/adjuntoRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
//const sharepointRoutes = require('./routes/sharepointRoutes');

// Inicializar app
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Middleware de desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Subida de archivos
app.use(fileupload());

// Directorio estático
app.use(express.static(path.join(__dirname, '../public')));

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospitales', hospitalRoutes); // ✅ para que funcione el frontend
app.use('/api/fases', faseRoutes);
app.use('/api/actividades', actividadRoutes);
app.use('/api/progreso', progresoRoutes);
app.use('/api/adjuntos', adjuntoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
//app.use('/api/sharepoint', sharepointRoutes);

// Ruta para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de la plataforma de formación en tecnologías del robot da Vinci',
    version: '1.0.0'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor con manejo de errores
const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en modo ${process.env.NODE_ENV} en el puerto ${PORT}`);
});

// Manejar rechazos de promesas no capturados
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});



module.exports = app;
