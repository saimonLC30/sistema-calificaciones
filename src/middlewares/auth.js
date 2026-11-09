// ─────────────────────────────────────────────────────────────
// MIDDLEWARES DE SEGURIDAD
//   proteger      -> verifica el token JWT y carga req.user (401 si falla)
//   autorizar(..) -> deja pasar solo a ciertos roles (403 si no corresponde)
//
// Se usan en cadena en las rutas (patrón Chain of Responsibility):
//   router.post('/', proteger, autorizar('docente', 'admin'), controller.crear)
// ─────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');

// Recibe el caso de uso autenticarToken (inyección de dependencias)
module.exports = (autenticarToken) => {
  const proteger = async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const [tipo, token] = header.split(' ');
      req.user = await autenticarToken(tipo === 'Bearer' ? token : undefined);
      next();
    } catch (error) {
      next(error);
    }
  };

  // Restringe por rol: autorizar('docente', 'admin')
  const autorizar =
    (...roles) =>
    (req, res, next) => {
      if (!req.user || !roles.includes(req.user.rol)) {
        return next(new AppError('No tenés permisos para esta acción', 403));
      }
      next();
    };

  return { proteger, autorizar };
};
