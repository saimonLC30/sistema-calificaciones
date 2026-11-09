// CONTROLADOR (capa de interfaz HTTP): Materias
const catchAsync = require('../utils/catchAsync');
const { cuerpo } = require('./helpers');

module.exports = (casos) => ({
  // POST /api/materias  (admin)  { nombre, codigo, periodo, docentes: [ids] }
  crear: catchAsync(async (req, res) => {
    const materia = await casos.crearMateria(cuerpo(req));
    res.status(201).json({ message: 'Materia creada', materia });
  }),

  // GET /api/materias?periodo=2026-2C
  listar: catchAsync(async (req, res) => {
    const resultados = await casos.listarMaterias({ usuarioActual: req.user, query: req.query });
    res.json({ total: resultados.length, resultados });
  }),

  // GET /api/materias/:id
  obtener: catchAsync(async (req, res) => {
    const materia = await casos.obtenerMateria({ usuarioActual: req.user, id: req.params.id });
    res.json({ materia });
  }),

  // PUT /api/materias/:id  (admin)
  actualizar: catchAsync(async (req, res) => {
    const materia = await casos.actualizarMateria({ ...cuerpo(req), id: req.params.id });
    res.json({ message: 'Materia actualizada', materia });
  }),

  // DELETE /api/materias/:id  (admin)
  eliminar: catchAsync(async (req, res) => {
    await casos.eliminarMateria({ id: req.params.id });
    res.json({ message: 'Materia eliminada' });
  }),

  // POST /api/materias/:id/alumnos  (admin)  { alumnos: [ids] }
  inscribirAlumnos: catchAsync(async (req, res) => {
    const materia = await casos.inscribirAlumnos({ id: req.params.id, alumnos: cuerpo(req).alumnos });
    res.json({ message: 'Alumnos inscriptos', materia });
  }),

  // DELETE /api/materias/:id/alumnos/:alumnoId  (admin)
  desinscribirAlumno: catchAsync(async (req, res) => {
    await casos.desinscribirAlumno({ id: req.params.id, alumnoId: req.params.alumnoId });
    res.json({ message: 'Alumno desinscripto' });
  }),
});
