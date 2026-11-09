// CASO DE USO: listar evaluaciones (?materia=...&tipo=parcial).
// Sin materia, cada uno ve las de "sus" materias (el admin ve todas).
const { esAdmin, esDocente } = require('../../domain/roles');
const { TIPOS_EVALUACION } = require('../../domain/evaluacion');
const { verificarVerMateria } = require('../../domain/permisos');
const { textoQuery, validarEnum } = require('../../utils/validaciones');
const { buscarOFallar } = require('../compartidos');

module.exports =
  ({ evaluacionRepo, materiaRepo }) =>
  async ({ usuarioActual, query = {} }) => {
    const filtro = {};
    const materiaId = textoQuery(query.materia, 'materia');
    const tipo = textoQuery(query.tipo, 'tipo');
    if (tipo) filtro.tipo = validarEnum(tipo, TIPOS_EVALUACION, 'tipo');

    if (materiaId) {
      const materia = await buscarOFallar(materiaRepo, materiaId, 'Materia no encontrada', 'materia');
      verificarVerMateria(usuarioActual, materia);
      filtro.materia = materia._id;
    } else if (!esAdmin(usuarioActual)) {
      filtro.materias = esDocente(usuarioActual)
        ? await materiaRepo.idsDeDocente(usuarioActual._id)
        : await materiaRepo.idsDeAlumno(usuarioActual._id);
    }

    return evaluacionRepo.listar(filtro);
  };
