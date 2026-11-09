// ─────────────────────────────────────────────────────────────
// CAPA DE INFRAESTRUCTURA — Patrón Repository
// El ÚNICO lugar que habla con MongoDB para las calificaciones.
// Recibe filtros "del negocio" ({ estados: [...], desde, hasta }) y los
// traduce a una consulta de MongoDB ({ estado: { $in: [...] }, fecha: { $gte, $lte } }).
// ─────────────────────────────────────────────────────────────
const Calificacion = require('../models/Calificacion');

// Qué datos relacionados traemos en las respuestas
const POPULATE = [
  { path: 'alumno', select: 'nombre email' },
  { path: 'docente', select: 'nombre email' },
  { path: 'materia', select: 'nombre codigo periodo' },
  { path: 'evaluacion', select: 'titulo tipo fecha notaMaxima' },
];

// filtro: { alumno, materia, materias, docente, periodo, tipoEvaluacion, estado, estados, desde, hasta }
const aConsultaMongo = (f) => {
  const q = {};
  if (f.alumno) q.alumno = f.alumno;
  if (f.materia) q.materia = f.materia;
  else if (f.materias) q.materia = { $in: f.materias };
  if (f.docente) q.docente = f.docente;
  if (f.periodo) q.periodo = f.periodo;
  if (f.tipoEvaluacion) q.tipoEvaluacion = f.tipoEvaluacion;
  if (f.estado) q.estado = f.estado;
  else if (f.estados) q.estado = { $in: f.estados };
  if (f.desde || f.hasta) {
    q.fecha = {};
    if (f.desde) q.fecha.$gte = f.desde;
    if (f.hasta) q.fecha.$lte = f.hasta;
  }
  return q;
};

const calificacionRepo = {
  // Con alumno/materia/evaluacion/docente como ids (para chequear permisos)
  buscarPorId: (id) => Calificacion.findById(id).lean(),

  // Todo populado, incluido quién hizo cada cambio del historial
  buscarDetalle: (id) =>
    Calificacion.findById(id).populate(POPULATE).populate({ path: 'historial.usuario', select: 'nombre rol' }).lean(),

  crear: async (datos) => {
    const calificacion = await Calificacion.create(datos);
    return calificacionRepo.buscarDetalle(calificacion._id);
  },

  // Aplica los cambios y agrega una entrada al historial
  guardar: async (id, cambios, entradaHistorial) => {
    const calificacion = await Calificacion.findById(id);
    calificacion.set(cambios);
    calificacion.historial.push(entradaHistorial);
    await calificacion.save();
    return calificacionRepo.buscarDetalle(id);
  },

  eliminar: (id) => Calificacion.deleteOne({ _id: id }),

  listar: async (filtro, { saltar, limite }) => {
    const consulta = aConsultaMongo(filtro);
    const [resultados, total] = await Promise.all([
      Calificacion.find(consulta)
        .select('-historial')
        .populate(POPULATE)
        .sort({ fecha: -1, createdAt: -1 })
        .skip(saltar)
        .limit(limite)
        .lean(),
      Calificacion.countDocuments(consulta),
    ]);
    return { resultados, total };
  },

  listarDeAlumno: (filtro) =>
    Calificacion.find(aConsultaMongo(filtro)).select('-historial').populate(POPULATE).sort({ periodo: -1, fecha: 1 }).lean(),

  existeDeAlumnoEnEvaluacion: async (alumno, evaluacion) => Boolean(await Calificacion.exists({ alumno, evaluacion })),

  existeEnMateria: async (materia) => Boolean(await Calificacion.exists({ materia })),

  existeEnEvaluacion: async (evaluacion) => Boolean(await Calificacion.exists({ evaluacion })),

  existeDeAlumnoEnMateria: async (alumno, materia) => Boolean(await Calificacion.exists({ alumno, materia })),

  // La nota más alta cargada en una evaluación (o null si no hay notas)
  notaMasAlta: async (evaluacion) => {
    const c = await Calificacion.findOne({ evaluacion }).sort({ nota: -1 }).select('nota').lean();
    return c ? c.nota : null;
  },

  actualizarTipoPorEvaluacion: (evaluacion, tipo) => Calificacion.updateMany({ evaluacion }, { tipoEvaluacion: tipo }),
};

module.exports = calificacionRepo;
