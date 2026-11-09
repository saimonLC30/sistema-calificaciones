// RUTAS: /api/calificaciones
// Cada ruta es una cadena de middlewares: proteger -> autorizar(rol) -> controlador
const express = require('express');
const { ROLES } = require('../domain/roles');

module.exports = (controller, { proteger, autorizar }) => {
  const router = express.Router();
  const docenteOAdmin = autorizar(ROLES.DOCENTE, ROLES.ADMIN);

  // Todas las rutas requieren estar logueado
  router.use(proteger);

  // Lectura: los tres roles (cada caso de uso filtra según quién pregunta)
  router.get('/', controller.listar);
  router.get('/mis-calificaciones', autorizar(ROLES.ALUMNO), controller.misCalificaciones);
  router.get('/alumno/:alumnoId', controller.historialAlumno);
  router.get('/:id', controller.obtener);

  // Escritura: solo docentes y admin (además se verifica que el docente dicte la materia)
  router.post('/', docenteOAdmin, controller.crear);
  router.put('/:id', docenteOAdmin, controller.actualizar);
  router.patch('/:id/estado', docenteOAdmin, controller.cambiarEstado);
  router.delete('/:id', docenteOAdmin, controller.eliminar);

  return router;
};
