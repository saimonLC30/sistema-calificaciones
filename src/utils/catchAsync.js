// Envuelve un controlador async para que cualquier error vaya al
// middleware de errores (así no repetimos try/catch en cada función).
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
