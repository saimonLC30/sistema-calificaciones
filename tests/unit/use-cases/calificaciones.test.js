// TESTS UNITARIOS de los casos de uso de calificaciones (el núcleo del sistema).
const { crearEscenario } = require('../../helpers/escenario');

describe('Casos de uso de Calificaciones', () => {
  let e;
  let casos;
  beforeEach(async () => {
    e = await crearEscenario();
    casos = e.contenedor.calificaciones;
  });

  // Atajo: Gómez carga una nota de Ana en el primer parcial
  const cargarNotaDeAna = (extra = {}) =>
    casos.crearCalificacion({
      usuarioActual: e.usuarios.gomez,
      alumno: e.usuarios.ana._id,
      evaluacion: e.evaluaciones.parcialProg._id,
      nota: 8,
      ...extra,
    });

  describe('crearCalificacion', () => {
    test('el docente de la materia carga una nota y queda pendiente', async () => {
      const c = await cargarNotaDeAna();
      expect(c.estado).toBe('pendiente');
      expect(c.nota).toBe(8);
      expect(c.materia.nombre).toBe('Programación II'); // la materia sale de la evaluación
      expect(c.historial).toHaveLength(1);
      expect(c.historial[0].accion).toBe('creada');
    });

    test('un docente de OTRA materia no puede cargar notas (403)', async () => {
      await expect(cargarNotaDeAna({ usuarioActual: e.usuarios.ruiz })).rejects.toMatchObject({ statusCode: 403 });
    });

    test('la nota no puede superar la nota máxima de la evaluación (400)', async () => {
      await expect(cargarNotaDeAna({ nota: 11 })).rejects.toMatchObject({ statusCode: 400 });
    });

    test('no se puede cargar dos notas al mismo alumno en la misma evaluación (409)', async () => {
      await cargarNotaDeAna();
      await expect(cargarNotaDeAna()).rejects.toMatchObject({ statusCode: 409 });
    });

    test('el alumno tiene que estar inscripto en la materia (400)', async () => {
      await expect(
        casos.crearCalificacion({
          usuarioActual: e.usuarios.ruiz,
          alumno: e.usuarios.juan._id, // Juan no cursa Bases de Datos
          evaluacion: e.evaluaciones.parcialBd._id,
          nota: 7,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('no se puede crear directamente como "revisada" o "anulada"', async () => {
      await expect(cargarNotaDeAna({ estado: 'anulada' })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('cambiarEstadoCalificacion', () => {
    test('publicar una nota pendiente', async () => {
      const c = await cargarNotaDeAna();
      const publicada = await casos.cambiarEstadoCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, estado: 'publicada' });
      expect(publicada.estado).toBe('publicada');
      expect(publicada.historial.at(-1)).toMatchObject({ accion: 'cambio_estado', estadoAnterior: 'pendiente', estadoNuevo: 'publicada' });
    });

    test('no se puede volver de publicada a pendiente (409)', async () => {
      const c = await cargarNotaDeAna({ estado: 'publicada' });
      await expect(
        casos.cambiarEstadoCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, estado: 'pendiente' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('para anular hay que indicar el motivo (400)', async () => {
      const c = await cargarNotaDeAna();
      await expect(
        casos.cambiarEstadoCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, estado: 'anulada' })
      ).rejects.toMatchObject({ statusCode: 400 });
      const anulada = await casos.cambiarEstadoCalificacion({
        usuarioActual: e.usuarios.gomez,
        id: c._id,
        estado: 'anulada',
        motivo: 'Se copió en el examen',
      });
      expect(anulada.estado).toBe('anulada');
    });
  });

  describe('modificarCalificacion', () => {
    test('si la nota ya estaba publicada, exige motivo y pasa a "revisada"', async () => {
      const c = await cargarNotaDeAna({ estado: 'publicada' });
      await expect(
        casos.modificarCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, nota: 9 })
      ).rejects.toMatchObject({ statusCode: 400 });

      const revisada = await casos.modificarCalificacion({
        usuarioActual: e.usuarios.gomez,
        id: c._id,
        nota: 9,
        motivo: 'Error al sumar el ejercicio 3',
      });
      expect(revisada.estado).toBe('revisada');
      expect(revisada.nota).toBe(9);
      expect(revisada.historial.at(-1)).toMatchObject({ notaAnterior: 8, notaNueva: 9 });
    });

    test('si está pendiente, se corrige sin motivo y sigue pendiente', async () => {
      const c = await cargarNotaDeAna();
      const r = await casos.modificarCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, nota: 6 });
      expect(r).toMatchObject({ nota: 6, estado: 'pendiente' });
    });

    test('no deja cambiar el alumno ni el estado por esta vía', async () => {
      const c = await cargarNotaDeAna();
      await expect(
        casos.modificarCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, alumno: e.usuarios.juan._id })
      ).rejects.toMatchObject({ statusCode: 400 });
      await expect(
        casos.modificarCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, estado: 'publicada' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('Qué ve cada rol', () => {
    test('el alumno NO ve sus notas pendientes; sí las publicadas', async () => {
      const c = await cargarNotaDeAna();
      let lista = await casos.listarCalificaciones({ usuarioActual: e.usuarios.ana, query: {} });
      expect(lista.total).toBe(0);

      await casos.cambiarEstadoCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id, estado: 'publicada' });
      lista = await casos.listarCalificaciones({ usuarioActual: e.usuarios.ana, query: {} });
      expect(lista.total).toBe(1);
    });

    test('un alumno no ve las notas de otro aunque lo pida por filtro', async () => {
      await cargarNotaDeAna({ estado: 'publicada' });
      const lista = await casos.listarCalificaciones({ usuarioActual: e.usuarios.juan, query: { alumno: String(e.usuarios.ana._id) } });
      expect(lista.total).toBe(0);
    });

    test('el docente solo ve las notas de sus materias', async () => {
      await cargarNotaDeAna({ estado: 'publicada' });
      const deRuiz = await casos.listarCalificaciones({ usuarioActual: e.usuarios.ruiz, query: {} });
      const deGomez = await casos.listarCalificaciones({ usuarioActual: e.usuarios.gomez, query: {} });
      expect(deRuiz.total).toBe(0);
      expect(deGomez.total).toBe(1);
    });

    test('el detalle que ve el alumno no incluye el historial interno', async () => {
      const c = await cargarNotaDeAna({ estado: 'publicada' });
      const vista = await casos.verCalificacion({ usuarioActual: e.usuarios.ana, id: c._id });
      expect(vista.historial).toBeUndefined();
      const vistaDocente = await casos.verCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id });
      expect(vistaDocente.historial).toHaveLength(1);
    });

    test('historial del alumno con promedio por materia', async () => {
      await cargarNotaDeAna({ estado: 'publicada' }); // 8/10
      await casos.crearCalificacion({
        usuarioActual: e.usuarios.gomez,
        alumno: e.usuarios.ana._id,
        evaluacion: e.evaluaciones.tpProg._id,
        nota: 60, // 60/100 = 6/10
        estado: 'publicada',
      });
      const h = await casos.verHistorialAlumno({ usuarioActual: e.usuarios.ana, alumnoId: e.usuarios.ana._id });
      expect(h.total).toBe(2);
      expect(h.porMateria[0].promedio).toBe(7);
    });
  });

  describe('eliminarCalificacion', () => {
    test('el docente no puede eliminar una nota publicada: tiene que anularla (409)', async () => {
      const c = await cargarNotaDeAna({ estado: 'publicada' });
      await expect(casos.eliminarCalificacion({ usuarioActual: e.usuarios.gomez, id: c._id })).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    test('el admin sí puede', async () => {
      const c = await cargarNotaDeAna({ estado: 'publicada' });
      await casos.eliminarCalificacion({ usuarioActual: e.usuarios.admin, id: c._id });
      expect(e.repos.db.calificaciones).toHaveLength(0);
    });
  });
});
