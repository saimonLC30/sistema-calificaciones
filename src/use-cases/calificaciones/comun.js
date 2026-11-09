// Ayudas que comparten los casos de uso de calificaciones.
const AppError = require('../../utils/AppError');
const { buscarOFallar } = require('../compartidos');

// Trae la calificación y la materia a la que pertenece (para chequear permisos).
const buscarCalificacionConMateria = async ({ calificacionRepo, materiaRepo }, id) => {
  const calificacion = await buscarOFallar(calificacionRepo, id, 'Calificación no encontrada');
  const materia = await materiaRepo.buscarPorId(calificacion.materia);
  if (!materia) throw new AppError('La materia de esta calificación ya no existe', 404);
  return { calificacion, materia };
};

// Lo que ve un alumno: sin el historial interno de cambios
const vistaAlumno = ({ historial, ...resto }) => resto;

module.exports = { buscarCalificacionConMateria, vistaAlumno };
