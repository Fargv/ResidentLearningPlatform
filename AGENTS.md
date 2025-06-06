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
---

⚠️ Este archivo no interfiere con el código ni el despliegue.
