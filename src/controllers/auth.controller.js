// ─────────────────────────────────────────────────────────────
// CONTROLADOR (capa de interfaz HTTP): Auth
// Un controlador NO tiene reglas de negocio. Solo:
//   1. toma los datos de la petición (body, params, query, usuario logueado)
//   2. llama al caso de uso
//   3. responde con el código HTTP y el JSON
// ─────────────────────────────────────────────────────────────
const catchAsync = require('../utils/catchAsync');
const { formatoUsuario } = require('../domain/usuario');
const { cuerpo } = require('./helpers');

module.exports = ({ registrarUsuario, iniciarSesion }) => ({
  // POST /api/auth/register
  register: catchAsync(async (req, res) => {
    const { token, usuario } = await registrarUsuario(cuerpo(req));
    res.status(201).json({ message: 'Usuario registrado correctamente', token, user: usuario });
  }),

  // POST /api/auth/login
  login: catchAsync(async (req, res) => {
    const { token, usuario } = await iniciarSesion(cuerpo(req));
    res.json({ message: 'Login exitoso', token, user: usuario });
  }),

  // GET /api/auth/me  (ruta protegida)
  me: (req, res) => res.json({ user: formatoUsuario(req.user) }),
});
