// ─────────────────────────────────────────────────────────────
// CONTROLADOR (capa de interfaz HTTP): Calificaciones
// Fijate que no hay ninguna regla de negocio acá: todo está en src/use-cases/calificaciones.
// IMPORTANTE: "usuarioActual" e "id" se ponen DESPUÉS del body, así nadie puede
// mandar en el JSON un "usuarioActual" falso y pisarlo.
// ─────────────────────────────────────────────────────────────
const catchAsync = require('../utils/catchAsync');
const { cuerpo } = require('./helpers');

module.exports = (casos) => ({
  // POST /api/calificaciones
  crear: catchAsync(async (req, res) => {
    const calificacion = await casos.crearCalificacion({ ...cuerpo(req), usuarioActual: req.user });
    res.status(201).json({ message: 'Calificación registrada', calificacion });
  }),

  // GET /api/calificaciones?materia=&estado=&...
  listar: catchAsync(async (req, res) => {
    res.json(await casos.listarCalificaciones({ usuarioActual: req.user, query: req.query }));
  }),

  // GET /api/calificaciones/alumno/:alumnoId
  historialAlumno: catchAsync(async (req, res) => {
    res.json(
      await casos.verHistorialAlumno({ usuarioActual: req.user, alumnoId: req.params.alumnoId, query: req.query })
    );
  }),

  // GET /api/calificaciones/mis-calificaciones  (el alumno logueado)
  misCalificaciones: catchAsync(async (req, res) => {
    res.json(
      await casos.verHistorialAlumno({ usuarioActual: req.user, alumnoId: String(req.user._id), query: req.query })
    );
  }),

  // GET /api/calificaciones/:id
  obtener: catchAsync(async (req, res) => {
    const calificacion = await casos.verCalificacion({ usuarioActual: req.user, id: req.params.id });
    res.json({ calificacion });
  }),

  // PUT /api/calificaciones/:id   { nota?, fecha?, observaciones?, motivo? }
  actualizar: catchAsync(async (req, res) => {
    const calificacion = await casos.modificarCalificacion({ ...cuerpo(req), usuarioActual: req.user, id: req.params.id });
    res.json({ message: 'Calificación actualizada', calificacion });
  }),

  // PATCH /api/calificaciones/:id/estado   { estado, motivo? }
  cambiarEstado: catchAsync(async (req, res) => {
    const { estado, motivo } = cuerpo(req);
    const calificacion = await casos.cambiarEstadoCalificacion({ usuarioActual: req.user, id: req.params.id, estado, motivo });
    res.json({ message: `Calificación ${calificacion.estado}`, calificacion });
  }),

  // DELETE /api/calificaciones/:id
  eliminar: catchAsync(async (req, res) => {
    await casos.eliminarCalificacion({ usuarioActual: req.user, id: req.params.id });
    res.json({ message: 'Calificación eliminada' });
  }),
});
