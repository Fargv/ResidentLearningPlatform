const User = require('../models/User');
const { Role } = require('./roles');

// Busca un tutor según reglas de negocio o devuelve el proporcionado.
// - Si se pasa un tutorId directo → lo devuelve.
// - Si tutorId === 'ALL' → busca un tutor del hospital por especialidad o ALL.
// - Si tutorId === null/undefined → devuelve null.
// - En caso contrario → busca por hospital y especialidad.
async function resolveTutor(tutorId, hospital, especialidad) {
  if (tutorId && tutorId !== 'ALL') {
    return tutorId; // devuelve el id proporcionado
  }

  if (tutorId === null) {
    return null; // explícitamente sin tutor
  }

  // Caso ALL o cuando se necesita resolver automáticamente
  const query = { hospital, rol: Role.TUTOR };
  if (especialidad && especialidad !== 'ALL') {
    query.$or = [{ especialidad }, { especialidad: 'ALL' }];
  } else {
    query.especialidad = 'ALL';
  }

  const tutor = await User.findOne(query).sort({ createdAt: 1 }).select('_id');
  return tutor ? tutor._id : null;
}

module.exports = { resolveTutor };
