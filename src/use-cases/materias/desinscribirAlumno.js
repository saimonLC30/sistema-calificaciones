// CASO DE USO (admin): desinscribir a un alumno de una materia.
// Regla: no se puede si ya tiene notas en la materia.
const AppError = require('../../utils/AppError');
const { tieneAlumno } = require('../../domain/materia');
const { validarId } = require('../../utils/validaciones');
const { buscarOFallar } = require('../compartidos');

const NO_ENCONTRADA = 'Materia no encontrada';

module.exports =
  ({ materiaRepo, calificacionRepo }) =>
  async ({ id, alumnoId }) => {
    const materia = await buscarOFallar(materiaRepo, id, NO_ENCONTRADA);
    validarId(alumnoId, 'alumnoId');

    if (!tieneAlumno(materia, alumnoId)) {
      throw new AppError('El alumno no está inscripto en esta materia', 404);
    }
    if (await calificacionRepo.existeDeAlumnoEnMateria(alumnoId, materia._id)) {
      throw new AppError('No se puede desinscribir a un alumno que ya tiene calificaciones en la materia', 409);
    }
    await materiaRepo.quitarAlumno(materia._id, alumnoId);
  };
