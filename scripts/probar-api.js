// Prueba rápida de la API REAL (con MongoDB), de punta a punta.
// Uso:  1) npm run seed   2) npm run dev   3) en otra terminal: npm run probar
// Hace lo mismo que harías a mano en Postman y muestra ✔ o ✘ en cada paso.
require('dotenv').config();

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
let fallas = 0;

const llamar = async (metodo, ruta, { token, body } = {}) => {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const chequear = (descripcion, ok, detalle = '') => {
  console.log(`${ok ? '✔' : '✘'} ${descripcion}${!ok && detalle ? `  -> ${detalle}` : ''}`);
  if (!ok) fallas += 1;
};

const login = async (email) => (await llamar('POST', '/api/auth/login', { body: { email, password: '123456' } })).body.token;

const main = async () => {
  console.log(`Probando ${BASE}\n`);

  const salud = await llamar('GET', '/');
  chequear('La API responde', salud.status === 200);

  const docente = await login('gomez@mail.com');
  const alumna = await login('ana@mail.com');
  chequear('Login de docente y alumna (devuelven token)', Boolean(docente && alumna), '¿corriste npm run seed?');
  if (!docente || !alumna) return;

  const lista = await llamar('GET', '/api/calificaciones', { token: docente });
  chequear(`Docente lista calificaciones de sus materias (${lista.body.total})`, lista.status === 200, lista.body.message);

  const mias = await llamar('GET', '/api/calificaciones/mis-calificaciones', { token: alumna });
  chequear(`Alumna ve sus calificaciones publicadas (${mias.body.total})`, mias.status === 200, mias.body.message);

  const sinToken = await llamar('GET', '/api/calificaciones');
  chequear('Sin token -> 401', sinToken.status === 401, `dio ${sinToken.status}`);

  const prohibido = await llamar('GET', '/api/usuarios', { token: alumna });
  chequear('Alumna en /api/usuarios -> 403', prohibido.status === 403, `dio ${prohibido.status}`);

  // Caso de uso completo: crear evaluación -> cargar nota -> publicarla
  const materias = await llamar('GET', '/api/materias', { token: docente });
  const prog = materias.body.resultados?.[0];
  chequear('Docente ve sus materias', Boolean(prog), materias.body.message);
  if (!prog) return;

  const detalle = await llamar('GET', `/api/materias/${prog._id}`, { token: docente });
  const ana = detalle.body.materia?.alumnos?.find((a) => a.email === 'ana@mail.com');

  const hoy = new Date().toISOString().slice(0, 10);
  const ev = await llamar('POST', '/api/evaluaciones', {
    token: docente,
    body: { materia: prog._id, titulo: `Prueba automática ${new Date().toLocaleString()}`, tipo: 'otro', fecha: hoy },
  });
  chequear('Docente crea una evaluación', ev.status === 201, ev.body.message);
  if (ev.status !== 201 || !ana) return;

  const nota = await llamar('POST', '/api/calificaciones', {
    token: docente,
    body: { alumno: ana._id, evaluacion: ev.body.evaluacion._id, nota: 9, observaciones: 'Cargada por probar-api' },
  });
  chequear('Docente carga una nota (queda pendiente)', nota.status === 201 && nota.body.calificacion?.estado === 'pendiente', nota.body.message);
  if (nota.status !== 201) return;
  const id = nota.body.calificacion._id;

  const antes = await llamar('GET', '/api/calificaciones/mis-calificaciones', { token: alumna });
  chequear('La alumna todavía NO la ve', !antes.body.calificaciones?.some((c) => c._id === id));

  const pub = await llamar('PATCH', `/api/calificaciones/${id}/estado`, { token: docente, body: { estado: 'publicada' } });
  chequear('Docente la publica', pub.status === 200 && pub.body.calificacion?.estado === 'publicada', pub.body.message);

  const despues = await llamar('GET', '/api/calificaciones/mis-calificaciones', { token: alumna });
  chequear('Ahora la alumna SÍ la ve', despues.body.calificaciones?.some((c) => c._id === id));

  const volver = await llamar('PATCH', `/api/calificaciones/${id}/estado`, { token: docente, body: { estado: 'pendiente' } });
  chequear('No se puede volver de publicada a pendiente -> 409', volver.status === 409, `dio ${volver.status}`);
};

main()
  .catch((error) => {
    fallas += 1;
    console.error(`✘ No se pudo conectar con ${BASE}. ¿Está corriendo "npm run dev"?\n  ${error.message}`);
  })
  .finally(() => {
    console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\nTodo OK ✅');
    process.exitCode = fallas ? 1 : 0;
  });
