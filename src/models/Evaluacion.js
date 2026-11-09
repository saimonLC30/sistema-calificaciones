// CAPA DE INFRAESTRUCTURA: cómo se guarda una evaluación en MongoDB (Mongoose).
const mongoose = require('mongoose');
const { TIPOS_EVALUACION, NOTA_MAXIMA_POR_DEFECTO } = require('../domain/evaluacion');

// Una instancia de evaluación de una materia (ej: "Primer parcial" del 15/09).
const evaluacionSchema = new mongoose.Schema(
  {
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Materia',
      required: [true, 'La materia es obligatoria'],
    },
    titulo: {
      type: String,
      required: [true, 'El título de la evaluación es obligatorio'],
      trim: true,
    },
    tipo: {
      type: String,
      required: [true, 'El tipo de evaluación es obligatorio'],
      enum: {
        values: TIPOS_EVALUACION,
        message: `El tipo debe ser uno de: ${TIPOS_EVALUACION.join(', ')}`,
      },
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha de la evaluación es obligatoria'],
    },
    notaMaxima: {
      type: Number,
      default: NOTA_MAXIMA_POR_DEFECTO,
      min: [1, 'La nota máxima debe ser al menos 1'],
      max: [100, 'La nota máxima no puede superar 100'],
    },
    descripcion: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluacion', evaluacionSchema);
