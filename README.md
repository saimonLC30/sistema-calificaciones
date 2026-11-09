# Sistema de Gestión de Calificaciones

API REST en **Node.js + Express + MongoDB (Mongoose)** con autenticación **JWT**,
permisos por rol (`admin`, `docente`, `alumno`), organizada con Clean Architecture
y con tests automáticos (Jest + Supertest).

## Tecnologías

| Para qué                     | Qué se usa                                  |
|------------------------------|---------------------------------------------|
| Servidor HTTP                | Express                                     |
| Base de datos                | MongoDB + Mongoose                          |
| Autenticación                | JSON Web Tokens (`jsonwebtoken`)            |
| Contraseñas                  | `bcryptjs` (hash con salt)                  |
| Seguridad HTTP               | `helmet`, `cors`, `express-rate-limit`      |
| Tests                        | Jest (unitarios) + Supertest (integración)  |

## Puesta en marcha

Requisitos: Node.js 18 o superior y MongoDB corriendo (local o Atlas).

```bash
npm install
cp .env.example .env   # y editá JWT_SECRET con un valor largo y aleatorio (mín. 32 caracteres)
npm run seed           # carga datos de prueba (⚠️ borra la base)
npm run dev            # levanta la API en http://localhost:3000
```

| Comando                  | Qué hace                                                        |
|--------------------------|-----------------------------------------------------------------|
| `npm run dev`            | Levanta la API con nodemon (se reinicia al guardar)             |
| `npm start`              | Levanta la API sin nodemon                                      |
| `npm run seed`           | Borra la base y carga usuarios, materias, evaluaciones y notas  |
| `npm test`               | Corre todos los tests (no necesita MongoDB)                     |
| `npm run test:cobertura` | Tests + reporte de cobertura en `coverage/`                     |
| `npm run probar`         | Prueba la API real de punta a punta (con `npm run dev` corriendo) |

El seed crea estos usuarios, todos con contraseña `123456`:

| Rol                         | Email            |
|-----------------------------|------------------|
| admin                       | admin@mail.com   |
| docente (Programación II)   | gomez@mail.com   |
| docente (Bases de Datos)    | ruiz@mail.com    |
| alumno                      | ana@mail.com     |
| alumno                      | juan@mail.com    |
| alumno                      | sofia@mail.com   |

---

## Arquitectura (Clean Architecture)

El código está separado en **capas**. Cada capa tiene una sola responsabilidad y
**las dependencias apuntan siempre hacia adentro**: el dominio no sabe nada de
Express ni de MongoDB.

```
        ┌───────────────────────────────────────────────────────────┐
        │  INTERFAZ HTTP   routes/ → middlewares/ → controllers/    │
        │  ┌─────────────────────────────────────────────────────┐  │
        │  │  CASOS DE USO   use-cases/                          │  │
        │  │  ┌───────────────────────────────────────────────┐  │  │
        │  │  │  DOMINIO   domain/  (reglas de negocio puras) │  │  │
        │  │  └───────────────────────────────────────────────┘  │  │
        │  └─────────────────────────────────────────────────────┘  │
        │  INFRAESTRUCTURA   repositories/ + models/ + services/    │
        └───────────────────────────────────────────────────────────┘
                     container.js conecta todas las piezas
```

| Capa                | Carpeta                         | Responsabilidad                                                                 | ¿Conoce Express / MongoDB? |
|---------------------|---------------------------------|---------------------------------------------------------------------------------|----------------------------|
| **Dominio**         | `src/domain/`                   | Reglas del negocio: estados de una nota, validaciones, permisos, promedios      | No                         |
| **Casos de uso**    | `src/use-cases/`                | Una acción del sistema por archivo (crear nota, publicarla, ver historial...)   | No                         |
| **Infraestructura** | `src/repositories/`, `src/models/`, `src/services/`, `src/config/` | Guardar y leer de MongoDB, hashear contraseñas, firmar tokens | Sí (solo esta capa usa Mongoose) |
| **Interfaz HTTP**   | `src/routes/`, `src/middlewares/`, `src/controllers/` | Recibir la petición, verificar token y rol, responder JSON     | Sí (solo Express)          |
| **Composición**     | `src/container.js`, `src/app.js`, `src/server.js` | Armar todo: casos de uso + repositorios + servicios       | —                          |

### ¿Por qué así?

