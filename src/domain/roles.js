// ─────────────────────────────────────────────────────────────
// CAPA DE DOMINIO: roles del sistema.
// El dominio no conoce Express ni MongoDB: son solo reglas del negocio.
// ─────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  ALUMNO: 'alumno',
  DOCENTE: 'docente',
  ADMIN: 'admin',
});

const LISTA_ROLES = Object.values(ROLES);

const esAdmin = (usuario) => usuario.rol === ROLES.ADMIN;
const esDocente = (usuario) => usuario.rol === ROLES.DOCENTE;
const esAlumno = (usuario) => usuario.rol === ROLES.ALUMNO;

// Compara dos ids sin importar si vienen como texto, como ObjectId
// o como un objeto "populado" ({ _id, nombre, ... }).
const mismoId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);

module.exports = { ROLES, LISTA_ROLES, esAdmin, esDocente, esAlumno, mismoId };
