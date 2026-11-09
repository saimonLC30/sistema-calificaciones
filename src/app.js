// ─────────────────────────────────────────────────────────────
// APP DE EXPRESS (capa de interfaz HTTP)
// crearApp() recibe el contenedor con los casos de uso ya armados.
// Así la misma app se usa con MongoDB (server.js) o con datos en memoria (tests).
// ─────────────────────────────────────────────────────────────
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const crearMiddlewaresAuth = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');

const crearAuthController = require('./controllers/auth.controller');
const crearUsuarioController = require('./controllers/usuario.controller');
const crearMateriaController = require('./controllers/materia.controller');
const crearEvaluacionController = require('./controllers/evaluacion.controller');
const crearCalificacionController = require('./controllers/calificacion.controller');

const crearAuthRoutes = require('./routes/auth.routes');
const crearUsuarioRoutes = require('./routes/usuario.routes');
const crearMateriaRoutes = require('./routes/materia.routes');
const crearEvaluacionRoutes = require('./routes/evaluacion.routes');
const crearCalificacionRoutes = require('./routes/calificacion.routes');

const QUINCE_MINUTOS = 15 * 60 * 1000;

const crearApp = (
  contenedor,
  {
    origenesPermitidos = [], // dominios de frontends que pueden llamar a la API desde el navegador
    activarLimites = true, // rate limiting (en los tests se apaga)
    limiteIntentosLogin = 10, // intentos FALLIDOS de login por IP cada 15 minutos
    limitePeticiones = 300, // peticiones por IP cada 15 minutos
  } = {}
) => {
  const app = express();

  // ── Seguridad ────────────────────────────────────────────
  app.disable('x-powered-by'); // no contar que usamos Express
  app.use(helmet()); // headers HTTP seguros (nosniff, frameguard, HSTS, etc.)
  app.use(cors({ origin: origenesPermitidos.length ? origenesPermitidos : false }));
  app.use(express.json({ limit: '10kb' })); // body chico: evita que nos saturen con JSONs enormes

  if (activarLimites) {
    // Freno a la fuerza bruta: después de N logins fallidos, la IP espera 15 minutos
    const limitadorLogin = rateLimit({
      windowMs: QUINCE_MINUTOS,
      limit: limiteIntentosLogin,
      skipSuccessfulRequests: true,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { message: 'Demasiados intentos fallidos. Probá de nuevo en 15 minutos.' },
    });
    const limitadorGeneral = rateLimit({
      windowMs: QUINCE_MINUTOS,
      limit: limitePeticiones,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { message: 'Demasiadas peticiones. Probá de nuevo en unos minutos.' },
    });
    app.use('/api', limitadorGeneral);
    app.use('/api/auth/login', limitadorLogin);
    app.use('/api/auth/register', limitadorLogin);
  }

  // ── Rutas ────────────────────────────────────────────────
  const middlewaresAuth = crearMiddlewaresAuth(contenedor.auth.autenticarToken);

  app.get('/', (req, res) => res.json({ message: 'API de calificaciones funcionando' }));

  app.use('/api/auth', crearAuthRoutes(crearAuthController(contenedor.auth), middlewaresAuth));
  app.use('/api/usuarios', crearUsuarioRoutes(crearUsuarioController(contenedor.usuarios), middlewaresAuth));
  app.use('/api/materias', crearMateriaRoutes(crearMateriaController(contenedor.materias), middlewaresAuth));
  app.use(
    '/api/evaluaciones',
    crearEvaluacionRoutes(crearEvaluacionController(contenedor.evaluaciones), middlewaresAuth)
  );
  app.use(
    '/api/calificaciones',
    crearCalificacionRoutes(crearCalificacionController(contenedor.calificaciones), middlewaresAuth)
  );

  // Ruta inexistente
  app.use((req, res) => res.status(404).json({ message: `No existe la ruta ${req.method} ${req.originalUrl}` }));

  // Manejo central de errores (siempre al final)
  app.use(errorHandler);

  return app;
};

module.exports = crearApp;
