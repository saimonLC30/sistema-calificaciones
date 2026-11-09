// CASO DE USO: listar materias.
// Admin: todas. Docente: las que dicta. Alumno: en las que está inscripto.
const { esAdmin, esDocente } = require('../../domain/roles');
const { textoQuery } = require('../../utils/validaciones');

module.exports =
  ({ materiaRepo }) =>
  async ({ usuarioActual, query = {} }) => {
    const filtro = {};
    const periodo = textoQuery(query.periodo, 'periodo');
    if (periodo) filtro.periodo = periodo.toUpperCase();

    if (esDocente(usuarioActual)) filtro.docente = usuarioActual._id;
    else if (!esAdmin(usuarioActual)) filtro.alumno = usuarioActual._id;

    return materiaRepo.listar(filtro);
  };
