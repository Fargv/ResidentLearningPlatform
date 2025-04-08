// Archivo temporalmente desactivado porque aún no se usa integración con SharePoint

// const ErrorResponse = require('../utils/errorResponse');
// const { Client } = require('@microsoft/microsoft-graph-client');
// const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
// const { ClientSecretCredential } = require('@azure/identity');
// const config = require('../config/config');
// const { createAuditLog } = require('../utils/auditLog');

// // Configuración para la integración con SharePoint
// const credential = new ClientSecretCredential(
//   config.sharepoint.tenantId,
//   config.sharepoint.clientId,
//   config.sharepoint.clientSecret
// );

// const authProvider = new TokenCredentialAuthenticationProvider(credential, {
//   scopes: ['https://graph.microsoft.com/.default']
// });

// const graphClient = Client.initWithMiddleware({
//   authProvider: authProvider
// });

// // @desc    Obtener listas de SharePoint
// // @route   GET /api/sharepoint/listas
// // @access  Private/Admin
// exports.getSharePointListas = async (req, res, next) => {
//   try {
//     if (req.user.rol !== 'administrador') {
//       return next(new ErrorResponse('No autorizado para acceder a este recurso', 403));
//     }

//     const siteUrl = config.sharepoint.siteUrl;
//     const site = await graphClient.api(`/sites/${siteUrl}`).get();
//     const listas = await graphClient.api(`/sites/${site.id}/lists`).get();

//     await createAuditLog({
//       usuario: req.user._id,
//       accion: 'consultar_sharepoint_listas',
//       descripcion: 'Consulta de listas de SharePoint',
//       ip: req.ip
//     });

//     res.status(200).json({
//       success: true,
//       count: listas.value.length,
//       data: listas.value
//     });
//   } catch (err) {
//     console.error('Error al obtener listas de SharePoint:', err);
//     next(new ErrorResponse('Error al obtener listas de SharePoint', 500));
//   }
// };

// // @desc    Obtener elementos de una lista de SharePoint
// // @route   GET /api/sharepoint/listas/:listaId/items
// // @access  Private/Admin
// exports.getSharePointListaItems = async (req, res, next) => {
//   try {
//     if (req.user.rol !== 'administrador') {
//       return next(new ErrorResponse('No autorizado para acceder a este recurso', 403));
//     }

//     const siteUrl = config.sharepoint.siteUrl;
//     const listaId = req.params.listaId;
//     const site = await graphClient.api(`/sites/${siteUrl}`).get();
//     const items = await graphClient.api(`/sites/${site.id}/lists/${listaId}/items?expand=fields`).get();

//     await createAuditLog({
//       usuario: req.user._id,
//       accion: 'consultar_sharepoint_items',
//       descripcion: `Consulta de elementos de lista ${listaId} de SharePoint`,
//       ip: req.ip
//     });

//     res.status(200).json({
//       success: true,
//       count: items.value.length,
//       data: items.value
//     });
//   } catch (err) {
//     console.error('Error al obtener elementos de lista de SharePoint:', err);
//     next(new ErrorResponse('Error al obtener elementos de lista de SharePoint', 500));
//   }
// };

// // @desc    Sincronizar datos de SharePoint
// // @route   POST /api/sharepoint/sincronizar
// // @access  Private/Admin
// exports.sincronizarSharePoint = async (req, res, next) => {
//   try {
//     if (req.user.rol !== 'administrador') {
//       return next(new ErrorResponse('No autorizado para acceder a este recurso', 403));
//     }

//     const { listaId, entidad } = req.body;
//     if (!listaId || !entidad) {
//       return next(new ErrorResponse('Se requiere listaId y entidad', 400));
//     }

//     if (!['hospitales', 'actividades', 'fases'].includes(entidad)) {
//       return next(new ErrorResponse('Entidad no válida', 400));
//     }

//     const siteUrl = config.sharepoint.siteUrl;
//     const site = await graphClient.api(`/sites/${siteUrl}`).get();
//     const items = await graphClient.api(`/sites/${site.id}/lists/${listaId}/items?expand=fields`).get();

//     await createAuditLog({
//       usuario: req.user._id,
//       accion: 'sincronizar_sharepoint',
//       descripcion: `Sincronización de ${entidad} con lista ${listaId} de SharePoint`,
//       ip: req.ip
//     });

//     res.status(200).json({
//       success: true,
//       message: `Sincronización de ${entidad} iniciada`,
//       itemsCount: items.value.length
//     });
//   } catch (err) {
//     console.error('Error al sincronizar datos de SharePoint:', err);
//     next(new ErrorResponse('Error al sincronizar datos de SharePoint', 500));
//   }
// };

// // @desc    Verificar conexión con SharePoint
// // @route   GET /api/sharepoint/verificar
// // @access  Private/Admin
// exports.verificarConexionSharePoint = async (req, res, next) => {
//   try {
//     if (req.user.rol !== 'administrador') {
//       return next(new ErrorResponse('No autorizado para acceder a este recurso', 403));
//     }

//     const siteUrl = config.sharepoint.siteUrl;
//     const site = await graphClient.api(`/sites/${siteUrl}`).get();

//     await createAuditLog({
//       usuario: req.user._id,
//       accion: 'verificar_conexion_sharepoint',
//       descripcion: 'Verificación de conexión con SharePoint',
//       ip: req.ip
//     });

//     res.status(200).json({
//       success: true,
//       connected: true,
//       site: {
//         name: site.displayName,
//         url: site.webUrl,
//         id: site.id
//       }
//     });
//   } catch (err) {
//     console.error('Error al verificar conexión con SharePoint:', err);

//     res.status(200).json({
//       success: true,
//       connected: false,
//       error: err.message
//     });
//   }
// };
