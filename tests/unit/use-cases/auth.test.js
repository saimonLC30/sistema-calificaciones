// TESTS UNITARIOS de los casos de uso de autenticación.
// Usan repositorios en memoria y servicios falsos: no hace falta MongoDB.
const { crearEscenario } = require('../../helpers/escenario');

describe('Casos de uso de Auth', () => {
  let e;
  beforeEach(async () => {
    e = await crearEscenario();
  });

  describe('registrarUsuario', () => {
    test('registra siempre como alumno aunque manden otro rol', async () => {
      const { usuario, token } = await e.contenedor.auth.registrarUsuario({
        nombre: 'Pedro',
        email: 'Pedro@Mail.com',
        password: 'secreto123',
        rol: 'admin', // intento de escalar privilegios
      });
      expect(usuario.rol).toBe('alumno');
      expect(usuario.email).toBe('pedro@mail.com');
      expect(token).toBeDefined();
    });

    test('guarda la contraseña hasheada, nunca en texto plano', async () => {
      await e.contenedor.auth.registrarUsuario({ nombre: 'Pedro', email: 'pedro@mail.com', password: 'secreto123' });
      const guardado = e.repos.db.usuarios.find((u) => u.email === 'pedro@mail.com');
      expect(guardado.password).not.toBe('secreto123');
    });

    test('no devuelve la contraseña', async () => {
      const { usuario } = await e.contenedor.auth.registrarUsuario({ nombre: 'P', email: 'p@mail.com', password: '123456' });
      expect(usuario.password).toBeUndefined();
    });

    test('rechaza un email repetido con 409', async () => {
      await expect(
        e.contenedor.auth.registrarUsuario({ nombre: 'Otra Ana', email: 'ana@mail.com', password: '123456' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('rechaza contraseñas cortas con 400', async () => {
      await expect(
        e.contenedor.auth.registrarUsuario({ nombre: 'P', email: 'p@mail.com', password: '123' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('iniciarSesion', () => {
    test('con datos correctos devuelve token y usuario', async () => {
      const r = await e.contenedor.auth.iniciarSesion({ email: 'gomez@mail.com', password: e.PASSWORD });
      expect(r.token).toBeDefined();
      expect(r.usuario).toMatchObject({ email: 'gomez@mail.com', rol: 'docente' });
    });

    test('con contraseña incorrecta da 401 y el mismo mensaje que si no existiera', async () => {
      const malPassword = e.contenedor.auth.iniciarSesion({ email: 'gomez@mail.com', password: 'otra' });
      const noExiste = e.contenedor.auth.iniciarSesion({ email: 'nadie@mail.com', password: 'otra' });
      await expect(malPassword).rejects.toMatchObject({ statusCode: 401, message: 'Credenciales inválidas' });
      await expect(noExiste).rejects.toMatchObject({ statusCode: 401, message: 'Credenciales inválidas' });
    });

    test('frena intentos de inyección NoSQL (email como objeto)', async () => {
      await expect(
        e.contenedor.auth.iniciarSesion({ email: { $ne: null }, password: 'x' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('autenticarToken', () => {
    test('con un token válido devuelve el usuario', async () => {
      const usuario = await e.contenedor.auth.autenticarToken(`token-de-${e.usuarios.ana._id}`);
      expect(usuario.email).toBe('ana@mail.com');
    });

    test('sin token o con token inválido da 401', async () => {
      await expect(e.contenedor.auth.autenticarToken(undefined)).rejects.toMatchObject({ statusCode: 401 });
      await expect(e.contenedor.auth.autenticarToken('cualquier-cosa')).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
