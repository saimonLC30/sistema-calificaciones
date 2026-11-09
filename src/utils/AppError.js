// Error "esperado" de la aplicación: lleva el código HTTP que hay que devolver.
// Ej: throw new AppError('La calificación no existe', 404)
// El middleware errorHandler lo reconoce por "isAppError" y responde con ese código.
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isAppError = true;
  }
}

module.exports = AppError;
