// CONTROLADOR (capa de interfaz HTTP): Usuarios (solo admin)
const catchAsync = require('../utils/catchAsync');
const { cuerpo } = require('./helpers');

module.exports = ({ listarUsuarios, crearUsuario, cambiarRol }) => ({
  // GET /api/usuarios?rol=docente&q=ana
  listar: catchAsync(async (req, res) => {
    res.json(await listarUsuarios({ query: req.query }));
  }),

  // POST /api/usuarios  { nombre, email, password, rol }
  crear: catchAsync(async (req, res) => {
    const user = await crearUsuario(cuerpo(req));
    res.status(201).json({ message: 'Usuario creado', user });
  }),

  // PATCH /api/usuarios/:id/rol  { rol }
  cambiarRol: catchAsync(async (req, res) => {
    const user = await cambiarRol({ usuarioActual: req.user, id: req.params.id, rol: cuerpo(req).rol });
    res.json({ message: 'Rol actualizado', user });
  }),
});
