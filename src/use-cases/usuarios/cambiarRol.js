// CASO DE USO (admin): cambiar el rol de un usuario.
// Regla: un admin no puede cambiarse su propio rol (para no quedarse sin admins por error).
const AppError = require('../../utils/AppError');
const { LISTA_ROLES, mismoId } = require('../../domain/roles');
const { formatoUsuario } = require('../../domain/usuario');
const { validarId, validarEnum } = require('../../utils/validaciones');

module.exports =
  ({ usuarioRepo }) =>
  async ({ usuarioActual, id, rol }) => {
    validarId(id, 'id');
    validarEnum(rol, LISTA_ROLES, 'rol');

    if (mismoId(id, usuarioActual._id)) {
      throw new AppError('No podés cambiar tu propio rol', 400);
    }

    const usuario = await usuarioRepo.actualizarRol(id, rol);
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    return formatoUsuario(usuario);
  };
