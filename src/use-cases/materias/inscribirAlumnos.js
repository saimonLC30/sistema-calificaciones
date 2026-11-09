// CASO DE USO (admin): inscribir alumnos en una materia. Datos: { alumnos: [ids] }
// Si un alumno ya estaba inscripto, no se duplica.
const { ROLES } = require('../../domain/roles');
const { buscarOFallar, validarUsuariosConRol } = require('../compartidos');

const NO_ENCONTRADA = 'Materia no encontrada';

module.exports =
  ({ materiaRepo, usuarioRepo }) =>
  async ({ id, alumnos }) => {
    const materia = await buscarOFallar(materiaRepo, id, NO_ENCONTRADA);
    const ids = await validarUsuariosConRol(usuarioRepo, alumnos, ROLES.ALUMNO, 'alumnos');
    return materiaRepo.agregarAlumnos(materia._id, ids);
  };
