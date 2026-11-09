// RUTAS: /api/materias
const express = require('express');
const { ROLES } = require('../domain/roles');

module.exports = (controller, { proteger, autorizar }) => {
  const router = express.Router();
  const soloAdmin = autorizar(ROLES.ADMIN);

  router.use(proteger);

  // Lectura: los tres roles (el caso de uso filtra según quién pregunta)
  router.get('/', controller.listar);
  router.get('/:id', controller.obtener);

  // Gestión de materias e inscripciones: solo admin
  router.post('/', soloAdmin, controller.crear);
  router.put('/:id', soloAdmin, controller.actualizar);
  router.delete('/:id', soloAdmin, controller.eliminar);
  router.post('/:id/alumnos', soloAdmin, controller.inscribirAlumnos);
  router.delete('/:id/alumnos/:alumnoId', soloAdmin, controller.desinscribirAlumno);

  return router;
};
