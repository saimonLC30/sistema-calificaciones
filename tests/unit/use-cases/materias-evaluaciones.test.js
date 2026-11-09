// TESTS UNITARIOS de materias, evaluaciones y usuarios.
const { crearEscenario } = require('../../helpers/escenario');

describe('Casos de uso de Materias', () => {
  let e;
  beforeEach(async () => {
    e = await crearEscenario();
  });

  test('crear una materia normaliza código y período', async () => {
    const m = await e.contenedor.materias.crearMateria({ nombre: 'Redes', codigo: 'red1', periodo: '2027-1c', docentes: [e.usuarios.ruiz._id] });
    expect(m).toMatchObject({ codigo: 'RED1', periodo: '2027-1C' });
  });

  test('rechaza un período con formato inválido', async () => {
    await expect(
      e.contenedor.materias.crearMateria({ nombre: 'Redes', codigo: 'RED1', periodo: 'segundo cuatri' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('como docente solo puede asignarse a alguien con rol docente', async () => {
    await expect(
      e.contenedor.materias.crearMateria({ nombre: 'Redes', codigo: 'RED1', periodo: '2027-1C', docentes: [e.usuarios.ana._id] })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('el alumno ve la materia pero sin la lista de compañeros', async () => {
    const vista = await e.contenedor.materias.obtenerMateria({ usuarioActual: e.usuarios.ana, id: e.materias.prog._id });
    expect(vista.nombre).toBe('Programación II');
    expect(vista.alumnos).toBeUndefined();
  });

  test('no se puede eliminar una materia con evaluaciones (409)', async () => {
    await expect(e.contenedor.materias.eliminarMateria({ id: e.materias.prog._id })).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('Casos de uso de Evaluaciones', () => {
  let e;
  beforeEach(async () => {
    e = await crearEscenario();
  });

  test('el docente de la materia crea una evaluación', async () => {
    const ev = await e.contenedor.evaluaciones.crearEvaluacion({
      usuarioActual: e.usuarios.gomez,
      materia: e.materias.prog._id,
      titulo: 'Recuperatorio',
      tipo: 'recuperatorio',
      fecha: '2026-11-20',
    });
    expect(ev).toMatchObject({ titulo: 'Recuperatorio', notaMaxima: 10 });
  });

  test('un docente de otra materia no puede (403)', async () => {
    await expect(
      e.contenedor.evaluaciones.crearEvaluacion({
        usuarioActual: e.usuarios.ruiz,
        materia: e.materias.prog._id,
        titulo: 'X',
        tipo: 'parcial',
        fecha: '2026-11-20',
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('no se puede bajar la nota máxima por debajo de una nota ya cargada (409)', async () => {
    await e.contenedor.calificaciones.crearCalificacion({
      usuarioActual: e.usuarios.gomez,
      alumno: e.usuarios.ana._id,
      evaluacion: e.evaluaciones.tpProg._id,
      nota: 80,
    });
    await expect(
      e.contenedor.evaluaciones.actualizarEvaluacion({ usuarioActual: e.usuarios.gomez, id: e.evaluaciones.tpProg._id, notaMaxima: 10 })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('Casos de uso de Usuarios (admin)', () => {
  let e;
  beforeEach(async () => {
    e = await crearEscenario();
  });

  test('el admin crea un docente', async () => {
    const u = await e.contenedor.usuarios.crearUsuario({ nombre: 'Nuevo Profe', email: 'profe@mail.com', password: '123456', rol: 'docente' });
    expect(u.rol).toBe('docente');
  });

  test('el admin no puede cambiarse su propio rol', async () => {
    await expect(
      e.contenedor.usuarios.cambiarRol({ usuarioActual: e.usuarios.admin, id: e.usuarios.admin._id, rol: 'alumno' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('el listado nunca incluye contraseñas', async () => {
    const r = await e.contenedor.usuarios.listarUsuarios({ query: {} });
    expect(r.total).toBe(5);
    r.resultados.forEach((u) => expect(u.password).toBeUndefined());
  });
});
