// TESTS UNITARIOS del dominio: reglas puras, sin base de datos ni HTTP.
const {
  puedePasarA,
  validarNota,
  validarFechaCalificacion,
  calcularPromediosPorMateria,
} = require('../../../src/domain/calificacion');

describe('Máquina de estados de una calificación', () => {
  test.each([
    ['pendiente', 'publicada'],
    ['pendiente', 'anulada'],
    ['publicada', 'revisada'],
    ['publicada', 'anulada'],
    ['revisada', 'anulada'],
  ])('permite pasar de %s a %s', (desde, hasta) => {
    expect(puedePasarA(desde, hasta)).toBe(true);
  });

  test.each([
    ['publicada', 'pendiente'],
    ['revisada', 'publicada'],
    ['anulada', 'publicada'],
    ['anulada', 'pendiente'],
    ['pendiente', 'revisada'],
  ])('NO permite pasar de %s a %s', (desde, hasta) => {
    expect(puedePasarA(desde, hasta)).toBe(false);
  });
});

describe('validarNota', () => {
  test('acepta notas dentro del rango y con hasta 2 decimales', () => {
    expect(validarNota(0, 10)).toBe(0);
    expect(validarNota(10, 10)).toBe(10);
    expect(validarNota(7.25, 10)).toBe(7.25);
    expect(validarNota(8.1, 10)).toBe(8.1); // en JS 8.1 * 100 no da exacto: igual tiene que aceptarla
  });

  test('rechaza notas fuera de rango', () => {
    expect(() => validarNota(-1, 10)).toThrow('entre 0 y 10');
    expect(() => validarNota(11, 10)).toThrow('entre 0 y 10');
  });

  test('rechaza lo que no es un número', () => {
    expect(() => validarNota('8', 10)).toThrow('debe ser un número');
    expect(() => validarNota(NaN, 10)).toThrow('debe ser un número');
  });

  test('rechaza más de 2 decimales', () => {
    expect(() => validarNota(7.255, 10)).toThrow('2 decimales');
  });

  test('el error lleva el código HTTP 400', () => {
    expect(() => validarNota(50, 10)).toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});

describe('validarFechaCalificacion', () => {
  test('no acepta fechas futuras', () => {
    const futuro = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(() => validarFechaCalificacion(futuro, '2026-01-01')).toThrow('futura');
  });

  test('no acepta fechas anteriores a la evaluación', () => {
    expect(() => validarFechaCalificacion('2026-01-01', '2026-03-10')).toThrow('anterior');
  });
});

describe('calcularPromediosPorMateria', () => {
  const prog = { _id: 'prog', nombre: 'Programación II' };
  const bd = { _id: 'bd', nombre: 'Bases de Datos' };
  const sobre10 = { notaMaxima: 10 };
  const sobre100 = { notaMaxima: 100 };

  test('promedia en escala 0-10 aunque la nota máxima sea distinta', () => {
    const resultado = calcularPromediosPorMateria([
      { materia: prog, evaluacion: sobre10, nota: 8, estado: 'publicada' },
      { materia: prog, evaluacion: sobre100, nota: 60, estado: 'publicada' }, // = 6 sobre 10
    ]);
    expect(resultado).toEqual([{ materia: prog, cantidadNotas: 2, promedio: 7 }]);
  });

  test('no cuenta las notas anuladas', () => {
    const resultado = calcularPromediosPorMateria([
      { materia: bd, evaluacion: sobre10, nota: 9, estado: 'publicada' },
      { materia: bd, evaluacion: sobre10, nota: 1, estado: 'anulada' },
    ]);
    expect(resultado[0].promedio).toBe(9);
    expect(resultado[0].cantidadNotas).toBe(1);
  });

  test('si todas están anuladas el promedio es null', () => {
    const resultado = calcularPromediosPorMateria([{ materia: bd, evaluacion: sobre10, nota: 5, estado: 'anulada' }]);
    expect(resultado[0].promedio).toBeNull();
  });
});
