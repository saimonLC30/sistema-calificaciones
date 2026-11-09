// CASO DE USO (docente de la materia o admin): eliminar una evaluación.
// Regla: no se puede si ya tiene calificaciones.
const AppError = require('../../utils/AppError');
const { verificarGestionarMateria } = require('../../domain/permisos');
const { buscarConMateria } = require('./comun');

module.exports =
  (deps) =>
  async ({ usuarioActual, id }) => {
    const { evaluacionRepo, calificacionRepo } = deps;
    const { evaluacion, materia } = await buscarConMateria(deps, id);
    verificarGestionarMateria(usuarioActual, materia);

    if (await calificacionRepo.existeEnEvaluacion(evaluacion._id)) {
      throw new AppError('No se puede eliminar una evaluación que ya tiene calificaciones', 409);
    }
    await evaluacionRepo.eliminar(evaluacion._id);
  };
