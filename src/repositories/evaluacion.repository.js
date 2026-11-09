// ─────────────────────────────────────────────────────────────
// CAPA DE INFRAESTRUCTURA — Patrón Repository
// El ÚNICO lugar que habla con MongoDB para las evaluaciones.
// ─────────────────────────────────────────────────────────────
const Evaluacion = require('../models/Evaluacion');

const evaluacionRepo = {
  // Con "materia" como id
  buscarPorId: (id) => Evaluacion.findById(id).lean(),

  // filtro: { tipo?, materia?, materias? (lista de ids) }
  listar: ({ tipo, materia, materias }) => {
    const consulta = {};
    if (tipo) consulta.tipo = tipo;
    if (materia) consulta.materia = materia;
    else if (materias) consulta.materia = { $in: materias };
    return Evaluacion.find(consulta).populate('materia', 'nombre codigo periodo').sort({ fecha: -1 }).lean();
  },

  crear: async (datos) => (await Evaluacion.create(datos)).toObject(),

  actualizar: async (id, cambios) => {
    const evaluacion = await Evaluacion.findById(id);
    evaluacion.set(cambios);
    await evaluacion.save();
    return evaluacion.toObject();
  },

  eliminar: (id) => Evaluacion.deleteOne({ _id: id }),

  existeEnMateria: async (materiaId) => Boolean(await Evaluacion.exists({ materia: materiaId })),
};

module.exports = evaluacionRepo;
