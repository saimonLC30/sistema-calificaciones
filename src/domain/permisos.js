// ─────────────────────────────────────────────────────────────
// CAPA DE DOMINIO: "quién puede hacer qué" sobre la información académica.
// Todas las reglas de permisos están en un solo lugar.
// (El middleware autorizar() solo mira el rol; acá se mira además
//  si el docente dicta ESA materia o si la nota es de ESE alumno.)
// ─────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');
const { esAdmin, esDocente, esAlumno, mismoId } = require('./roles');
const { tieneDocente, tieneAlumno } = require('./materia');
const { ESTADOS_VISIBLES_ALUMNO } = require('./calificacion');

// ¿Puede ver la materia? Admin: todas. Docente: las que dicta. Alumno: en las que está inscripto.
const puedeVerMateria = (usuario, materia) =>
  esAdmin(usuario) ||
  (esDocente(usuario) && tieneDocente(materia, usuario._id)) ||
  (esAlumno(usuario) && tieneAlumno(materia, usuario._id));

const verificarVerMateria = (usuario, materia) => {
  if (!puedeVerMateria(usuario, materia)) {
    throw new AppError('No tenés acceso a esta materia', 403);
  }
};

// ¿Puede gestionar (crear/modificar) evaluaciones y notas de la materia?
// Solo el admin o un docente de esa materia.
const verificarGestionarMateria = (usuario, materia) => {
  if (esAdmin(usuario)) return;
  if (esDocente(usuario) && tieneDocente(materia, usuario._id)) return;
  throw new AppError('Solo un docente de esta materia o un administrador puede hacer esto', 403);
};

// ¿Puede ver esta calificación puntual?
const verificarVerCalificacion = (usuario, calificacion, materia) => {
  if (esAdmin(usuario)) return;
  if (esDocente(usuario) && tieneDocente(materia, usuario._id)) return;
  if (
    esAlumno(usuario) &&
    mismoId(calificacion.alumno, usuario._id) &&
    ESTADOS_VISIBLES_ALUMNO.includes(calificacion.estado)
  ) {
    return;
  }
  throw new AppError('No tenés acceso a esta calificación', 403);
};

module.exports = { puedeVerMateria, verificarVerMateria, verificarGestionarMateria, verificarVerCalificacion };
