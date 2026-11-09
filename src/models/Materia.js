// CAPA DE INFRAESTRUCTURA: cómo se guarda una materia en MongoDB (Mongoose).
// Las reglas (quién la dicta, quién la cursa) están en src/domain/materia.js
const mongoose = require('mongoose');
const { PERIODO_REGEX } = require('../domain/materia');

// Una materia en un período concreto (una "cursada").
// Ej: Programación II - 2026-2C, con sus docentes y sus alumnos inscriptos.
const materiaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la materia es obligatorio'],
      trim: true,
    },
    codigo: {
      type: String,
      required: [true, 'El código de la materia es obligatorio'],
      trim: true,
      uppercase: true,
    },
    periodo: {
      type: String,
      required: [true, 'El período académico es obligatorio'],
      trim: true,
      uppercase: true,
      match: [PERIODO_REGEX, 'El período debe tener el formato AAAA-1C, AAAA-2C o AAAA-ANUAL'],
    },
    docentes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    alumnos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// No puede haber dos veces la misma materia en el mismo período
materiaSchema.index({ codigo: 1, periodo: 1 }, { unique: true });

module.exports = mongoose.model('Materia', materiaSchema);
