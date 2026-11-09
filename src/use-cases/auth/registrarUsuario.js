// CASO DE USO: un visitante se registra en el sistema.
// Regla: todo registro público es "alumno". El rol NO se toma de lo que manda el usuario.
//        Docentes y admins los crea un administrador.
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../domain/roles');
const { validarDatosUsuario, formatoUsuario } = require('../../domain/usuario');

// Las dependencias (repositorio y servicios) se reciben por parámetro: Inyección de Dependencias.
module.exports =
  ({ usuarioRepo, passwordService, tokenService }) =>
  async ({ nombre, email, password }) => {
    validarDatosUsuario({ nombre, email, password });

    if (await usuarioRepo.existeEmail(email)) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    const usuario = await usuarioRepo.crear({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: await passwordService.hashear(password),
      rol: ROLES.ALUMNO,
    });

    return { token: tokenService.generar(usuario), usuario: formatoUsuario(usuario) };
  };