- **Cada cosa en su lugar**: si cambia una regla de negocio se toca `domain/` o `use-cases/`; si cambia la base de datos, solo `repositories/`.
- **Los casos de uso reciben sus dependencias por parámetro** (inyección de dependencias). En producción reciben los repositorios de MongoDB; en los tests reciben repositorios en memoria con las mismas funciones. Por eso `npm test` corre sin base de datos.
- **Los controladores no tienen lógica**: solo pasan datos de la petición al caso de uso y devuelven la respuesta.

### Recorrido de una petición: el docente publica una nota

```
PATCH /api/calificaciones/:id/estado   { "estado": "publicada" }
  │
  ├─ routes/calificacion.routes.js        define la ruta y su cadena de middlewares
  ├─ middlewares/auth.js → proteger       verifica el JWT y carga req.user          (401 si falla)
  ├─ middlewares/auth.js → autorizar      ¿es docente o admin?                       (403 si no)
  ├─ controllers/calificacion.controller  toma id + body y llama al caso de uso
  ├─ use-cases/calificaciones/cambiarEstadoCalificacion.js
  │     ├─ domain/permisos.js             ¿este docente dicta ESTA materia?           (403 si no)
  │     ├─ domain/calificacion.js         ¿se puede pasar de "pendiente" a "publicada"? (409 si no)
  │     └─ repositories/calificacion.repository.js → MongoDB   guarda + historial
  └─ si algo falla en cualquier paso → middlewares/errorHandler.js responde el JSON de error
```

### ¿Dónde está cada cosa?

| Quiero ver...                                         | Archivo                                                         |
|-------------------------------------------------------|-----------------------------------------------------------------|
| Los estados de una nota y qué cambios se permiten     | `src/domain/calificacion.js` (`TRANSICIONES`, `puedePasarA`)    |
| Cómo se valida una nota (0 a máx., 2 decimales)       | `src/domain/calificacion.js` (`validarNota`)                    |
| Cómo se calcula el promedio                           | `src/domain/calificacion.js` (`calcularPromediosPorMateria`)    |
| Quién puede ver / gestionar qué                       | `src/domain/permisos.js`                                        |
| Cargar una nota                                       | `src/use-cases/calificaciones/crearCalificacion.js`             |
| Publicar / anular una nota                            | `src/use-cases/calificaciones/cambiarEstadoCalificacion.js`     |
| Corregir una nota (pasa a "revisada")                 | `src/use-cases/calificaciones/modificarCalificacion.js`         |
| Qué notas ve cada rol en el listado                   | `src/use-cases/calificaciones/listarCalificaciones.js`          |
| Login y registro                                      | `src/use-cases/auth/iniciarSesion.js`, `registrarUsuario.js`    |
| Verificación del token                                | `src/use-cases/auth/autenticarToken.js` + `src/middlewares/auth.js` |
| Restricción por rol                                   | `src/middlewares/auth.js` (`autorizar`)                         |
| Firma y verificación de JWT                           | `src/services/tokenService.js`                                  |
| Hash de contraseñas                                   | `src/services/passwordService.js`                               |
| Consultas a MongoDB                                   | `src/repositories/*.repository.js`                              |
| Esquemas de la base                                   | `src/models/*.js`                                               |
| Headers de seguridad, CORS y rate limit               | `src/app.js`                                                    |
| Manejo de errores                                     | `src/utils/AppError.js` + `src/middlewares/errorHandler.js`     |
| Dónde se conectan casos de uso y repositorios         | `src/container.js`                                              |

### Estructura de carpetas

