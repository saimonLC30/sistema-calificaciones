// CASO DE USO: eliminar una calificación.
// Regla: un docente solo puede eliminar notas "pendiente" (si ya se publicó, hay que anularla
// para que quede registro). El admin puede eliminar cualquiera.
const AppError = require('../../utils/AppError');
const { esAdmin } = require('../../domain/roles');
const { verificarGestionarMateria } = require('../../domain/permisos');
const { buscarCalificacionConMateria } = require('./comun');

module.exports =
  (deps) =>
  async ({ usuarioActual, id }) => {
    const { calificacion, materia } = await buscarCalificacionConMateria(deps, id);
    verificarGestionarMateria(usuarioActual, materia);

    if (!esAdmin(usuarioActual) && calificacion.estado !== 'pendiente') {
      throw new AppError('Solo se pueden eliminar calificaciones pendientes. Si ya fue publicada, anulala.', 409);
    }
    await deps.calificacionRepo.eliminar(calificacion._id);
  };
