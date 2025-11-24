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
const faseSocRoutes = require('./routes/faseSocRoutes');
const actividadSocRoutes = require('./routes/actividadSocRoutes');
const progresoRoutes = require('./routes/progresoRoutes');
const adjuntoRoutes = require('./routes/adjuntoRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sociedadesRoutes = require('./routes/sociedadesRoutes');
const certificadoRoutes = require('./routes/certificadoRoutes');
const accessCodeRoutes = require('./routes/accessCodeRoutes');
const surgeryTypeRoutes = require('./routes/surgeryTypeRoutes');
const informeCirugiasRoutes = require('./routes/informeCirugiasRoutes');
const informesRoutes = require('./routes/informesRoutes');
const siteInfoRoutes = require('./routes/siteInfoRoutes');

// Inicializar app
const app = express();

// Middlewares esenciales
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
const envOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'https://residentlearningplatform.netlify.app',
  'https://academicprogramdavinci.com',
  'https://academicprogramdavinci.netlify.app',
  ...envOrigins,
]));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🛑 CORS bloqueado para origen: ${origin}`);
      callback(new Error(`CORS bloqueado: ${origin} no está en la lista de permitidos`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight para todos los endpoints
app.use(fileupload());

// Middleware de desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Directorio público
app.use(express.static(path.join(__dirname, '../public')));

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/fases', faseRoutes);
app.use('/api/fasesSoc', faseSocRoutes);
app.use('/api/actividades', actividadRoutes);
app.use('/api/actividadesSoc', actividadSocRoutes);
app.use('/api/progreso', progresoRoutes);
app.use('/api/adjuntos', adjuntoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sociedades', sociedadesRoutes);
app.use('/api/certificado', certificadoRoutes);
app.use('/api/access-codes', accessCodeRoutes);
app.use('/api/surgery-types', surgeryTypeRoutes);
app.use('/api/informe-cirugias', informeCirugiasRoutes);
app.use('/api/informes', informesRoutes);
app.use('/api/site-info', siteInfoRoutes);


// Ruta test del servidor
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de la plataforma de formación Da Vinci',
    version: '1.0.0'
  });
});

// Middleware de errores
app.use(errorHandler);

// Configuración del puerto
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Servidor en modo ${process.env.NODE_ENV} en puerto ${PORT}`);
});

// Captura errores no gestionados
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error no capturado: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