```
postman/
└── Sistema-Calificaciones.postman_collection.json   # colección para importar en Postman
scripts/
├── seed.js                     # datos de prueba
└── probar-api.js               # prueba la API real de punta a punta
src/
├── domain/                     # DOMINIO: reglas puras
│   ├── calificacion.js         #   estados, transiciones, validarNota, promedios
│   ├── permisos.js             #   quién puede ver/gestionar qué
│   ├── materia.js, evaluacion.js, usuario.js, roles.js
├── use-cases/                  # CASOS DE USO: un archivo por acción
│   ├── auth/                   #   registrarUsuario, iniciarSesion, autenticarToken
│   ├── usuarios/               #   listarUsuarios, crearUsuario, cambiarRol
│   ├── materias/               #   crear, listar, obtener, actualizar, eliminar, inscribir, desinscribir
│   ├── evaluaciones/           #   crear, listar, obtener, actualizar, eliminar
│   └── calificaciones/         #   crear, listar, verHistorialAlumno, ver, modificar, cambiarEstado, eliminar
├── repositories/               # INFRAESTRUCTURA: único lugar que habla con MongoDB
├── models/                     # INFRAESTRUCTURA: esquemas de Mongoose
├── services/                   # INFRAESTRUCTURA: tokenService (JWT), passwordService (bcrypt)
├── config/db.js                # conexión a MongoDB
├── controllers/                # INTERFAZ HTTP: reciben la petición y llaman al caso de uso
├── routes/                     # INTERFAZ HTTP: rutas + middlewares de cada una
├── middlewares/                # proteger, autorizar, errorHandler
├── utils/                      # AppError, catchAsync, validaciones genéricas
├── container.js                # arma los casos de uso con sus dependencias
├── app.js                      # crea la app de Express (seguridad + rutas)
└── server.js                   # punto de entrada: conecta MongoDB y levanta el servidor
tests/
├── unit/domain/                # reglas del dominio
├── unit/use-cases/             # casos de uso con repositorios en memoria
├── integration/api.test.js     # la API entera por HTTP con Supertest
└── helpers/                    # repositorios en memoria y datos de prueba
```

---

## Casos de uso por rol

**Alumno**
- Registrarse e iniciar sesión.
- Ver las materias que cursa y sus evaluaciones.
- Ver sus calificaciones publicadas o revisadas, con promedio por materia (`/mis-calificaciones`).

**Docente**
- Ver las materias que dicta, sus alumnos y evaluaciones.
- Crear, modificar y eliminar evaluaciones de sus materias.
- Cargar notas (quedan *pendientes*), publicarlas, corregirlas (pasan a *revisadas*, con motivo) y anularlas.
- Ver el historial de un alumno en sus materias.

**Administrador**
- Todo lo anterior sobre cualquier materia.
- Crear usuarios con cualquier rol y cambiar roles.
- Crear materias, asignar docentes, inscribir y desinscribir alumnos.

## Modelo de datos

```
User (alumno | docente | admin)
  │
Materia ── docentes[] ──> User (docente)
  │     └─ alumnos[]  ──> User (alumno)
  │
Evaluacion ── materia ──> Materia        (tipo, fecha, notaMaxima)
  │
Calificacion ── alumno, docente ──> User
             ── materia ──> Materia
             ── evaluacion ──> Evaluacion
             (nota, fecha, observaciones, estado, historial de cambios)
```

- Una **materia** es una cursada en un período (`2026-1C`, `2026-2C`, `2026-ANUAL`).
- Un alumno tiene **una sola calificación por evaluación**.
- La materia de una calificación se toma siempre de la evaluación, así nunca quedan inconsistentes.
- Cada calificación guarda un **historial** de cambios: quién, cuándo, nota anterior/nueva y motivo.

### Estados de una calificación

```
pendiente ──> publicada ──> revisada
    │             │            │
    └──────> anulada <─────────┘
```

| Estado      | Significado                                       | ¿La ve el alumno? |
|-------------|---------------------------------------------------|-------------------|
| `pendiente` | Cargada por el docente, todavía no publicada      | No                |
| `publicada` | Visible para el alumno                            | Sí                |
| `revisada`  | Se corrigió la nota después de publicarla         | Sí                |
| `anulada`   | Sin efecto. Es un estado final                    | No                |

- Si se modifica la nota de una calificación publicada, pasa sola a `revisada` y hay que indicar un `motivo`.
- Para `anulada` o `revisada` (por cambio de estado) el `motivo` es obligatorio.
- Un docente solo puede **eliminar** calificaciones `pendiente`; si ya se publicó, se anula.

## Permisos por rol

| Acción                                   | Alumno            | Docente                   | Admin |
|------------------------------------------|-------------------|---------------------------|-------|
| Ver materias                             | Las que cursa     | Las que dicta             | Todas |
| Crear/editar materias, inscribir alumnos | –                 | –                         | ✔     |
| Crear/editar evaluaciones                | –                 | De sus materias           | ✔     |
| Registrar / modificar calificaciones     | –                 | De sus materias           | ✔     |
| Ver calificaciones                       | Solo las suyas, publicadas o revisadas | De sus materias | Todas |
| Gestionar usuarios y roles               | –                 | –                         | ✔     |

## Probar con Postman y ver los datos en MongoDB Compass

### Postman

En `postman/Sistema-Calificaciones.postman_collection.json` está la colección con todas las rutas.

