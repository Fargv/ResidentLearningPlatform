// Función de registro de auditoría (temporal para evitar error)
// Ahora recibe un único objeto con las propiedades { accion, usuario, descripcion, ip }
const createAuditLog = async ({ accion, usuario, descripcion, ip }) => {
  console.log(
    `Audit log - Acción: ${accion}, Usuario: ${usuario}, Descripción: ${descripcion}, IP: ${ip}`
  );
};

module.exports = { createAuditLog };
