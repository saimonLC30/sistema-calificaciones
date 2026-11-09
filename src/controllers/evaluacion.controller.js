// CONTROLADOR (capa de interfaz HTTP): Evaluaciones
const catchAsync = require('../utils/catchAsync');
const { cuerpo } = require('./helpers');

module.exports = (casos) => ({
  // POST /api/evaluaciones  { materia, titulo, tipo, fecha, notaMaxima, descripcion }
  crear: catchAsync(async (req, res) => {
    const evaluacion = await casos.crearEvaluacion({ ...cuerpo(req), usuarioActual: req.user });
    res.status(201).json({ message: 'Evaluación creada', evaluacion });
  }),

  // GET /api/evaluaciones?materia=...&tipo=parcial
  listar: catchAsync(async (req, res) => {
    const resultados = await casos.listarEvaluaciones({ usuarioActual: req.user, query: req.query });
    res.json({ total: resultados.length, resultados });
  }),

  // GET /api/evaluaciones/:id
  obtener: catchAsync(async (req, res) => {
    const evaluacion = await casos.obtenerEvaluacion({ usuarioActual: req.user, id: req.params.id });
    res.json({ evaluacion });
  }),

  // PUT /api/evaluaciones/:id
  actualizar: catchAsync(async (req, res) => {
    const evaluacion = await casos.actualizarEvaluacion({ ...cuerpo(req), usuarioActual: req.user, id: req.params.id });
    res.json({ message: 'Evaluación actualizada', evaluacion });
  }),

  // DELETE /api/evaluaciones/:id
  eliminar: catchAsync(async (req, res) => {
    await casos.eliminarEvaluacion({ usuarioActual: req.user, id: req.params.id });
    res.json({ message: 'Evaluación eliminada' });
  }),
});
