// CASO DE USO: corregir una calificación. Datos: { nota?, fecha?, observaciones?, motivo? }
//
// Reglas de negocio:
//   - No se puede cambiar el alumno, la materia ni la evaluación.
//   - El estado se cambia con otro caso de uso (cambiarEstadoCalificacion).
//   - Una calificación anulada no se modifica.
//   - Si la nota ya estaba publicada y se cambia, pasa a "revisada" y el motivo es obligatorio.
//   - Todo cambio queda en el historial (quién, cuándo, nota anterior y nueva, motivo).
const AppError = require('../../utils/AppError');
const { verificarGestionarMateria } = require('../../domain/permisos');
const { ESTADOS_VISIBLES_ALUMNO, motivoValido, validarNota, validarFechaCalificacion } = require('../../domain/calificacion');
const { buscarCalificacionConMateria } = require('./comun');

module.exports =
  (deps) =>
  async ({ usuarioActual, id, nota, fecha, observaciones, motivo, alumno, evaluacion, materia: m, estado }) => {
    const { calificacionRepo, evaluacionRepo } = deps;
    const { calificacion, materia } = await buscarCalificacionConMateria(deps, id);
    verificarGestionarMateria(usuarioActual, materia);

    if (alumno !== undefined || evaluacion !== undefined || m !== undefined) {
      throw new AppError(
        'No se puede cambiar el alumno, la materia ni la evaluación. Eliminá la calificación y cargala de nuevo.',
        400
      );
    }
    if (estado !== undefined) {
      throw new AppError('Para cambiar el estado usá PATCH /api/calificaciones/:id/estado', 400);
    }
    if (calificacion.estado === 'anulada') {
      throw new AppError('Una calificación anulada no se puede modificar', 409);
    }

    const ev = await evaluacionRepo.buscarPorId(calificacion.evaluacion);
    const cambios = {};
    const estadoAnterior = calificacion.estado;
    const notaAnterior = calificacion.nota;

    if (nota !== undefined && nota !== notaAnterior) {
      validarNota(nota, ev.notaMaxima);
      if (ESTADOS_VISIBLES_ALUMNO.includes(estadoAnterior)) {
        if (!motivoValido(motivo)) {
          throw new AppError('Para modificar una nota ya publicada tenés que indicar el "motivo"', 400);
        }
        cambios.estado = 'revisada';
      }
      cambios.nota = nota;
    }
    if (fecha !== undefined) cambios.fecha = validarFechaCalificacion(fecha, ev.fecha);
    if (observaciones !== undefined) {
      if (typeof observaciones !== 'string' || observaciones.length > 500) {
        throw new AppError('Las observaciones deben ser texto de hasta 500 caracteres', 400);
      }
      cambios.observaciones = observaciones.trim();
    }

    const entradaHistorial = {
      accion: 'modificada',
      estadoAnterior,
      estadoNuevo: cambios.estado ?? estadoAnterior,
      notaAnterior,
      notaNueva: cambios.nota ?? notaAnterior,
      motivo: typeof motivo === 'string' ? motivo.trim() : undefined,
      usuario: usuarioActual._id,
      fecha: new Date(),
    };

    return calificacionRepo.guardar(calificacion._id, cambios, entradaHistorial);
  };
