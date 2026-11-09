// CAPA DE INFRAESTRUCTURA: cómo se guarda una calificación en MongoDB (Mongoose).
// La máquina de estados y las reglas están en src/domain/calificacion.js
const mongoose = require('mongoose');
const { ESTADOS } = require('../domain/calificacion');
const { TIPOS_EVALUACION } = require('../domain/evaluacion');

// Cada cambio queda registrado (quién, cuándo, qué cambió y por qué)
const cambioSchema = new mongoose.Schema(
  {
    accion: { type: String, required: true }, // creada | modificada | cambio_estado
    estadoAnterior: String,
    estadoNuevo: String,
    notaAnterior: Number,
    notaNueva: Number,
    motivo: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false }
);

const calificacionSchema = new mongoose.Schema(
  {
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El alumno es obligatorio'],
    },
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Materia',
      required: [true, 'La materia es obligatoria'],
    },
    evaluacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluacion',
      required: [true, 'La evaluación es obligatoria'],
    },
    docente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El docente responsable es obligatorio'],
    },
    // Copiados de la materia y la evaluación para poder filtrar rápido
    periodo: { type: String, required: true },
    tipoEvaluacion: { type: String, enum: TIPOS_EVALUACION, required: true },

    nota: {
      type: Number,
      required: [true, 'La nota es obligatoria'],
      min: [0, 'La nota no puede ser negativa'],
      max: [100, 'La nota no puede superar 100'],
    },
    fecha: { type: Date, default: Date.now },
    observaciones: {
      type: String,
      trim: true,
      maxlength: [500, 'Las observaciones no pueden superar los 500 caracteres'],
    },
    estado: {
      type: String,
      enum: { values: ESTADOS, message: `El estado debe ser uno de: ${ESTADOS.join(', ')}` },
      default: 'pendiente',
    },
    historial: [cambioSchema],
  },
  { timestamps: true }
);

// Un alumno tiene UNA sola calificación por evaluación
calificacionSchema.index({ alumno: 1, evaluacion: 1 }, { unique: true });
// Índices para los filtros más usados
calificacionSchema.index({ materia: 1, estado: 1 });
calificacionSchema.index({ docente: 1 });

module.exports = mongoose.model('Calificacion', calificacionSchema);
