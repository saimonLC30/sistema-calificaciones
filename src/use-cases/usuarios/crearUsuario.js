// CASO DE USO (admin): crear un usuario con cualquier rol (por ejemplo, un docente).
const AppError = require('../../utils/AppError');
const { LISTA_ROLES, ROLES } = require('../../domain/roles');
const { validarDatosUsuario, formatoUsuario } = require('../../domain/usuario');
const { validarEnum } = require('../../utils/validaciones');

module.exports =
  ({ usuarioRepo, passwordService }) =>
  async ({ nombre, email, password, rol = ROLES.ALUMNO }) => {
    validarDatosUsuario({ nombre, email, password });
    validarEnum(rol, LISTA_ROLES, 'rol');

    if (await usuarioRepo.existeEmail(email)) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    const usuario = await usuarioRepo.crear({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: await passwordService.hashear(password),
      rol,
    });
    return formatoUsuario(usuario);
  };
