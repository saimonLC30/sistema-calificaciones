// CASO DE USO (docente de la materia o admin): modificar una evaluación.
// Reglas: no se puede mover a otra materia; si ya hay notas, la nota máxima
// no puede quedar por debajo de la nota más alta cargada.
const AppError = require('../../utils/AppError');
const { mismoId } = require('../../domain/roles');
const { validarDatosEvaluacion } = require('../../domain/evaluacion');
const { verificarGestionarMateria } = require('../../domain/permisos');
const { resumenMateria, buscarConMateria } = require('./comun');

module.exports =
  (deps) =>
  async ({ usuarioActual, id, materia: otraMateria, ...resto }) => {
    const { evaluacionRepo, calificacionRepo } = deps;
    const { evaluacion, materia } = await buscarConMateria(deps, id);
    verificarGestionarMateria(usuarioActual, materia);

    if (otraMateria !== undefined && !mismoId(otraMateria, materia._id)) {
      throw new AppError('No se puede mover una evaluación a otra materia', 400);
    }

    const cambios = validarDatosEvaluacion(resto, { parcial: true });

    if (cambios.notaMaxima !== undefined) {
      const masAlta = await calificacionRepo.notaMasAlta(evaluacion._id);
      if (masAlta !== null && cambios.notaMaxima < masAlta) {
        throw new AppError(`Ya hay una nota de ${masAlta}: la nota máxima no puede ser menor`, 409);
      }
    }

    const actualizada = await evaluacionRepo.actualizar(evaluacion._id, cambios);

    // Mantenemos sincronizado el tipo que se copia en las calificaciones
    if (cambios.tipo !== undefined) {
      await calificacionRepo.actualizarTipoPorEvaluacion(evaluacion._id, cambios.tipo);
    }

    return { ...actualizada, materia: resumenMateria(materia) };
  };
