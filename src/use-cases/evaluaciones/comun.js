// Ayudas que comparten los casos de uso de evaluaciones.
const AppError = require('../../utils/AppError');
const { buscarOFallar } = require('../compartidos');

const NO_ENCONTRADA = 'Evaluación no encontrada';

// Lo que se muestra de la materia dentro de una evaluación (sin listas de alumnos)
const resumenMateria = (m) => ({ _id: m._id, nombre: m.nombre, codigo: m.codigo, periodo: m.periodo });

// Busca la evaluación y su materia (la materia se necesita para chequear permisos)
const buscarConMateria = async ({ evaluacionRepo, materiaRepo }, id) => {
  const evaluacion = await buscarOFallar(evaluacionRepo, id, NO_ENCONTRADA);
  const materia = await materiaRepo.buscarPorId(evaluacion.materia);
  if (!materia) throw new AppError('La materia de esta evaluación ya no existe', 404);
  return { evaluacion, materia };
};

module.exports = { resumenMateria, buscarConMateria };
