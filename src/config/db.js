// CAPA DE INFRAESTRUCTURA: conexión a MongoDB.
// Mongoose mantiene UNA sola conexión compartida por toda la app (patrón Singleton):
// todos los modelos y repositorios la reutilizan.
const mongoose = require('mongoose');

const connectDB = async (uri) => {
  if (!uri) throw new Error('Falta MONGO_URI en el archivo .env');
  await mongoose.connect(uri);
  console.log('MongoDB conectado');
};

module.exports = connectDB;
