// RUTAS: /api/evaluaciones
const express = require('express');
const { ROLES } = require('../domain/roles');

module.exports = (controller, { proteger, autorizar }) => {
  const router = express.Router();
  const docenteOAdmin = autorizar(ROLES.DOCENTE, ROLES.ADMIN);

  router.use(proteger);

  router.get('/', controller.listar);
  router.get('/:id', controller.obtener);
  // Además del rol, el caso de uso verifica que el docente dicte ESA materia
  router.post('/', docenteOAdmin, controller.crear);
  router.put('/:id', docenteOAdmin, controller.actualizar);
  router.delete('/:id', docenteOAdmin, controller.eliminar);

  return router;
};
