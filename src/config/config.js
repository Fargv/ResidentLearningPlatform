require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/davinci-platform',
  jwtSecret: process.env.JWT_SECRET || 'davinci-platform-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  
  // Configuración para integración con SharePoint
  sharepoint: {
    clientId: process.env.SHAREPOINT_CLIENT_ID,
    clientSecret: process.env.SHAREPOINT_CLIENT_SECRET,
    tenantId: process.env.SHAREPOINT_TENANT_ID,
    siteUrl: process.env.SHAREPOINT_SITE_URL
  },
  
  // Configuración para cumplimiento LOPD
  dataRetentionPeriod: process.env.DATA_RETENTION_PERIOD || '5y', // Período de retención de datos
  encryptionKey: process.env.ENCRYPTION_KEY, // Clave para cifrado de datos sensibles
  
  // Configuración de correo electrónico para notificaciones
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'no-reply@abexsl.es'
  },
  resendApiKey: process.env.RESEND_API_KEY
};
