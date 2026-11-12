// CAPA DE INFRAESTRUCTURA: servicio de tokens JWT.
// Es una "fábrica": recibe la configuración y devuelve { generar, verificar }.
// Así los casos de uso no dependen directamente de la librería jsonwebtoken.
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

const ALGORITMO = 'HS256';
const LARGO_MINIMO_SECRETO = 32;

module.exports = ({ secreto, expiraEn = '1d' }) => {
  if (!secreto || secreto.length < LARGO_MINIMO_SECRETO) {
    throw new Error(`JWT_SECRET falta o es muy corto: tiene que tener al menos ${LARGO_MINIMO_SECRETO} caracteres`);
  }

  return {
    // En el token solo va el id y el rol (nunca datos sensibles: el token se puede decodificar)
    generar: (usuario) =>
      jwt.sign({ id: String(usuario._id), rol: usuario.rol }, secreto, { expiresIn: expiraEn, algorithm: ALGORITMO }),

    // Fijamos el algoritmo para que no acepten tokens firmados de otra forma (ej: "alg: none")
    verificar: (token) => jwt.verify(token, secreto, { algorithms: [ALGORITMO] }),
  };
};
