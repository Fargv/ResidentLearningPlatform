# Tareas propuestas tras la revisión del código

1. **Corregir error tipográfico en la documentación principal.**
   - Ajustar la frase "Validación de actividades por parte de los tutores e profesores" a "tutores y profesores" en el README para evitar la falta de concordancia detectada en la lista de características.【F:README.md†L7-L9】

2. **Permitir que `CLIENT_ORIGIN` funcione en la configuración de CORS.**
   - Incluir dinámicamente el valor de `clientOrigin` dentro del arreglo `allowedOrigins` en `src/server.js`; en la actualidad la variable se calcula pero no se utiliza, por lo que cualquier dominio configurado mediante la variable de entorno sigue siendo rechazado por el filtro CORS.【F:src/server.js†L45-L66】

3. **Actualizar la documentación de requisitos de Node.js.**
   - El repositorio fija la versión de Node en `20` mediante `.nvmrc`, pero el README afirma que basta con "Node.js (v18 o superior)". Conviene unificar la documentación para reflejar la versión efectiva que espera el proyecto.【F:README.md†L57-L59】【F:.nvmrc†L1-L1】

4. **Ampliar las pruebas unitarias de `updatePhaseStatus`.**
   - Añadir un caso de prueba que verifique el comportamiento cuando existen actividades sin validar (debería evitar transiciones de estado y llamadas de guardado) o cuando no hay una siguiente fase; actualmente los tests de Jest solo cubren escenarios felices y el uso de `FaseSoc`, dejando sin verificar estas ramas de control.【F:tests/updatePhaseStatus.test.js†L11-L65】