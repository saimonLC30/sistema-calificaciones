// ─────────────────────────────────────────────────────────────
// CAPA DE DOMINIO: reglas sobre las calificaciones.
// Acá están las reglas más importantes del negocio:
//   - qué estados existen y cómo se pasa de uno a otro (máquina de estados)
//   - qué estados ve un alumno
//   - cómo se valida una nota
//   - cómo se calcula el promedio
// Son funciones puras: fáciles de entender y de testear.
// ─────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');
const { validarFecha } = require('../utils/validaciones');

const ESTADOS = ['pendiente', 'publicada', 'revisada', 'anulada'];

// Qué cambios de estado están permitidos
//   pendiente -> la cargó el docente pero el alumno todavía no la ve
//   publicada -> el alumno ya la puede ver
//   revisada  -> se corrigió la nota después de publicarla (el alumno la ve)
//   anulada   -> queda sin efecto (estado final)
const TRANSICIONES = Object.freeze({
  pendiente: ['publicada', 'anulada'],
  publicada: ['revisada', 'anulada'],
  revisada: ['anulada'],
  anulada: [],
});

// Estados que un alumno puede ver
const ESTADOS_VISIBLES_ALUMNO = ['publicada', 'revisada'];

// Estados con los que se puede crear una calificación
const ESTADOS_INICIALES = ['pendiente', 'publicada'];

// Estados que exigen indicar un motivo
const ESTADOS_CON_MOTIVO = ['revisada', 'anulada'];

const puedePasarA = (estadoActual, nuevoEstado) => (TRANSICIONES[estadoActual] || []).includes(nuevoEstado);

const motivoValido = (motivo) => typeof motivo === 'string' && motivo.trim().length > 0;

// La nota tiene que ser un número entre 0 y la nota máxima de la evaluación,
// con 2 decimales como máximo (ej: 7.25).
const validarNota = (nota, notaMaxima) => {
  if (typeof nota !== 'number' || !Number.isFinite(nota)) {
    throw new AppError('La nota debe ser un número', 400);
  }
  if (nota < 0 || nota > notaMaxima) {
    throw new AppError(`La nota debe estar entre 0 y ${notaMaxima}`, 400);
  }
  // Se compara con un margen chico porque en JS 8.1 * 100 = 810.0000000000001
  if (Math.abs(Math.round(nota * 100) - nota * 100) > 1e-9) {
    throw new AppError('La nota puede tener como máximo 2 decimales', 400);
  }
  return nota;
};

// La fecha de la nota no puede ser futura ni anterior a la evaluación
const validarFechaCalificacion = (valor, fechaEvaluacion) => {
  const fecha = validarFecha(valor, 'fecha');
  if (fecha > new Date()) throw new AppError('La fecha de la calificación no puede ser futura', 400);
  const inicioEvaluacion = new Date(fechaEvaluacion);
  inicioEvaluacion.setUTCHours(0, 0, 0, 0);
  if (fecha < inicioEvaluacion) {
    throw new AppError('La fecha de la calificación no puede ser anterior a la de la evaluación', 400);
  }
  return fecha;
};

// Promedio por materia en escala 0-10 (por si alguna evaluación tiene nota
// máxima distinta de 10), sin contar las anuladas.
// Recibe calificaciones con "materia" y "evaluacion" populadas.
const calcularPromediosPorMateria = (calificaciones) => {
  const resumen = new Map();
  calificaciones.forEach((c) => {
    const clave = String(c.materia._id);
    if (!resumen.has(clave)) resumen.set(clave, { materia: c.materia, cantidad: 0, suma: 0 });
    if (c.estado !== 'anulada') {
      const item = resumen.get(clave);
      item.cantidad += 1;
      item.suma += (c.nota / c.evaluacion.notaMaxima) * 10;
    }
  });
  return [...resumen.values()].map(({ materia, cantidad, suma }) => ({
    materia,
    cantidadNotas: cantidad,
    promedio: cantidad ? Math.round((suma / cantidad) * 100) / 100 : null,
  }));
};

module.exports = {
  ESTADOS,
  TRANSICIONES,
  ESTADOS_VISIBLES_ALUMNO,
  ESTADOS_INICIALES,
  ESTADOS_CON_MOTIVO,
  puedePasarA,
  motivoValido,
  validarNota,
  validarFechaCalificacion,
  calcularPromediosPorMateria,
};
