// CASO DE USO (admin): crear una materia. Datos: { nombre, codigo, periodo, docentes: [ids] }
const { ROLES } = require('../../domain/roles');
const { validarDatosMateria } = require('../../domain/materia');
const { validarUsuariosConRol } = require('../compartidos');

module.exports =
  ({ materiaRepo, usuarioRepo }) =>
  async ({ nombre, codigo, periodo, docentes = [] }) => {
    const datos = validarDatosMateria({ nombre, codigo, periodo });
    const docentesValidos = await validarUsuariosConRol(usuarioRepo, docentes, ROLES.DOCENTE, 'docentes');
    return materiaRepo.crear({ ...datos, docentes: docentesValidos });
  };
