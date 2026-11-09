// CASO DE USO: cambiar el estado de una calificación (publicarla, anularla, etc.).
// Datos: { estado, motivo? }
//
// Usa la máquina de estados del dominio (domain/calificacion.js):
//   pendiente -> publicada | anulada
//   publicada -> revisada  | anulada
//   revisada  -> anulada
// Para "revisada" o "anulada" el motivo es obligatorio.
const AppError = require('../../utils/AppError');
const { verificarGestionarMateria } = require('../../domain/permisos');
const { ESTADOS, TRANSICIONES, ESTADOS_CON_MOTIVO, puedePasarA, motivoValido } = require('../../domain/calificacion');
const { validarEnum } = require('../../utils/validaciones');
const { buscarCalificacionConMateria } = require('./comun');

module.exports =
  (deps) =>
  async ({ usuarioActual, id, estado, motivo }) => {
    const { calificacion, materia } = await buscarCalificacionConMateria(deps, id);
    verificarGestionarMateria(usuarioActual, materia);
    validarEnum(estado, ESTADOS, 'estado');

    if (!puedePasarA(calificacion.estado, estado)) {
      const posibles = TRANSICIONES[calificacion.estado];
      throw new AppError(
        `No se puede pasar de "${calificacion.estado}" a "${estado}". ` +
          (posibles.length ? `Opciones: ${posibles.join(', ')}` : 'Este estado es final.'),
        409
      );
    }
    if (ESTADOS_CON_MOTIVO.includes(estado) && !motivoValido(motivo)) {
      throw new AppError(`Para marcarla como "${estado}" tenés que indicar el "motivo"`, 400);
    }

    return deps.calificacionRepo.guardar(
      calificacion._id,
      { estado },
      {
        accion: 'cambio_estado',
        estadoAnterior: calificacion.estado,
        estadoNuevo: estado,
        motivo: typeof motivo === 'string' ? motivo.trim() : undefined,
        usuario: usuarioActual._id,
        fecha: new Date(),
      }
    );
  };
