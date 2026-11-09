// RUTAS: /api/auth
const express = require('express');

module.exports = (controller, { proteger }) => {
  const router = express.Router();

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.get('/me', proteger, controller.me);

  return router;
};