1. En Postman: **Import** → elegí ese archivo.
2. Con `npm run seed` y `npm run dev` corriendo, abrí la carpeta **1. Login** y ejecutá los tres logins: los tokens se guardan solos en las variables de la colección.
3. Seguí las carpetas en orden. Cada request guarda los ids que necesita la siguiente (`materiaId`, `alumnaId`, `evaluacionId`, `calificacionId`).
4. Para probar todo de una vez: clic derecho en la colección → **Run collection**. Cada request tiene tests y muestra ✔ o ✘.

| Carpeta                     | Qué muestra                                                                  |
|-----------------------------|------------------------------------------------------------------------------|
| 0. Salud                    | Que la API responde y que MongoDB está conectado (`GET /api/salud`)          |
| 1. Login                    | Login de cada rol y registro público (siempre crea alumnos)                  |
| 2. Materias y evaluaciones  | El docente ve sus materias y alumnos, y crea una evaluación                  |
| 3. Calificaciones           | Cargar → la alumna no la ve → publicar → la ve → corregir → no vuelve a pendiente |
| 4. Seguridad                | 401, 403, nota fuera de rango e intentos de inyección NoSQL                  |
| 5. Administración           | Usuarios, roles y materias                                                   |

Si tu API corre en otro puerto, cambiá la variable `baseUrl` de la colección.

### MongoDB Compass

1. Abrí Compass y conectate con la misma URI del `.env`: `mongodb://127.0.0.1:27017`.
2. Entrá a la base **`calificaciones`** (el nombre que va al final de `MONGO_URI`).
3. Mongoose guarda cada modelo en una colección con el nombre en plural:

| Modelo         | Colección en Compass | Qué ver                                                     |
|----------------|----------------------|-------------------------------------------------------------|
| `User`         | `users`              | La contraseña guardada como hash de bcrypt (`$2a$10$...`)   |
| `Materia`      | `materias`           | Los arrays `docentes` y `alumnos` con ids                   |
| `Evaluacion`   | `evaluacions`        | La evaluación que crea Postman en la carpeta 2              |
| `Calificacion` | `calificacions`      | El `estado` cambiando y el `historial` de cada cambio       |

Para la demo funciona muy bien tener Compass al lado de Postman: publicás una nota en Postman, tocás **Refresh** en Compass y se ve el cambio de estado y la entrada nueva en `historial`.

## Seguridad

| Medida                                         | Dónde                                         | Qué evita                                                |
|------------------------------------------------|-----------------------------------------------|----------------------------------------------------------|
| Contraseñas hasheadas con **bcrypt** (con salt)| `services/passwordService.js`                 | Que se lean las contraseñas si roban la base             |
| La contraseña nunca se devuelve                | `models/User.js` (`select: false`), `domain/usuario.js` (`formatoUsuario`) | Filtrar contraseñas en respuestas |
| **JWT** con vencimiento y algoritmo fijo (HS256)| `services/tokenService.js`                   | Tokens eternos o firmados con otro algoritmo             |
| Secreto JWT en `.env` (mín. 32 caracteres), `.env` en `.gitignore` | `server.js`, `.gitignore`  | Subir secretos al repositorio                            |
| Autenticación en cada ruta privada             | `middlewares/auth.js` (`proteger`)            | Acceso sin login (401)                                   |
| Autorización por rol                           | `middlewares/auth.js` (`autorizar`)           | Que un alumno use rutas de docente/admin (403)           |
| Autorización por recurso                       | `domain/permisos.js`                          | Que un docente toque notas de una materia que no dicta   |
| El registro público siempre crea alumnos       | `use-cases/auth/registrarUsuario.js`          | Escalada de privilegios (`"rol": "admin"` en el body)    |
| Mismo mensaje si el email no existe o la contraseña es incorrecta | `use-cases/auth/iniciarSesion.js` | Averiguar qué emails están registrados          |
| Validación de tipos (texto, ids, enums)        | `utils/validaciones.js`, `domain/*`           | Inyección NoSQL (`{"$ne": null}`, `?estado[$ne]=x`)      |
| `usuarioActual` se pone después del body        | `controllers/*`                               | Que el cliente se haga pasar por otro usuario            |
| **helmet** (headers seguros) y sin `X-Powered-By` | `app.js`                                   | Clickjacking, sniffing de contenido, revelar tecnología  |
| **CORS** solo para orígenes configurados       | `app.js`, `CORS_ORIGIN` en `.env`             | Que cualquier página web llame a la API                  |
| **Rate limit**: 10 logins fallidos / 15 min por IP, 300 peticiones / 15 min | `app.js`         | Fuerza bruta de contraseñas y abuso                      |
| Límite de tamaño del body (10 kb)              | `app.js`                                      | Saturar el servidor con JSONs enormes                    |
| Errores sin detalles internos                  | `middlewares/errorHandler.js`                 | Mostrar stack traces o datos internos                    |
| Historial de cambios de cada nota              | `use-cases/calificaciones/*`                  | Cambios de notas sin registro (auditoría)                |

