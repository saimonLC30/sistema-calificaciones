// CASO DE USO: ver una evaluación (solo si se tiene acceso a su materia).
const { verificarVerMateria } = require('../../domain/permisos');
const { resumenMateria, buscarConMateria } = require('./comun');

module.exports =
  (deps) =>
  async ({ usuarioActual, id }) => {
    const { evaluacion, materia } = await buscarConMateria(deps, id);
    verificarVerMateria(usuarioActual, materia);
    return { ...evaluacion, materia: resumenMateria(materia) };
  };
