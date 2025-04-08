// Función de registro de auditoría (temporal para evitar error)
const auditLog = async (action, userId) => {
  console.log(`Audit log - Acción: ${action}, Usuario: ${userId}`);
};

module.exports = auditLog;