## Patrones de diseño usados

| Patrón                                   | Dónde                                                    | Para qué                                                              |
|------------------------------------------|----------------------------------------------------------|-----------------------------------------------------------------------|
| **Clean Architecture / capas**           | `domain/`, `use-cases/`, `repositories/`, `controllers/` | Separar reglas de negocio de los detalles técnicos                    |
| **Repository**                           | `src/repositories/`                                      | Esconder MongoDB detrás de funciones simples (`buscarPorId`, `listar`) |
| **Inyección de dependencias**            | casos de uso, `container.js`                             | Los casos de uso reciben repositorios y servicios por parámetro       |
| **Factory**                              | `crearApp`, `crearContenedor`, `tokenService({...})`, controladores y rutas | Crear objetos ya configurados              |
| **Composition Root**                     | `src/container.js`                                       | Un único lugar donde se conectan todas las piezas                     |
| **Chain of Responsibility (middlewares)**| `routes/*` → `proteger` → `autorizar` → controlador      | Cada eslabón valida algo y pasa al siguiente o corta                  |
| **State (máquina de estados)**           | `domain/calificacion.js` (`TRANSICIONES`)                | Controlar los cambios de estado de una nota                           |
| **Singleton**                            | `config/db.js` (conexión de Mongoose)                    | Una sola conexión a la base compartida por toda la app                |
| **Manejo centralizado de errores**       | `AppError` + `catchAsync` + `errorHandler`               | Todos los errores se responden igual, sin try/catch repetidos         |
| **Decorator / wrapper**                  | `utils/catchAsync.js`                                    | Envolver funciones async para mandar sus errores al `errorHandler`    |
| **Test Double (fake)**                   | `tests/helpers/repositoriosEnMemoria.js`                 | Reemplazar la base de datos en los tests                              |

## Tests

```bash
npm test                 # todos los tests
npm run test:cobertura   # + reporte de cobertura (abrí coverage/lcov-report/index.html)
```

No necesitan MongoDB: gracias a la inyección de dependencias, los casos de uso
reciben **repositorios en memoria** (`tests/helpers/repositoriosEnMemoria.js`)
que tienen las mismas funciones que los de MongoDB.

| Tipo                     | Archivo                                              | Qué prueba                                                              |
|--------------------------|------------------------------------------------------|-------------------------------------------------------------------------|
| Unitario (dominio)       | `tests/unit/domain/calificacion.test.js`             | Transiciones de estado, validación de notas y fechas, promedios        |
| Unitario (dominio)       | `tests/unit/domain/permisos.test.js`                 | Qué puede ver y gestionar cada rol                                      |
| Unitario (casos de uso)  | `tests/unit/use-cases/auth.test.js`                  | Registro, login, hash, inyección NoSQL, verificación del token         |
| Unitario (casos de uso)  | `tests/unit/use-cases/calificaciones.test.js`        | Cargar, publicar, corregir, anular y eliminar notas; qué ve cada rol    |
| Unitario (casos de uso)  | `tests/unit/use-cases/materias-evaluaciones.test.js` | Reglas de materias, evaluaciones y usuarios                             |
| Integración (HTTP)       | `tests/integration/api.test.js`                      | La API completa: 401, 403, 404, 413, 429, CORS, helmet y el flujo de una nota |

`npm run probar` complementa los tests: con la API real levantada (MongoDB),
hace login con distintos roles, carga una nota, la publica y verifica que el alumno
la vea solo después de publicada.

## Endpoints

Todas las rutas (salvo registro y login) necesitan el header
`Authorization: Bearer TU_TOKEN`.

### Auth
| Método | Ruta                 | Descripción                      |
|--------|----------------------|----------------------------------|
| POST   | `/api/auth/register` | Registra un usuario (rol alumno) |
| POST   | `/api/auth/login`    | Inicia sesión y devuelve token   |
| GET    | `/api/auth/me`       | Devuelve el usuario autenticado  |

