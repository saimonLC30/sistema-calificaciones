// ─────────────────────────────────────────────────────────────
// CAPA DE DOMINIO: reglas sobre las evaluaciones.
// Una evaluación es una instancia concreta: "Primer parcial" del 15/09.
// ─────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');
const { validarEnum, validarFecha } = require('../utils/validaciones');

const TIPOS_EVALUACION = ['parcial', 'recuperatorio', 'trabajo_practico', 'final', 'oral', 'otro'];
const NOTA_MAXIMA_POR_DEFECTO = 10;

const validarNotaMaxima = (valor) => {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 1 || valor > 100) {
    throw new AppError('La nota máxima debe ser un número entre 1 y 100', 400);
  }
  return valor;
};

// parcial = true se usa al modificar: solo se validan los campos que vienen.
const validarDatosEvaluacion = ({ titulo, tipo, fecha, notaMaxima, descripcion }, { parcial = false } = {}) => {
  const datos = {};

  if (!parcial || titulo !== undefined) {
    if (typeof titulo !== 'string' || !titulo.trim()) {
      throw new AppError('El título de la evaluación es obligatorio', 400);
    }
    datos.titulo = titulo.trim();
  }
  if (!parcial || tipo !== undefined) {
    if (tipo === undefined) throw new AppError('El tipo de evaluación es obligatorio', 400);
    datos.tipo = validarEnum(tipo, TIPOS_EVALUACION, 'tipo');
  }
  if (!parcial || fecha !== undefined) {
    if (fecha === undefined) throw new AppError('La fecha de la evaluación es obligatoria', 400);
    datos.fecha = validarFecha(fecha, 'fecha');
  }
  if (notaMaxima !== undefined) datos.notaMaxima = validarNotaMaxima(notaMaxima);
  else if (!parcial) datos.notaMaxima = NOTA_MAXIMA_POR_DEFECTO;

  if (descripcion !== undefined) {
    if (typeof descripcion !== 'string' || descripcion.length > 500) {
      throw new AppError('La descripción debe ser texto de hasta 500 caracteres', 400);
    }
    datos.descripcion = descripcion.trim();
  }
  return datos;
};

module.exports = { TIPOS_EVALUACION, NOTA_MAXIMA_POR_DEFECTO, validarDatosEvaluacion };
