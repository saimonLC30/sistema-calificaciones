// ─────────────────────────────────────────────────────────────
// CAPA DE DOMINIO: reglas sobre las materias (cursadas).
// Una materia es una cursada en un período: "Programación II - 2026-2C".
// ─────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');
const { mismoId } = require('./roles');

const PERIODO_REGEX = /^\d{4}-(1C|2C|ANUAL)$/;

const tieneDocente = (materia, usuarioId) => (materia.docentes || []).some((d) => mismoId(d, usuarioId));
const tieneAlumno = (materia, usuarioId) => (materia.alumnos || []).some((a) => mismoId(a, usuarioId));

const textoObligatorio = (valor, campo) => {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new AppError(`"${campo}" es obligatorio y debe ser texto`, 400);
  }
  return valor.trim();
};

const normalizarPeriodo = (periodo) => {
  const valor = textoObligatorio(periodo, 'periodo').toUpperCase();
  if (!PERIODO_REGEX.test(valor)) {
    throw new AppError('El período debe tener el formato AAAA-1C, AAAA-2C o AAAA-ANUAL', 400);
  }
  return valor;
};

// Valida y normaliza los datos de una materia.
// parcial = true se usa al modificar: solo se validan los campos que vienen.
const validarDatosMateria = ({ nombre, codigo, periodo }, { parcial = false } = {}) => {
  const datos = {};
  if (!parcial || nombre !== undefined) datos.nombre = textoObligatorio(nombre, 'nombre');
  if (!parcial || codigo !== undefined) datos.codigo = textoObligatorio(codigo, 'codigo').toUpperCase();
  if (!parcial || periodo !== undefined) datos.periodo = normalizarPeriodo(periodo);
  return datos;
};

module.exports = { PERIODO_REGEX, tieneDocente, tieneAlumno, validarDatosMateria, normalizarPeriodo };
