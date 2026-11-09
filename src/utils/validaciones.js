// Validaciones genéricas que usan varios casos de uso.
// No dependen de Express ni de MongoDB.
const AppError = require('./AppError');

// Un id de MongoDB (ObjectId) son 24 caracteres hexadecimales.
const ID_REGEX = /^[a-f\d]{24}$/i;

const validarId = (valor, campo) => {
  if (typeof valor !== 'string' || !ID_REGEX.test(valor)) {
    throw new AppError(`"${campo}" no es un id válido`, 400);
  }
  return valor;
};

// Los filtros de la URL tienen que ser texto simple.
// Esto evita que alguien mande ?estado[$ne]=x e inyecte operadores de Mongo.
const textoQuery = (valor, campo) => {
  if (valor === undefined || valor === '') return undefined;
  if (typeof valor !== 'string') {
    throw new AppError(`El filtro "${campo}" tiene un formato inválido`, 400);
  }
  return valor.trim();
};

const validarEnum = (valor, permitidos, campo) => {
  if (!permitidos.includes(valor)) {
    throw new AppError(`"${campo}" debe ser uno de: ${permitidos.join(', ')}`, 400);
  }
  return valor;
};

const validarFecha = (valor, campo) => {
  const fecha = new Date(valor);
  if (valor === null || valor === '' || typeof valor === 'boolean' || Number.isNaN(fecha.getTime())) {
    throw new AppError(`"${campo}" no es una fecha válida (usá AAAA-MM-DD)`, 400);
  }
  return fecha;
};

// Paginación: ?pagina=1&limite=20 (máximo 100 por página)
const paginacion = (query = {}) => {
  const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);
  const limite = Math.min(Math.max(parseInt(query.limite, 10) || 20, 1), 100);
  return { pagina, limite, saltar: (pagina - 1) * limite };
};

module.exports = { ID_REGEX, validarId, textoQuery, validarEnum, validarFecha, paginacion };
