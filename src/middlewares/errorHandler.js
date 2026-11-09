// ─────────────────────────────────────────────────────────────
// MIDDLEWARE CENTRAL DE ERRORES. Va al final de app.js.
// Cualquier error de cualquier capa termina acá y se convierte en una
// respuesta JSON prolija. Nunca se le muestra al cliente el detalle interno
// (stack trace), solo se loguea en la consola del servidor.
// ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
  }

  // Body demasiado grande (límite configurado en app.js)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'El cuerpo de la petición es demasiado grande' });
  }

  // Errores "esperados" que lanzamos nosotros con AppError (400, 401, 403, 404, 409...)
  if (err.isAppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Validaciones del schema de Mongoose (required, min, max, enum...)
  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: mensajes.join(', ') });
  }

  // Un id con formato inválido
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Valor inválido para "${err.path}"` });
  }

  // Índice único violado (ej: dos materias con el mismo código en el mismo período)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
  }

  console.error(err);
  res.status(500).json({ message: 'Error del servidor' });
};
