// TESTS UNITARIOS de las reglas de permisos ("quién puede hacer qué").
const {
  puedeVerMateria,
  verificarGestionarMateria,
  verificarVerCalificacion,
} = require('../../../src/domain/permisos');

const admin = { _id: 'a1', rol: 'admin' };
const gomez = { _id: 'd1', rol: 'docente' };
const ruiz = { _id: 'd2', rol: 'docente' };
const ana = { _id: 'e1', rol: 'alumno' };
const juan = { _id: 'e2', rol: 'alumno' };

const prog = { _id: 'm1', docentes: ['d1'], alumnos: ['e1'] };

describe('Permisos sobre materias', () => {
  test('el admin ve todas, el docente las que dicta y el alumno las que cursa', () => {
    expect(puedeVerMateria(admin, prog)).toBe(true);
    expect(puedeVerMateria(gomez, prog)).toBe(true);
    expect(puedeVerMateria(ruiz, prog)).toBe(false);
    expect(puedeVerMateria(ana, prog)).toBe(true);
    expect(puedeVerMateria(juan, prog)).toBe(false);
  });

  test('solo el admin o un docente de la materia pueden gestionarla', () => {
    expect(() => verificarGestionarMateria(admin, prog)).not.toThrow();
    expect(() => verificarGestionarMateria(gomez, prog)).not.toThrow();
    expect(() => verificarGestionarMateria(ruiz, prog)).toThrow(expect.objectContaining({ statusCode: 403 }));
    expect(() => verificarGestionarMateria(ana, prog)).toThrow(expect.objectContaining({ statusCode: 403 }));
  });
});

describe('Permisos sobre una calificación', () => {
  const publicadaDeAna = { alumno: 'e1', estado: 'publicada' };
  const pendienteDeAna = { alumno: 'e1', estado: 'pendiente' };

  test('el alumno ve SU nota solo si está publicada o revisada', () => {
    expect(() => verificarVerCalificacion(ana, publicadaDeAna, prog)).not.toThrow();
    expect(() => verificarVerCalificacion(ana, pendienteDeAna, prog)).toThrow(expect.objectContaining({ statusCode: 403 }));
  });

  test('un alumno no ve la nota de otro', () => {
    expect(() => verificarVerCalificacion(juan, publicadaDeAna, prog)).toThrow(expect.objectContaining({ statusCode: 403 }));
  });

  test('un docente que no dicta la materia no la ve', () => {
    expect(() => verificarVerCalificacion(ruiz, pendienteDeAna, prog)).toThrow(expect.objectContaining({ statusCode: 403 }));
    expect(() => verificarVerCalificacion(gomez, pendienteDeAna, prog)).not.toThrow();
  });
});
