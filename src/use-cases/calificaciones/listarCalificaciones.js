// CASO DE USO: listar calificaciones con filtros y paginación.
// Filtros: alumno, materia, docente, periodo, tipo, estado, desde, hasta, pagina, limite
//
// Lo que ve cada rol (se aplica SIEMPRE, encima de los filtros que mande el usuario):
//   admin   -> todas
//   docente -> solo las de las materias que dicta
//   alumno  -> solo las suyas, y solo publicadas o revisadas
const AppError = require('../../utils/AppError');
const { esAlumno, esDocente } = require('../../domain/roles');
const { TIPOS_EVALUACION } = require('../../domain/evaluacion');
const { ESTADOS, ESTADOS_VISIBLES_ALUMNO } = require('../../domain/calificacion');
const { validarId, textoQuery, validarEnum, validarFecha, paginacion } = require('../../utils/validaciones');
const { respuestaPaginada } = require('../compartidos');

const CAMPOS = ['alumno', 'materia', 'docente', 'periodo', 'tipo', 'estado', 'desde', 'hasta'];

// Pasa los parámetros de la URL a un filtro validado
const armarFiltro = (query) => {
  const q = {};
  CAMPOS.forEach((campo) => {
    q[campo] = textoQuery(query[campo], campo);
  });

  const filtro = {};
  if (q.alumno) filtro.alumno = validarId(q.alumno, 'alumno');
  if (q.materia) filtro.materia = validarId(q.materia, 'materia');
  if (q.docente) filtro.docente = validarId(q.docente, 'docente');
  if (q.periodo) filtro.periodo = q.periodo.toUpperCase();
  if (q.tipo) filtro.tipoEvaluacion = validarEnum(q.tipo, TIPOS_EVALUACION, 'tipo');
  if (q.estado) filtro.estado = validarEnum(q.estado, ESTADOS, 'estado');
  if (q.desde) filtro.desde = validarFecha(q.desde, 'desde');
  if (q.hasta) {
    const hasta = validarFecha(q.hasta, 'hasta');
    hasta.setUTCHours(23, 59, 59, 999); // incluye todo el día "hasta"
    filtro.hasta = hasta;
  }
  return filtro;
};

module.exports =
  ({ calificacionRepo, materiaRepo }) =>
  async ({ usuarioActual, query = {} }) => {
    const filtro = armarFiltro(query);
    const pag = paginacion(query);

    if (esAlumno(usuarioActual)) {
      filtro.alumno = usuarioActual._id;
      if (filtro.estado && !ESTADOS_VISIBLES_ALUMNO.includes(filtro.estado)) {
        return respuestaPaginada({ resultados: [], total: 0 }, pag);
      }
      if (!filtro.estado) filtro.estados = ESTADOS_VISIBLES_ALUMNO;
    } else if (esDocente(usuarioActual)) {
      const misMaterias = (await materiaRepo.idsDeDocente(usuarioActual._id)).map(String);
      if (filtro.materia) {
        if (!misMaterias.includes(filtro.materia)) throw new AppError('No sos docente de esa materia', 403);
      } else {
        filtro.materias = misMaterias;
      }
    }

    return respuestaPaginada(await calificacionRepo.listar(filtro, pag), pag);
  };
