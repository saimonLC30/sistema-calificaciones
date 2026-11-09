// ─────────────────────────────────────────────────────────────
// CAPA DE DOMINIO: reglas sobre los usuarios.
// ─────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72; // bcrypt solo usa los primeros 72 bytes

// Valida los datos de un usuario nuevo.
// Exigir que sean "string" evita inyecciones NoSQL del tipo { "email": { "$ne": null } }.
const validarDatosUsuario = ({ nombre, email, password }) => {
  if (!nombre || !email || !password) {
    throw new AppError('Nombre, email y contraseña son obligatorios', 400);
  }
  if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('Nombre, email y contraseña deben ser texto', 400);
  }
  if (!nombre.trim()) throw new AppError('El nombre es obligatorio', 400);
  if (!EMAIL_REGEX.test(email.trim())) throw new AppError('Email inválido', 400);
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new AppError(`La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`, 400);
  }
};

// Lo que se muestra de un usuario. NUNCA incluye la contraseña.
const formatoUsuario = (u) => ({ id: u._id, nombre: u.nombre, email: u.email, rol: u.rol });

module.exports = { validarDatosUsuario, formatoUsuario, EMAIL_REGEX, PASSWORD_MIN, PASSWORD_MAX };
