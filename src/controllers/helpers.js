// Lo que manda el cliente en el body, siempre como objeto (nunca undefined ni un array)
const cuerpo = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

module.exports = { cuerpo };
