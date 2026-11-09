// ─────────────────────────────────────────────────────────────
// CONTENEDOR DE DEPENDENCIAS ("Composition Root")
// Es el único lugar donde se "enchufan" las piezas:
//   casos de uso  <-  repositorios + servicios
//
// En producción se usan los repositorios de MongoDB (crearContenedorMongo).
// En los tests se usan repositorios en memoria con las MISMAS funciones,
// y los casos de uso ni se enteran. Eso es la Inyección de Dependencias.
// ─────────────────────────────────────────────────────────────

// Auth
const registrarUsuario = require('./use-cases/auth/registrarUsuario');
const iniciarSesion = require('./use-cases/auth/iniciarSesion');
const autenticarToken = require('./use-cases/auth/autenticarToken');
// Usuarios
const listarUsuarios = require('./use-cases/usuarios/listarUsuarios');
const crearUsuario = require('./use-cases/usuarios/crearUsuario');
const cambiarRol = require('./use-cases/usuarios/cambiarRol');
// Materias
const crearMateria = require('./use-cases/materias/crearMateria');
const listarMaterias = require('./use-cases/materias/listarMaterias');
const obtenerMateria = require('./use-cases/materias/obtenerMateria');
const actualizarMateria = require('./use-cases/materias/actualizarMateria');
const eliminarMateria = require('./use-cases/materias/eliminarMateria');
const inscribirAlumnos = require('./use-cases/materias/inscribirAlumnos');
const desinscribirAlumno = require('./use-cases/materias/desinscribirAlumno');
// Evaluaciones
const crearEvaluacion = require('./use-cases/evaluaciones/crearEvaluacion');
const listarEvaluaciones = require('./use-cases/evaluaciones/listarEvaluaciones');
const obtenerEvaluacion = require('./use-cases/evaluaciones/obtenerEvaluacion');
const actualizarEvaluacion = require('./use-cases/evaluaciones/actualizarEvaluacion');
const eliminarEvaluacion = require('./use-cases/evaluaciones/eliminarEvaluacion');
// Calificaciones
const crearCalificacion = require('./use-cases/calificaciones/crearCalificacion');
const listarCalificaciones = require('./use-cases/calificaciones/listarCalificaciones');
const verHistorialAlumno = require('./use-cases/calificaciones/verHistorialAlumno');
const verCalificacion = require('./use-cases/calificaciones/verCalificacion');
const modificarCalificacion = require('./use-cases/calificaciones/modificarCalificacion');
const cambiarEstadoCalificacion = require('./use-cases/calificaciones/cambiarEstadoCalificacion');
const eliminarCalificacion = require('./use-cases/calificaciones/eliminarCalificacion');

// deps = { usuarioRepo, materiaRepo, evaluacionRepo, calificacionRepo, passwordService, tokenService }
const crearContenedor = (deps) => ({
  auth: {
    registrarUsuario: registrarUsuario(deps),
    iniciarSesion: iniciarSesion(deps),
    autenticarToken: autenticarToken(deps),
  },
  usuarios: {
    listarUsuarios: listarUsuarios(deps),
    crearUsuario: crearUsuario(deps),
    cambiarRol: cambiarRol(deps),
  },
  materias: {
    crearMateria: crearMateria(deps),
    listarMaterias: listarMaterias(deps),
    obtenerMateria: obtenerMateria(deps),
    actualizarMateria: actualizarMateria(deps),
    eliminarMateria: eliminarMateria(deps),
    inscribirAlumnos: inscribirAlumnos(deps),
    desinscribirAlumno: desinscribirAlumno(deps),
  },
  evaluaciones: {
    crearEvaluacion: crearEvaluacion(deps),
    listarEvaluaciones: listarEvaluaciones(deps),
    obtenerEvaluacion: obtenerEvaluacion(deps),
    actualizarEvaluacion: actualizarEvaluacion(deps),
    eliminarEvaluacion: eliminarEvaluacion(deps),
  },
  calificaciones: {
    crearCalificacion: crearCalificacion(deps),
    listarCalificaciones: listarCalificaciones(deps),
    verHistorialAlumno: verHistorialAlumno(deps),
    verCalificacion: verCalificacion(deps),
    modificarCalificacion: modificarCalificacion(deps),
    cambiarEstadoCalificacion: cambiarEstadoCalificacion(deps),
    eliminarCalificacion: eliminarCalificacion(deps),
  },
});

// Versión "real": MongoDB + bcrypt + JWT
const crearContenedorMongo = ({ jwtSecreto, jwtExpiraEn }) => {
  /* eslint-disable global-require */
  const crearTokenService = require('./services/tokenService');
  const crearPasswordService = require('./services/passwordService');

  return crearContenedor({
    usuarioRepo: require('./repositories/usuario.repository'),
    materiaRepo: require('./repositories/materia.repository'),
    evaluacionRepo: require('./repositories/evaluacion.repository'),
    calificacionRepo: require('./repositories/calificacion.repository'),
    passwordService: crearPasswordService(),
    tokenService: crearTokenService({ secreto: jwtSecreto, expiraEn: jwtExpiraEn }),
  });
};

module.exports = { crearContenedor, crearContenedorMongo };
