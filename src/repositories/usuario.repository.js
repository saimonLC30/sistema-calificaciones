// ─────────────────────────────────────────────────────────────
// CAPA DE INFRAESTRUCTURA — Patrón Repository
// El ÚNICO lugar que habla con MongoDB para los usuarios.
// Los casos de uso llaman a estas funciones sin saber que existe Mongoose,
// por eso en los tests se puede usar un repositorio "en memoria" con las mismas funciones.
//
// Todas devuelven objetos planos (.lean()) y NUNCA la contraseña,
// salvo buscarPorEmailConPassword (que solo usa el login).
// ─────────────────────────────────────────────────────────────
const User = require('../models/User');

// Escapa caracteres especiales para usar un texto dentro de una RegExp (evita ReDoS / inyección)
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const usuarioRepo = {
  buscarPorId: (id) => User.findById(id).lean(),

  buscarPorEmailConPassword: (email) => User.findOne({ email: String(email).toLowerCase() }).select('+password').lean(),

  existeEmail: async (email) => Boolean(await User.exists({ email: String(email).trim().toLowerCase() })),

  // Recibe la contraseña YA hasheada
  crear: async (datos) => {
    const { password, ...usuario } = (await User.create(datos)).toObject();
    return usuario;
  },

  // filtro: { rol?, texto? }  ·  paginación: { saltar, limite }
  listar: async ({ rol, texto }, { saltar, limite }) => {
    const consulta = {};
    if (rol) consulta.rol = rol;
    if (texto) {
      const regex = new RegExp(escaparRegex(texto), 'i');
      consulta.$or = [{ nombre: regex }, { email: regex }];
    }
    const [resultados, total] = await Promise.all([
      User.find(consulta).sort({ nombre: 1 }).skip(saltar).limit(limite).lean(),
      User.countDocuments(consulta),
    ]);
    return { resultados, total };
  },

  actualizarRol: (id, rol) => User.findByIdAndUpdate(id, { rol }, { new: true, runValidators: true }).lean(),

  contarConRol: (ids, rol) => User.countDocuments({ _id: { $in: ids }, rol }),
};

module.exports = usuarioRepo;