### Salud
| Método | Ruta          | Descripción                                           |
|--------|---------------|-------------------------------------------------------|
| GET    | `/api/salud`  | ¿La API responde y MongoDB está conectado? (sin token) |

### Usuarios (solo admin)
| Método | Ruta                     | Descripción                           |
|--------|--------------------------|---------------------------------------|
| GET    | `/api/usuarios?rol=&q=`  | Lista usuarios (filtra por rol/texto) |
| POST   | `/api/usuarios`          | Crea un usuario con cualquier rol     |
| PATCH  | `/api/usuarios/:id/rol`  | Cambia el rol                         |

### Materias
| Método | Ruta                                  | Quién       |
|--------|---------------------------------------|-------------|
| GET    | `/api/materias?periodo=`              | Todos       |
| GET    | `/api/materias/:id`                   | Todos       |
| POST   | `/api/materias`                       | Admin       |
| PUT    | `/api/materias/:id`                   | Admin       |
| DELETE | `/api/materias/:id`                   | Admin       |
| POST   | `/api/materias/:id/alumnos`           | Admin       |
| DELETE | `/api/materias/:id/alumnos/:alumnoId` | Admin       |

### Evaluaciones
| Método | Ruta                                 | Quién           |
|--------|--------------------------------------|-----------------|
| GET    | `/api/evaluaciones?materia=&tipo=`   | Todos           |
| GET    | `/api/evaluaciones/:id`              | Todos           |
| POST   | `/api/evaluaciones`                  | Docente / Admin |
| PUT    | `/api/evaluaciones/:id`              | Docente / Admin |
| DELETE | `/api/evaluaciones/:id`              | Docente / Admin |

Tipos: `parcial`, `recuperatorio`, `trabajo_practico`, `final`, `oral`, `otro`.

### Calificaciones
| Método | Ruta                                       | Quién           | Descripción                          |
|--------|--------------------------------------------|-----------------|--------------------------------------|
| GET    | `/api/calificaciones`                      | Todos           | Lista con filtros y paginación       |
| GET    | `/api/calificaciones/mis-calificaciones`   | Alumno          | Sus notas + promedio por materia     |
| GET    | `/api/calificaciones/alumno/:alumnoId`     | Todos*          | Historial de un alumno               |
| GET    | `/api/calificaciones/:id`                  | Todos*          | Detalle (con historial de cambios)   |
| POST   | `/api/calificaciones`                      | Docente / Admin | Registra una nota                    |
| PUT    | `/api/calificaciones/:id`                  | Docente / Admin | Modifica nota, fecha u observaciones |
| PATCH  | `/api/calificaciones/:id/estado`           | Docente / Admin | Cambia el estado                     |
| DELETE | `/api/calificaciones/:id`                  | Docente / Admin | Elimina                              |

\* Cada rol ve solo lo que le corresponde (ver tabla de permisos).

**Filtros de `GET /api/calificaciones`:** `alumno`, `materia`, `docente`,
`periodo`, `tipo`, `estado`, `desde`, `hasta` (fechas `AAAA-MM-DD`),
`pagina`, `limite` (máx. 100).

## Ejemplos

```bash
# Login como docente
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gomez@mail.com","password":"123456"}'

# Registrar una nota (estado "pendiente" por defecto)
curl -X POST http://localhost:3000/api/calificaciones \
  -H "Authorization: Bearer TU_TOKEN" -H "Content-Type: application/json" \
  -d '{"alumno":"ID_ALUMNO","evaluacion":"ID_EVALUACION","nota":7.5,"observaciones":"Bien"}'

# Publicarla
curl -X PATCH http://localhost:3000/api/calificaciones/ID/estado \
  -H "Authorization: Bearer TU_TOKEN" -H "Content-Type: application/json" \
  -d '{"estado":"publicada"}'

# Corregir una nota ya publicada (pasa a "revisada")
curl -X PUT http://localhost:3000/api/calificaciones/ID \
  -H "Authorization: Bearer TU_TOKEN" -H "Content-Type: application/json" \
  -d '{"nota":8,"motivo":"Error de corrección en el ejercicio 3"}'

# Filtrar: parciales publicados del período 2026-2C
curl "http://localhost:3000/api/calificaciones?periodo=2026-2C&tipo=parcial&estado=publicada" \
  -H "Authorization: Bearer TU_TOKEN"

# Como alumno: ver mis notas
curl http://localhost:3000/api/calificaciones/mis-calificaciones \
  -H "Authorization: Bearer TOKEN_ALUMNO"
```
