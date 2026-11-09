// CASO DE USO: ver el historial académico de un alumno + su promedio por materia.
// También lo usa "mis calificaciones" (el alumno logueado viendo lo suyo).
//   alumno  -> solo el suyo, y solo notas publicadas o revisadas
//   docente -> las notas de ese alumno en las materias que dicta
//   admin   -> todo
const AppError = require('../../utils/AppError');
const { ROLES, esAlumno, esDocente, mismoId } = require('../../domain/roles');
const { ESTADOS_VISIBLES_ALUMNO, calcularPromediosPorMateria } = require('../../domain/calificacion');
const { validarId, textoQuery } = require('../../utils/validaciones');

module.exports =
  ({ calificacionRepo, materiaRepo, usuarioRepo }) =>
  async ({ usuarioActual, alumnoId, query = {} }) => {
    validarId(String(alumnoId), 'alumnoId');

    if (esAlumno(usuarioActual) && !mismoId(alumnoId, usuarioActual._id)) {
      throw new AppError('Solo podés ver tus propias calificaciones', 403);
    }

    const alumno = await usuarioRepo.buscarPorId(String(alumnoId));
    if (!alumno || alumno.rol !== ROLES.ALUMNO) throw new AppError('Alumno no encontrado', 404);

    const filtro = { alumno: alumno._id };
    const periodo = textoQuery(query.periodo, 'periodo');
    if (periodo) filtro.periodo = periodo.toUpperCase();

    if (esAlumno(usuarioActual)) {
      filtro.estados = ESTADOS_VISIBLES_ALUMNO;
    } else if (esDocente(usuarioActual)) {
      filtro.materias = await materiaRepo.idsDeDocente(usuarioActual._id);
    }

    const calificaciones = await calificacionRepo.listarDeAlumno(filtro);

    return {
      alumno: { id: alumno._id, nombre: alumno.nombre, email: alumno.email },
      total: calificaciones.length,
      porMateria: calcularPromediosPorMateria(calificaciones),
      calificaciones,
    };
  };
