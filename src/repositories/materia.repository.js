// ─────────────────────────────────────────────────────────────
// CAPA DE INFRAESTRUCTURA — Patrón Repository
// El ÚNICO lugar que habla con MongoDB para las materias.
// ─────────────────────────────────────────────────────────────
const Materia = require('../models/Materia');

const PERSONA = 'nombre email';

const materiaRepo = {
  // Con docentes y alumnos como ids
  buscarPorId: (id) => Materia.findById(id).lean(),

  // Con docentes y alumnos "populados" (nombre y email)
  buscarDetalle: (id) => Materia.findById(id).populate('docentes', PERSONA).populate('alumnos', PERSONA).lean(),

  // filtro: { periodo?, docente?, alumno? }. No incluye la lista de alumnos.
  listar: ({ periodo, docente, alumno }) => {
    const consulta = {};
    if (periodo) consulta.periodo = periodo;
    if (docente) consulta.docentes = docente;
    if (alumno) consulta.alumnos = alumno;
    return Materia.find(consulta).select('-alumnos').populate('docentes', PERSONA).sort({ periodo: -1, nombre: 1 }).lean();
  },

  idsDeDocente: async (usuarioId) => (await Materia.find({ docentes: usuarioId }).distinct('_id')).map(String),

  idsDeAlumno: async (usuarioId) => (await Materia.find({ alumnos: usuarioId }).distinct('_id')).map(String),

  crear: async (datos) => (await Materia.create(datos)).toObject(),

  actualizar: async (id, cambios) => {
    const materia = await Materia.findById(id);
    materia.set(cambios);
    await materia.save(); // save() corre las validaciones del schema
    return materia.toObject();
  },

  eliminar: (id) => Materia.deleteOne({ _id: id }),

  // $addToSet no duplica si el alumno ya estaba inscripto
  agregarAlumnos: async (id, alumnos) => {
    await Materia.updateOne({ _id: id }, { $addToSet: { alumnos: { $each: alumnos } } });
    return materiaRepo.buscarDetalle(id);
  },

  quitarAlumno: (id, alumnoId) => Materia.updateOne({ _id: id }, { $pull: { alumnos: alumnoId } }),
};

module.exports = materiaRepo;
