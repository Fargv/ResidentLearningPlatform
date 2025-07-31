# AGENTS.md

Este archivo registra tareas realizadas o propuestas por agentes automáticos (como Codex o ChatGPT) dentro del repositorio `ResidentLearningPlatform`.

## 📌 Historial de tareas por IA

- [Fecha] [Descripción breve de la tarea propuesta o realizada]
- 2025-06-04: Reemplazo de `Usuario.findById` por `User.findById` en `progresoController.js` para asegurar consistencia de modelo.
- 2025-06-04: Añadida importación de `crearProgresoParaUsuario` en `progresoRoutes.js`.
- 2025-06-06: Añadido campo `orden` al populate de fases y ordenados los progresos por este valor en `progresoController.js`.
- 2025-06-07: `orden` de fases se autocompleta con `numero`; script de migración `scripts/updateFaseOrden.js`.
- 2025-06-06: Añadida función `updatePhaseStatus` para actualizar el estado de las fases tras validar actividades y prueba unitaria.
- 2025-06-07: `orden` en `Fase` ahora usa `numero` como valor predeterminado; se actualizó `createFase` y se añadió script de migración.
- 2025-06-07: Implementado `updatePhaseStatus` en `progresoController.js` y tests asociados.
- 2025-06-08: Campo `orden` de `Fase` marcado como único y script `scripts/ensureOrdenUnique.js` para crear índice.
- 2025-06-08: Script `scripts/addZonaField.js` para inicializar campo `zona` en hospitales.
- 2025-06-09: Botón para crear progreso en `AdminValidaciones` y validaciones de coherencia en `adminController`.
- 2025-06-24: Añadida página de Sociedades al Dashboard con nuevo icono y ruta
- 2025-06-26: `updatePhaseStatus` usa modelo de fase dinámico para desbloquear fases en Sociedades
- 2025-06-26: Verificación de que los usuarios del Programa Sociedades usan `getProgresoResidente`; sin variantes adicionales.
- 2025-07-09: Añadido endpoint de descarga de certificado con generación de PDF y prueba unitaria.
- 2025-07-10: Añadido patrón "*.log" en ".gitignore" y eliminado "backend.log" del repositorio.
- 2025-07-10: Rutas CRUD para `AccessCode` y pruebas con Supertest.
- 2025-07-15: Permitir edición de estados en `AdminValidaciones` y mostrar errores de backend.
- 2025-07-15: Entrada "Progreso de usuarios" para administradores en el Dashboard.
- 2025-07-16: Sanitización de payload en `AdminUsuarios.tsx` antes de crear o
  actualizar usuarios.
- 2025-07-17: Fechas de sociedades en `ResidenteFases` con formato "julio 2025"
  y color según estado y fecha.
- 2025-07-17: Nuevo formateador `formatDayMonthYear` y fecha corta en `ResidenteFases`.
- 2025-07-17: Milestones del Dashboard con diálogo y test de apertura al hacer clic.
- 2025-07-22: npm test ahora ejecuta pruebas del cliente con react-scripts antes de las pruebas de backend.
- 2025-07-18: Validación de tamaño de archivo en `ResidenteFases` y mensaje de error.
- 2025-07-21: Banner de desarrollo y fondo rojo claro en `App.tsx` cuando
  `REACT_APP_ENV` es `dev`.
- 2025-07-22: userController copia `zona` del hospital y valida rol `coordinador`.
- 2025-07-22: formData.tipo predeterminado 'Programa Residentes' y ajustes en handleChange
- 2025-07-30: Eliminada la vista `AdminValidaciones` y ruta `/dashboard/validaciones-admin`; se reemplaza por `informes`.
- 2025-07-31: Añadidas dependencias `ajv` y `ajv-keywords` al cliente e intento de regenerar el lockfile.

⚠️ Este archivo no interfiere con el código ni el despliegue.
