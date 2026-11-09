// Funciones de ayuda que usan varios casos de uso.
const AppError = require('../utils/AppError');
const { validarId } = require('../utils/validaciones');

// Busca algo por id y, si no existe, corta con un 404.
const buscarOFallar = async (repositorio, id, mensaje, campo = 'id') => {
  validarId(id, campo);
  const encontrado = await repositorio.buscarPorId(id);
  if (!encontrado) throw new AppError(mensaje, 404);
  return encontrado;
};

// Verifica que todos los ids existan y sean usuarios con el rol pedido.
// Devuelve la lista sin repetidos.
const validarUsuariosConRol = async (usuarioRepo, ids, rol, campo) => {
  if (!Array.isArray(ids)) throw new AppError(`"${campo}" debe ser una lista de ids`, 400);
  ids.forEach((id) => validarId(id, campo));
  const unicos = [...new Set(ids.map(String))];
  const cantidad = await usuarioRepo.contarConRol(unicos, rol);
  if (cantidad !== unicos.length) {
    throw new AppError(`Todos los ids de "${campo}" deben ser usuarios con rol ${rol}`, 400);
  }
  return unicos;
};

const respuestaPaginada = ({ resultados, total }, { pagina, limite }) => ({
  total,
  pagina,
  totalPaginas: Math.ceil(total / limite),
  resultados,
});

module.exports = { buscarOFallar, validarUsuariosConRol, respuestaPaginada };
