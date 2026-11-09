// CASO DE USO (admin): listar usuarios, filtrando por rol o por texto (nombre/email).
const { LISTA_ROLES } = require('../../domain/roles');
const { formatoUsuario } = require('../../domain/usuario');
const { textoQuery, validarEnum, paginacion } = require('../../utils/validaciones');
const { respuestaPaginada } = require('../compartidos');

module.exports =
  ({ usuarioRepo }) =>
  async ({ query = {} }) => {
    const filtro = {};
    const rol = textoQuery(query.rol, 'rol');
    const texto = textoQuery(query.q, 'q');
    if (rol) filtro.rol = validarEnum(rol, LISTA_ROLES, 'rol');
    if (texto) filtro.texto = texto;

    const pag = paginacion(query);
    const { resultados, total } = await usuarioRepo.listar(filtro, pag);
    return respuestaPaginada({ resultados: resultados.map(formatoUsuario), total }, pag);
  };
