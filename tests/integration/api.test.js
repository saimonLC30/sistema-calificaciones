// ─────────────────────────────────────────────────────────────
// TESTS DE INTEGRACIÓN: prueban la API entera por HTTP (rutas, middlewares,
// controladores, casos de uso y errores), con Supertest.
// Se usa bcrypt y JWT reales; solo la base de datos se reemplaza por
// repositorios en memoria, así los tests corren en cualquier PC sin MongoDB.
// ─────────────────────────────────────────────────────────────
const request = require('supertest');
const crearApp = require('../../src/app');
const crearTokenService = require('../../src/services/tokenService');
const crearPasswordService = require('../../src/services/passwordService');
const { crearEscenario } = require('../helpers/escenario');

const SECRETO = 'secreto-solo-para-tests-con-mas-de-32-caracteres';

const serviciosReales = () => ({
  passwordService: crearPasswordService({ rondas: 4 }), // pocas rondas para que los tests sean rápidos
  tokenService: crearTokenService({ secreto: SECRETO }),
});

let e;
let app;

beforeEach(async () => {
  e = await crearEscenario(serviciosReales());
  app = crearApp(e.contenedor, { activarLimites: false });
});

const login = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: e.PASSWORD });
  return res.body.token;
};

describe('Auth', () => {
  test('POST /api/auth/login con datos correctos devuelve un token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'gomez@mail.com', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ email: 'gomez@mail.com', rol: 'docente' });
    expect(res.body.user.password).toBeUndefined();
  });

  test('POST /api/auth/login con contraseña incorrecta da 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'gomez@mail.com', password: 'mal' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  test('POST /api/auth/register ignora el rol que manda el usuario', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Hacker', email: 'hacker@mail.com', password: '123456', rol: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.rol).toBe('alumno');
  });

  test('GET /api/auth/me devuelve el usuario del token', async () => {
    const token = await login('ana@mail.com');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ana@mail.com');
  });
});

