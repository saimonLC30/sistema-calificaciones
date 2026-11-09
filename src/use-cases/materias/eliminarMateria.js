// CASO DE USO (admin): eliminar una materia.
// Regla: no se puede si ya tiene evaluaciones.
const AppError = require('../../utils/AppError');
const { buscarOFallar } = require('../compartidos');

const NO_ENCONTRADA = 'Materia no encontrada';

module.exports =
  ({ materiaRepo, evaluacionRepo }) =>
  async ({ id }) => {
    const materia = await buscarOFallar(materiaRepo, id, NO_ENCONTRADA);
    if (await evaluacionRepo.existeEnMateria(materia._id)) {
      throw new AppError('No se puede eliminar una materia que tiene evaluaciones cargadas', 409);
    }
    await materiaRepo.eliminar(materia._id);
  };
