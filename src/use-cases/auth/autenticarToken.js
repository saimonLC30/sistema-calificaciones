// CASO DE USO: verificar el token de una petición y obtener el usuario logueado.
// Lo usa el middleware proteger().
const AppError = require('../../utils/AppError');

module.exports =
  ({ usuarioRepo, tokenService }) =>
  async (token) => {
    if (!token) throw new AppError('No autorizado: falta el token', 401);

    let datos;
    try {
      datos = tokenService.verificar(token);
    } catch (error) {
      throw new AppError('Token inválido o expirado', 401);
    }

    const usuario = await usuarioRepo.buscarPorId(datos.id);
    if (!usuario) throw new AppError('El usuario ya no existe', 401);
    return usuario;
  };
