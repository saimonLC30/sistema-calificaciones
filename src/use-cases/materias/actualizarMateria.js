// CASO DE USO (admin): modificar una materia.
// Regla: no se puede cambiar el período si ya hay calificaciones cargadas.
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../domain/roles');
const { validarDatosMateria } = require('../../domain/materia');
const { buscarOFallar, validarUsuariosConRol } = require('../compartidos');

const NO_ENCONTRADA = 'Materia no encontrada';

module.exports =
  ({ materiaRepo, usuarioRepo, calificacionRepo }) =>
  async ({ id, nombre, codigo, periodo, docentes }) => {
    const materia = await buscarOFallar(materiaRepo, id, NO_ENCONTRADA);
    const cambios = validarDatosMateria({ nombre, codigo, periodo }, { parcial: true });

    if (cambios.periodo !== undefined && cambios.periodo !== materia.periodo) {
      if (await calificacionRepo.existeEnMateria(materia._id)) {
        throw new AppError('No se puede cambiar el período de una materia que ya tiene calificaciones', 409);
      }
    }
    if (docentes !== undefined) {
      cambios.docentes = await validarUsuariosConRol(usuarioRepo, docentes, ROLES.DOCENTE, 'docentes');
    }

    return materiaRepo.actualizar(materia._id, cambios);
  };
