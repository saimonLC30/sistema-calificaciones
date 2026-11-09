// CASO DE USO: un usuario inicia sesión y recibe un token JWT.
const AppError = require('../../utils/AppError');
const { formatoUsuario } = require('../../domain/usuario');

module.exports =
  ({ usuarioRepo, passwordService, tokenService }) =>
  async ({ email, password }) => {
    if (!email || !password) {
      throw new AppError('Email y contraseña son obligatorios', 400);
    }
    // Si alguien manda { "email": { "$ne": null } } lo frenamos acá (inyección NoSQL)
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new AppError('Email y contraseña deben ser texto', 400);
    }

    const usuario = await usuarioRepo.buscarPorEmailConPassword(email.trim().toLowerCase());

    // Mismo mensaje en ambos casos para no revelar si el email existe o no
    if (!usuario || !(await passwordService.comparar(password, usuario.password))) {
      throw new AppError('Credenciales inválidas', 401);
    }

    return { token: tokenService.generar(usuario), usuario: formatoUsuario(usuario) };
  };
