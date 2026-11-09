// CASO DE USO (docente de la materia o admin): crear una evaluación.
// Datos: { materia, titulo, tipo, fecha, notaMaxima?, descripcion? }
const AppError = require('../../utils/AppError');
const { validarDatosEvaluacion } = require('../../domain/evaluacion');
const { verificarGestionarMateria } = require('../../domain/permisos');
const { buscarOFallar } = require('../compartidos');
const { resumenMateria } = require('./comun');

module.exports =
  ({ evaluacionRepo, materiaRepo }) =>
  async ({ usuarioActual, materia: materiaId, ...resto }) => {
    if (!materiaId) throw new AppError('La materia es obligatoria', 400);
    const materia = await buscarOFallar(materiaRepo, materiaId, 'Materia no encontrada', 'materia');
    verificarGestionarMateria(usuarioActual, materia);

    const datos = validarDatosEvaluacion(resto);
    const evaluacion = await evaluacionRepo.crear({ ...datos, materia: materia._id });
    return { ...evaluacion, materia: resumenMateria(materia) };
  };
