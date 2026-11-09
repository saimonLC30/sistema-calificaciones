// RUTAS: /api/usuarios — todo este módulo es solo para administradores
const express = require('express');
const { ROLES } = require('../domain/roles');

module.exports = (controller, { proteger, autorizar }) => {
  const router = express.Router();

  router.use(proteger, autorizar(ROLES.ADMIN));

  router.get('/', controller.listar);
  router.post('/', controller.crear);
  router.patch('/:id/rol', controller.cambiarRol);

  return router;
};