describe('Seguridad', () => {
  test('sin token -> 401', async () => {
    const res = await request(app).get('/api/calificaciones');
    expect(res.status).toBe(401);
  });

  test('con un token modificado -> 401', async () => {
    const token = await login('ana@mail.com');
    const trucho = `${token.slice(0, -2)}xx`;
    const res = await request(app).get('/api/calificaciones').set('Authorization', `Bearer ${trucho}`);
    expect(res.status).toBe(401);
  });

  test('con un token firmado con otro secreto -> 401', async () => {
    const otro = crearTokenService({ secreto: 'otro-secreto-distinto-tambien-de-mas-de-32-caracteres' });
    const token = otro.generar({ _id: e.usuarios.admin._id, rol: 'admin' });
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('un alumno no puede entrar a /api/usuarios -> 403', async () => {
    const token = await login('ana@mail.com');
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('el admin sí, y nunca se devuelven contraseñas', async () => {
    const token = await login('admin@mail.com');
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    res.body.resultados.forEach((u) => expect(u.password).toBeUndefined());
  });

  test('frena inyección NoSQL en los filtros (?estado[$ne]=x) -> 400', async () => {
    const token = await login('gomez@mail.com');
    const res = await request(app).get('/api/calificaciones?estado[$ne]=x').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('no se puede "pisar" el usuario logueado mandándolo en el body', async () => {
    const token = await login('ruiz@mail.com'); // Ruiz NO dicta Programación II
    const res = await request(app)
      .post('/api/calificaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usuarioActual: { _id: e.usuarios.admin._id, rol: 'admin' }, // intento de hacerse pasar por admin
        alumno: e.usuarios.ana._id,
        evaluacion: e.evaluaciones.parcialProg._id,
        nota: 10,
      });
    expect(res.status).toBe(403);
  });

  test('headers de seguridad de helmet y sin "x-powered-by"', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('CORS: solo responde a los orígenes permitidos', async () => {
    const appConCors = crearApp(e.contenedor, { activarLimites: false, origenesPermitidos: ['http://localhost:5173'] });
    const permitido = await request(appConCors).get('/').set('Origin', 'http://localhost:5173');
    const extrano = await request(appConCors).get('/').set('Origin', 'http://sitio-malicioso.com');
    expect(permitido.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(extrano.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('rate limit: después de varios logins fallidos responde 429', async () => {
    const appConLimite = crearApp(e.contenedor, { limiteIntentosLogin: 3 });
    const intento = () => request(appConLimite).post('/api/auth/login').send({ email: 'gomez@mail.com', password: 'mal' });
    expect((await intento()).status).toBe(401);
    expect((await intento()).status).toBe(401);
    expect((await intento()).status).toBe(401);
    expect((await intento()).status).toBe(429);
  });

  test('JSON mal formado -> 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
  });

  test('body demasiado grande -> 413', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@mail.com', password: 'a'.repeat(20000) });
    expect(res.status).toBe(413);
  });

  test('GET /api/salud informa si la base responde', async () => {
    const sinBase = await request(app).get('/api/salud');
    expect(sinBase.body).toMatchObject({ estado: 'ok', baseDeDatos: 'no configurada' });

    const conBase = crearApp(e.contenedor, { activarLimites: false, verificarBaseDeDatos: async () => {} });
    expect((await request(conBase).get('/api/salud')).body.baseDeDatos).toBe('conectada');

    const caida = crearApp(e.contenedor, {
      activarLimites: false,
      verificarBaseDeDatos: async () => {
        throw new Error('sin conexión');
      },
    });
    expect((await request(caida).get('/api/salud')).status).toBe(503);
  });

  test('ruta inexistente -> 404', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
  });
});

describe('Caso de uso completo: el docente carga y publica una nota', () => {
  test('pendiente (el alumno no la ve) -> publicada (el alumno la ve)', async () => {
    const tokenDocente = await login('gomez@mail.com');
    const tokenAlumna = await login('ana@mail.com');

    // 1. El docente carga la nota: queda "pendiente"
    const creada = await request(app)
      .post('/api/calificaciones')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ alumno: e.usuarios.ana._id, evaluacion: e.evaluaciones.parcialProg._id, nota: 7.5, observaciones: 'Bien' });
    expect(creada.status).toBe(201);
    expect(creada.body.calificacion.estado).toBe('pendiente');
    const id = creada.body.calificacion._id;

    // 2. La alumna todavía no la ve
    let mias = await request(app).get('/api/calificaciones/mis-calificaciones').set('Authorization', `Bearer ${tokenAlumna}`);
    expect(mias.status).toBe(200);
    expect(mias.body.total).toBe(0);

    // 3. El docente la publica
    const publicada = await request(app)
      .patch(`/api/calificaciones/${id}/estado`)
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({ estado: 'publicada' });
    expect(publicada.status).toBe(200);
    expect(publicada.body.message).toBe('Calificación publicada');

    // 4. Ahora sí la ve, con su promedio
    mias = await request(app).get('/api/calificaciones/mis-calificaciones').set('Authorization', `Bearer ${tokenAlumna}`);
    expect(mias.body.total).toBe(1);
    expect(mias.body.calificaciones[0].nota).toBe(7.5);
    expect(mias.body.porMateria[0].promedio).toBe(7.5);
  });

  test('un alumno no puede cargar notas -> 403', async () => {
    const token = await login('ana@mail.com');
    const res = await request(app)
      .post('/api/calificaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ alumno: e.usuarios.ana._id, evaluacion: e.evaluaciones.parcialProg._id, nota: 10 });
    expect(res.status).toBe(403);
  });

  test('una nota fuera de rango -> 400 con un mensaje claro', async () => {
    const token = await login('gomez@mail.com');
    const res = await request(app)
      .post('/api/calificaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ alumno: e.usuarios.ana._id, evaluacion: e.evaluaciones.parcialProg._id, nota: 15 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La nota debe estar entre 0 y 10');
  });
});
