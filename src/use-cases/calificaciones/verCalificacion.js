// CASO DE USO: ver el detalle de una calificación (con su historial de cambios).
// El alumno solo ve las suyas publicadas/revisadas, y sin el historial interno.
const { esAlumno } = require('../../domain/roles');
const { verificarVerCalificacion } = require('../../domain/permisos');
const { buscarCalificacionConMateria, vistaAlumno } = require('./comun');

module.exports =
  (deps) =>
  async ({ usuarioActual, id }) => {
    const { calificacion, materia } = await buscarCalificacionConMateria(deps, id);
    verificarVerCalificacion(usuarioActual, calificacion, materia);

    const detalle = await deps.calificacionRepo.buscarDetalle(calificacion._id);
    return esAlumno(usuarioActual) ? vistaAlumno(detalle) : detalle;
  };
