// CAPA DE INFRAESTRUCTURA: cómo se guarda un usuario en MongoDB (Mongoose).
const mongoose = require('mongoose');
const { LISTA_ROLES, ROLES } = require('../domain/roles');

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    password: {
      type: String,
      // Se guarda SIEMPRE hasheada con bcrypt (lo hace el caso de uso con passwordService).
      required: [true, 'La contraseña es obligatoria'],
      select: false, // no se devuelve en las consultas por defecto
    },
    rol: {
      type: String,
      enum: LISTA_ROLES,
      default: ROLES.ALUMNO,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
