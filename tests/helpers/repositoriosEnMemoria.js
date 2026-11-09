// ─────────────────────────────────────────────────────────────
// REPOSITORIOS EN MEMORIA (solo para tests)
// Tienen EXACTAMENTE las mismas funciones que los repositorios de MongoDB
// (src/repositories), pero guardan todo en arrays.
// Gracias a la Inyección de Dependencias, los casos de uso funcionan igual
// con unos o con otros: los tests no necesitan una base de datos.
// ─────────────────────────────────────────────────────────────
const crypto = require('crypto');

const nuevoId = () => crypto.randomBytes(12).toString('hex'); // 24 caracteres, como un ObjectId
const mismoId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);
const copia = (x) => (x == null ? null : structuredClone(x));
const sinPassword = (u) => {
  if (!u) return null;
  const { password, ...resto } = u;
  return resto;
};

const crearRepositoriosEnMemoria = () => {
  const db = { usuarios: [], materias: [], evaluaciones: [], calificaciones: [] };
  const buscar = (lista, id) => lista.find((x) => mismoId(x._id, id)) || null;

  // "populate" a mano
  const persona = (id) => {
    const u = buscar(db.usuarios, id);
    return u ? { _id: u._id, nombre: u.nombre, email: u.email } : null;
  };
  const resumenMateria = (id) => {
    const m = buscar(db.materias, id);
    return m ? { _id: m._id, nombre: m.nombre, codigo: m.codigo, periodo: m.periodo } : null;
  };
  const resumenEvaluacion = (id) => {
    const e = buscar(db.evaluaciones, id);
    return e ? { _id: e._id, titulo: e.titulo, tipo: e.tipo, fecha: e.fecha, notaMaxima: e.notaMaxima } : null;
  };
  const poblarCalificacion = (c, { conHistorial = true } = {}) => {
    const r = copia(c);
    r.alumno = persona(c.alumno);
    r.docente = persona(c.docente);
    r.materia = resumenMateria(c.materia);
    r.evaluacion = resumenEvaluacion(c.evaluacion);
    if (conHistorial) {
      r.historial = c.historial.map((h) => {
        const u = buscar(db.usuarios, h.usuario);
        return { ...copia(h), usuario: u ? { _id: u._id, nombre: u.nombre, rol: u.rol } : null };
      });
    } else {
      delete r.historial;
    }
    return r;
  };

  // ── Usuarios ───────────────────────────────────────────
  const usuarioRepo = {
    buscarPorId: async (id) => sinPassword(copia(buscar(db.usuarios, id))),
    buscarPorEmailConPassword: async (email) => copia(db.usuarios.find((u) => u.email === String(email).toLowerCase())),
    existeEmail: async (email) => db.usuarios.some((u) => u.email === String(email).trim().toLowerCase()),
    crear: async (datos) => {
      const usuario = { _id: nuevoId(), rol: 'alumno', ...datos, email: datos.email.toLowerCase() };
      db.usuarios.push(usuario);
      return sinPassword(copia(usuario));
    },
    listar: async ({ rol, texto }, { saltar, limite }) => {
      let lista = db.usuarios;
      if (rol) lista = lista.filter((u) => u.rol === rol);
      if (texto) {
        const t = texto.toLowerCase();
        lista = lista.filter((u) => u.nombre.toLowerCase().includes(t) || u.email.includes(t));
      }
      lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
      return { resultados: lista.slice(saltar, saltar + limite).map((u) => sinPassword(copia(u))), total: lista.length };
    },
    actualizarRol: async (id, rol) => {
      const u = buscar(db.usuarios, id);
      if (!u) return null;
      u.rol = rol;
      return sinPassword(copia(u));
    },
    contarConRol: async (ids, rol) => db.usuarios.filter((u) => ids.some((id) => mismoId(id, u._id)) && u.rol === rol).length,
  };

  // ── Materias ───────────────────────────────────────────
  const materiaRepo = {
    buscarPorId: async (id) => copia(buscar(db.materias, id)),
    buscarDetalle: async (id) => {
      const m = buscar(db.materias, id);
      if (!m) return null;
      return { ...copia(m), docentes: m.docentes.map(persona), alumnos: m.alumnos.map(persona) };
    },
    listar: async ({ periodo, docente, alumno }) =>
      db.materias
        .filter((m) => !periodo || m.periodo === periodo)
        .filter((m) => !docente || m.docentes.some((d) => mismoId(d, docente)))
        .filter((m) => !alumno || m.alumnos.some((a) => mismoId(a, alumno)))
        .map((m) => {
          const { alumnos, ...resto } = copia(m);
          return { ...resto, docentes: m.docentes.map(persona) };
        }),
    idsDeDocente: async (id) => db.materias.filter((m) => m.docentes.some((d) => mismoId(d, id))).map((m) => m._id),
    idsDeAlumno: async (id) => db.materias.filter((m) => m.alumnos.some((a) => mismoId(a, id))).map((m) => m._id),
    crear: async (datos) => {
      const materia = { _id: nuevoId(), docentes: [], alumnos: [], ...copia(datos) };
      materia.docentes = materia.docentes.map(String);
      materia.alumnos = materia.alumnos.map(String);
      db.materias.push(materia);
      return copia(materia);
    },
    actualizar: async (id, cambios) => {
      const m = buscar(db.materias, id);
      Object.assign(m, copia(cambios));
      return copia(m);
    },
    eliminar: async (id) => {
      db.materias = db.materias.filter((m) => !mismoId(m._id, id));
    },
    agregarAlumnos: async (id, alumnos) => {
      const m = buscar(db.materias, id);
      alumnos.forEach((a) => {
        if (!m.alumnos.some((x) => mismoId(x, a))) m.alumnos.push(String(a));
      });
      return materiaRepo.buscarDetalle(id);
    },
    quitarAlumno: async (id, alumnoId) => {
      const m = buscar(db.materias, id);
      m.alumnos = m.alumnos.filter((a) => !mismoId(a, alumnoId));
    },
  };

  // ── Evaluaciones ───────────────────────────────────────
  const evaluacionRepo = {
    buscarPorId: async (id) => copia(buscar(db.evaluaciones, id)),
    listar: async ({ tipo, materia, materias }) =>
      db.evaluaciones
        .filter((e) => !tipo || e.tipo === tipo)
        .filter((e) => (materia ? mismoId(e.materia, materia) : !materias || materias.some((m) => mismoId(m, e.materia))))
        .map((e) => ({ ...copia(e), materia: resumenMateria(e.materia) })),
    crear: async (datos) => {
      const evaluacion = { _id: nuevoId(), ...copia(datos), materia: String(datos.materia) };
      db.evaluaciones.push(evaluacion);
      return copia(evaluacion);
    },
    actualizar: async (id, cambios) => {
      const e = buscar(db.evaluaciones, id);
      Object.assign(e, copia(cambios));
      return copia(e);
    },
    eliminar: async (id) => {
      db.evaluaciones = db.evaluaciones.filter((e) => !mismoId(e._id, id));
    },
    existeEnMateria: async (materiaId) => db.evaluaciones.some((e) => mismoId(e.materia, materiaId)),
  };

  // ── Calificaciones ─────────────────────────────────────
  const cumpleFiltro = (c, f) =>
    (!f.alumno || mismoId(c.alumno, f.alumno)) &&
    (f.materia ? mismoId(c.materia, f.materia) : !f.materias || f.materias.some((m) => mismoId(m, c.materia))) &&
    (!f.docente || mismoId(c.docente, f.docente)) &&
    (!f.periodo || c.periodo === f.periodo) &&
    (!f.tipoEvaluacion || c.tipoEvaluacion === f.tipoEvaluacion) &&
    (f.estado ? c.estado === f.estado : !f.estados || f.estados.includes(c.estado)) &&
    (!f.desde || c.fecha >= f.desde) &&
    (!f.hasta || c.fecha <= f.hasta);

  const calificacionRepo = {
    buscarPorId: async (id) => copia(buscar(db.calificaciones, id)),
    buscarDetalle: async (id) => {
      const c = buscar(db.calificaciones, id);
      return c ? poblarCalificacion(c) : null;
    },
    crear: async (datos) => {
      const c = {
        _id: nuevoId(),
        ...copia(datos),
        alumno: String(datos.alumno),
        materia: String(datos.materia),
        evaluacion: String(datos.evaluacion),
        docente: String(datos.docente),
      };
      db.calificaciones.push(c);
      return poblarCalificacion(c);
    },
    guardar: async (id, cambios, entradaHistorial) => {
      const c = buscar(db.calificaciones, id);
      Object.assign(c, copia(cambios));
      c.historial.push(copia(entradaHistorial));
      return poblarCalificacion(c);
    },
    eliminar: async (id) => {
      db.calificaciones = db.calificaciones.filter((c) => !mismoId(c._id, id));
    },
    listar: async (filtro, { saltar, limite }) => {
      const lista = db.calificaciones.filter((c) => cumpleFiltro(c, filtro)).sort((a, b) => b.fecha - a.fecha);
      return {
        resultados: lista.slice(saltar, saltar + limite).map((c) => poblarCalificacion(c, { conHistorial: false })),
        total: lista.length,
      };
    },
    listarDeAlumno: async (filtro) =>
      db.calificaciones.filter((c) => cumpleFiltro(c, filtro)).map((c) => poblarCalificacion(c, { conHistorial: false })),
    existeDeAlumnoEnEvaluacion: async (alumno, evaluacion) =>
      db.calificaciones.some((c) => mismoId(c.alumno, alumno) && mismoId(c.evaluacion, evaluacion)),
    existeEnMateria: async (materia) => db.calificaciones.some((c) => mismoId(c.materia, materia)),
    existeEnEvaluacion: async (evaluacion) => db.calificaciones.some((c) => mismoId(c.evaluacion, evaluacion)),
    existeDeAlumnoEnMateria: async (alumno, materia) =>
      db.calificaciones.some((c) => mismoId(c.alumno, alumno) && mismoId(c.materia, materia)),
    notaMasAlta: async (evaluacion) => {
      const notas = db.calificaciones.filter((c) => mismoId(c.evaluacion, evaluacion)).map((c) => c.nota);
      return notas.length ? Math.max(...notas) : null;
    },
    actualizarTipoPorEvaluacion: async (evaluacion, tipo) => {
      db.calificaciones.filter((c) => mismoId(c.evaluacion, evaluacion)).forEach((c) => {
        c.tipoEvaluacion = tipo;
      });
    },
  };

  return { db, usuarioRepo, materiaRepo, evaluacionRepo, calificacionRepo };
};

module.exports = { crearRepositoriosEnMemoria, nuevoId };
