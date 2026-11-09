// Arma un "escenario" de prueba: contenedor con repositorios en memoria + datos cargados.
//   Programación II (docente Gómez) -> alumnos Ana y Juan
//   Bases de Datos  (docente Ruiz)  -> alumna Ana
const { crearContenedor } = require('../../src/container');
const { crearRepositoriosEnMemoria } = require('./repositoriosEnMemoria');

const PASSWORD = '123456';

// Servicios "falsos" y rápidos para los tests unitarios (no usan bcrypt ni JWT reales)
const serviciosFalsos = () => ({
  passwordService: {
    hashear: async (p) => `hash(${p})`,
    comparar: async (p, hash) => hash === `hash(${p})`,
  },
  tokenService: {
    generar: (u) => `token-de-${u._id}`,
    verificar: (token) => {
      if (!token.startsWith('token-de-')) throw new Error('token inválido');
      return { id: token.replace('token-de-', '') };
    },
  },
});

const crearEscenario = async (servicios = serviciosFalsos()) => {
  const repos = crearRepositoriosEnMemoria();
  const deps = { ...repos, ...servicios };
  const contenedor = crearContenedor(deps);

  const usuario = async (nombre, email, rol) =>
    repos.usuarioRepo.crear({ nombre, email, rol, password: await servicios.passwordService.hashear(PASSWORD) });

  const usuarios = {
    admin: await usuario('Admin General', 'admin@mail.com', 'admin'),
    gomez: await usuario('Laura Gómez', 'gomez@mail.com', 'docente'),
    ruiz: await usuario('Martín Ruiz', 'ruiz@mail.com', 'docente'),
    ana: await usuario('Ana Pérez', 'ana@mail.com', 'alumno'),
    juan: await usuario('Juan López', 'juan@mail.com', 'alumno'),
  };

  const materias = {
    prog: await repos.materiaRepo.crear({
      nombre: 'Programación II',
      codigo: 'PROG2',
      periodo: '2026-2C',
      docentes: [usuarios.gomez._id],
      alumnos: [usuarios.ana._id, usuarios.juan._id],
    }),
    bd: await repos.materiaRepo.crear({
      nombre: 'Bases de Datos',
      codigo: 'BD1',
      periodo: '2026-2C',
      docentes: [usuarios.ruiz._id],
      alumnos: [usuarios.ana._id],
    }),
  };

  const evaluaciones = {
    parcialProg: await repos.evaluacionRepo.crear({
      materia: materias.prog._id,
      titulo: 'Primer parcial',
      tipo: 'parcial',
      fecha: new Date('2026-09-15'),
      notaMaxima: 10,
    }),
    tpProg: await repos.evaluacionRepo.crear({
      materia: materias.prog._id,
      titulo: 'TP Integrador',
      tipo: 'trabajo_practico',
      fecha: new Date('2026-10-10'),
      notaMaxima: 100,
    }),
    parcialBd: await repos.evaluacionRepo.crear({
      materia: materias.bd._id,
      titulo: 'Parcial SQL',
      tipo: 'parcial',
      fecha: new Date('2026-09-22'),
      notaMaxima: 10,
    }),
  };

  return { contenedor, repos, servicios, usuarios, materias, evaluaciones, PASSWORD };
};

module.exports = { crearEscenario, serviciosFalsos, PASSWORD };
