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

⚠️ Este archivo no interfiere con el código ni el despliegue.
