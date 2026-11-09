// ─────────────────────────────────────────────────────────────
// CAPA DE INFRAESTRUCTURA: servicio de contraseñas (bcrypt).
// bcrypt agrega un "salt" aleatorio y es lento a propósito,
// así que aunque roben la base no pueden sacar las contraseñas fácilmente.
// ─────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');

module.exports = ({ rondas = 10 } = {}) => ({
  hashear: (password) => bcrypt.hash(password, rondas),
  comparar: (password, hash) => bcrypt.compare(password, hash),
});
