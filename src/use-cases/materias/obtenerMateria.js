// CASO DE USO: ver una materia.
// Regla: un alumno no ve la lista de compañeros (con sus emails).
const AppError = require('../../utils/AppError');
const { esAdmin, esDocente } = require('../../domain/roles');
const { verificarVerMateria } = require('../../domain/permisos');
const { validarId } = require('../../utils/validaciones');

const NO_ENCONTRADA = 'Materia no encontrada';

module.exports =
  ({ materiaRepo }) =>
  async ({ usuarioActual, id }) => {
    validarId(id, 'id');
    const materia = await materiaRepo.buscarDetalle(id);
    if (!materia) throw new AppError(NO_ENCONTRADA, 404);
    verificarVerMateria(usuarioActual, materia);

    if (esAdmin(usuarioActual) || esDocente(usuarioActual)) return materia;
    const { alumnos, ...vistaAlumno } = materia;
    return vistaAlumno;
  };
