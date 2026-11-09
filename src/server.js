// Punto de entrada: arma todo con las piezas "reales" (MongoDB, bcrypt, JWT) y levanta el servidor.
require('dotenv').config();
const crearApp = require('./app');
const connectDB = require('./config/db');
const { crearContenedorMongo } = require('./container');

const PORT = process.env.PORT || 3000;

const listaDesdeEnv = (valor = '') =>
  valor
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const iniciar = async () => {
  const contenedor = crearContenedorMongo({
    jwtSecreto: process.env.JWT_SECRET,
    jwtExpiraEn: process.env.JWT_EXPIRES_IN || '1d',
  });

  await connectDB(process.env.MONGO_URI);

  const app = crearApp(contenedor, { origenesPermitidos: listaDesdeEnv(process.env.CORS_ORIGIN) });
  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
};

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
