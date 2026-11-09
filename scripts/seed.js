// Carga datos de prueba para probar la API (y para la demo).
// Uso: npm run seed
// ⚠️ BORRA todos los usuarios, materias, evaluaciones y calificaciones de la base.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Materia = require('../src/models/Materia');
const Evaluacion = require('../src/models/Evaluacion');
const Calificacion = require('../src/models/Calificacion');
const crearPasswordService = require('../src/services/passwordService');

const PASSWORD = '123456';

const nota = (alumno, evaluacion, materia, docente, valor, estado, observaciones) => ({
  alumno: alumno._id,
  evaluacion: evaluacion._id,
  materia: materia._id,
  docente: docente._id,
  periodo: materia.periodo,
  tipoEvaluacion: evaluacion.tipo,
  nota: valor,
  fecha: evaluacion.fecha,
  estado,
  observaciones,
  historial: [{ accion: 'creada', estadoNuevo: estado, notaNueva: valor, usuario: docente._id }],
});

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado. Borrando datos anteriores...');

  await Promise.all([
    User.deleteMany({}),
    Materia.deleteMany({}),
    Evaluacion.deleteMany({}),
    Calificacion.deleteMany({}),
  ]);

  // La contraseña se guarda hasheada con bcrypt (igual que cuando se registra un usuario).
  // Cada hash tiene su propio "salt", así que aunque la contraseña sea la misma, el hash es distinto.
  const { hashear } = crearPasswordService();
  const admin = await User.create({ nombre: 'Admin General', email: 'admin@mail.com', password: await hashear(PASSWORD), rol: 'admin' });
  const profeGomez = await User.create({ nombre: 'Laura Gómez', email: 'gomez@mail.com', password: await hashear(PASSWORD), rol: 'docente' });
  const profeRuiz = await User.create({ nombre: 'Martín Ruiz', email: 'ruiz@mail.com', password: await hashear(PASSWORD), rol: 'docente' });
  const ana = await User.create({ nombre: 'Ana Pérez', email: 'ana@mail.com', password: await hashear(PASSWORD) });
  const juan = await User.create({ nombre: 'Juan López', email: 'juan@mail.com', password: await hashear(PASSWORD) });
  const sofi = await User.create({ nombre: 'Sofía Díaz', email: 'sofia@mail.com', password: await hashear(PASSWORD) });

  const prog = await Materia.create({
    nombre: 'Programación II',
    codigo: 'PROG2',
    periodo: '2026-2C',
    docentes: [profeGomez._id],
    alumnos: [ana._id, juan._id, sofi._id],
  });
  const bd = await Materia.create({
    nombre: 'Bases de Datos',
    codigo: 'BD1',
    periodo: '2026-2C',
    docentes: [profeRuiz._id],
    alumnos: [ana._id, juan._id],
  });

  const parcial1 = await Evaluacion.create({ materia: prog._id, titulo: 'Primer parcial', tipo: 'parcial', fecha: '2026-09-15' });
  const tp1 = await Evaluacion.create({ materia: prog._id, titulo: 'TP Integrador', tipo: 'trabajo_practico', fecha: '2026-10-10' });
  const parcialBd = await Evaluacion.create({ materia: bd._id, titulo: 'Parcial SQL', tipo: 'parcial', fecha: '2026-09-22' });

  await Calificacion.insertMany([
    nota(ana, parcial1, prog, profeGomez, 8, 'publicada', 'Muy buen desarrollo'),
    nota(juan, parcial1, prog, profeGomez, 5, 'publicada', 'Repasar recursión'),
    nota(sofi, parcial1, prog, profeGomez, 9.5, 'publicada'),
    nota(ana, tp1, prog, profeGomez, 9, 'pendiente'),
    nota(ana, parcialBd, bd, profeRuiz, 7, 'publicada'),
    nota(juan, parcialBd, bd, profeRuiz, 6, 'pendiente'),
  ]);

  console.log('\n✅ Datos cargados. Todos los usuarios tienen la contraseña:', PASSWORD);
  console.table([
    { rol: 'admin', email: admin.email },
    { rol: 'docente (Programación II)', email: profeGomez.email },
    { rol: 'docente (Bases de Datos)', email: profeRuiz.email },
    { rol: 'alumno', email: ana.email },
    { rol: 'alumno', email: juan.email },
    { rol: 'alumno', email: sofi.email },
  ]);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
