// CASO DE USO: un docente (o el admin) registra la nota de un alumno en una evaluación.
// Datos: { alumno, evaluacion, nota, fecha?, observaciones?, estado? ('pendiente'|'publicada'), docente? (solo admin) }
//
// Reglas de negocio:
//   1. Solo un docente de esa materia o el admin puede cargarla.
//   2. El alumno tiene que estar inscripto en la materia.
//   3. La nota va de 0 a la nota máxima de la evaluación.
//   4. Un alumno tiene UNA sola nota por evaluación.
//   5. La materia se toma de la evaluación (así nunca quedan inconsistentes).
const AppError = require('../../utils/AppError');
const { ROLES, esAdmin } = require('../../domain/roles');
const { tieneAlumno, tieneDocente } = require('../../domain/materia');
const { verificarGestionarMateria } = require('../../domain/permisos');
const { ESTADOS_INICIALES, validarNota, validarFechaCalificacion } = require('../../domain/calificacion');
const { validarId, validarEnum } = require('../../utils/validaciones');
const { buscarOFallar } = require('../compartidos');

// Si la carga un docente, el responsable es él. Si es el admin, puede indicar cuál.
const elegirDocenteResponsable = (usuarioActual, materia, docente) => {
  if (!esAdmin(usuarioActual)) return usuarioActual._id;
  if (docente) {
    validarId(docente, 'docente');
    if (!tieneDocente(materia, docente)) throw new AppError('El docente indicado no dicta esta materia', 400);
    return docente;
  }
  if (materia.docentes.length > 0) return materia.docentes[0];
  throw new AppError('La materia no tiene docentes asignados: indicá "docente"', 400);
};

module.exports =
  ({ calificacionRepo, evaluacionRepo, materiaRepo, usuarioRepo }) =>
  async ({ usuarioActual, alumno, evaluacion: evaluacionId, nota, fecha, observaciones, estado = 'pendiente', docente }) => {
    if (!alumno || !evaluacionId || nota === undefined) {
      throw new AppError('alumno, evaluacion y nota son obligatorios', 400);
    }
    validarId(alumno, 'alumno');

    const evaluacion = await buscarOFallar(evaluacionRepo, evaluacionId, 'Evaluación no encontrada', 'evaluacion');
    const materia = await materiaRepo.buscarPorId(evaluacion.materia);
    if (!materia) throw new AppError('La materia de esta evaluación ya no existe', 404);

    verificarGestionarMateria(usuarioActual, materia); // regla 1

    const alumnoDoc = await usuarioRepo.buscarPorId(alumno);
    if (!alumnoDoc || alumnoDoc.rol !== ROLES.ALUMNO) throw new AppError('El alumno no existe', 404);
    if (!tieneAlumno(materia, alumno)) {
      throw new AppError('El alumno no está inscripto en la materia de esta evaluación', 400); // regla 2
    }

    validarNota(nota, evaluacion.notaMaxima); // regla 3
    const fechaFinal = fecha !== undefined ? validarFechaCalificacion(fecha, evaluacion.fecha) : new Date();
    validarEnum(estado, ESTADOS_INICIALES, 'estado');
    if (observaciones !== undefined && (typeof observaciones !== 'string' || observaciones.length > 500)) {
      throw new AppError('Las observaciones deben ser texto de hasta 500 caracteres', 400);
    }

    const docenteResponsable = elegirDocenteResponsable(usuarioActual, materia, docente);

    if (await calificacionRepo.existeDeAlumnoEnEvaluacion(alumno, evaluacion._id)) {
      throw new AppError(
        'El alumno ya tiene una calificación en esta evaluación. Modificala en lugar de crear otra.',
        409
      ); // regla 4
    }

    return calificacionRepo.crear({
      alumno,
      materia: materia._id, // regla 5
      evaluacion: evaluacion._id,
      docente: docenteResponsable,
      periodo: materia.periodo,
      tipoEvaluacion: evaluacion.tipo,
      nota,
      fecha: fechaFinal,
      observaciones: observaciones?.trim(),
      estado,
      historial: [{ accion: 'creada', estadoNuevo: estado, notaNueva: nota, usuario: usuarioActual._id, fecha: new Date() }],
    });
  };
