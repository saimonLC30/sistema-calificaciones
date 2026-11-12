# Sistema de Gestión de Calificaciones

API REST para gestionar las notas de una institución, hecha con **Node.js, Express y MongoDB**.
Tiene tres roles: el **admin** gestiona usuarios y materias, el **docente** carga y publica notas
de las materias que dicta, y el **alumno** ve solo sus notas publicadas.

**Tecnologías:** Express · MongoDB + Mongoose · JWT · bcrypt · helmet · Jest + Supertest

## Cómo correrlo

Requisitos: Node.js 18 o superior y MongoDB corriendo.

```bash
npm install
cp .env.example .env   # poné un JWT_SECRET de 32 caracteres o más
npm run seed           # carga datos de prueba (borra la base)
npm run dev            # API en http://localhost:3000
npm test               # corre los tests (no necesita MongoDB)
```

Usuarios de prueba (contraseña `123456` para todos):

| Rol     | Email                                   |
|---------|-----------------------------------------|
| Admin   | admin@mail.com                          |
| Docente | gomez@mail.com (Programación II) · ruiz@mail.com (Bases de Datos) |
| Alumno  | ana@mail.com · juan@mail.com · sofia@mail.com |

## Arquitectura

El código está organizado con **Clean Architecture**: cuatro capas, y las dependencias
apuntan siempre hacia adentro. El dominio no conoce ni Express ni MongoDB.

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

| Carpeta (`src/`)    | Qué hay                                                              |
|---------------------|----------------------------------------------------------------------|
| `domain/`           | Reglas del negocio: estados de una nota, validaciones, permisos      |
| `use-cases/`        | Una acción del sistema por archivo (crear nota, publicarla, ...)     |
| `repositories/`     | El único lugar que habla con MongoDB                                 |
| `models/`           | Esquemas de Mongoose                                                 |
| `services/`         | JWT (`tokenService`) y contraseñas con bcrypt (`passwordService`)    |
| `controllers/`      | Reciben la petición, llaman al caso de uso y responden               |
| `routes/`           | Las rutas y los middlewares de cada una                              |
| `middlewares/`      | `proteger` (token), `autorizar` (rol), `errorHandler`                |
| `container.js`      | Le pasa a cada caso de uso sus repositorios (inyección de dependencias) |

**Ejemplo: el docente publica una nota** (`PATCH /api/calificaciones/:id/estado`)

```
ruta → proteger (¿token válido? si no, 401) → autorizar (¿docente o admin? si no, 403)
     → controlador → caso de uso cambiarEstadoCalificacion.js
         → domain/permisos.js      ¿dicta esta materia?            (si no, 403)
         → domain/calificacion.js  ¿se puede pasar a "publicada"?  (si no, 409)
         → repositorio → MongoDB   guarda el cambio y el historial
```

## Modelo de datos

```
Materia ── docentes[], alumnos[] ──> User
Evaluacion ── materia ──> Materia                    (tipo, fecha, notaMaxima)
Calificacion ── alumno, docente, materia, evaluacion  (nota, estado, historial)
```

- Un alumno tiene **una sola nota por evaluación**.
- Cada nota guarda un **historial**: quién la cambió, cuándo, la nota anterior y el motivo.

**Estados de una nota:**

```
pendiente ──> publicada ──> revisada
    │             │            │
    └──────> anulada <─────────┘
```

El alumno solo ve las notas `publicada` y `revisada`. Una nota publicada no puede volver a
`pendiente`: si hay un error se corrige (pasa a `revisada`) o se anula, siempre con motivo.

**Permisos:**

| Acción                          | Alumno           | Docente         | Admin |
|---------------------------------|------------------|-----------------|-------|
| Ver materias y calificaciones   | Solo las suyas   | De sus materias | Todas |
| Crear evaluaciones y notas      | –                | De sus materias | ✔     |
| Gestionar usuarios y materias   | –                | –               | ✔     |

## Seguridad

- Contraseñas hasheadas con **bcrypt**; nunca se devuelven en las respuestas.
- **JWT** con vencimiento; el secreto está en `.env`, que no se sube a Git.
- Autorización en dos niveles: por **rol** (middleware) y por **materia** (`domain/permisos.js`).
- El registro público siempre crea alumnos, aunque se mande otro rol.
- Validación de tipos contra **inyección NoSQL**.
- **helmet**, **CORS** configurable, **rate limit** en el login y límite de tamaño de las peticiones.

## Patrones de diseño

| Patrón                        | Dónde                                         |
|-------------------------------|-----------------------------------------------|
| Repository                    | `repositories/`                               |
| Inyección de dependencias     | casos de uso + `container.js`                 |
| Factory                       | `crearApp`, `crearContenedor`, servicios      |
| Chain of Responsibility       | middlewares: `proteger` → `autorizar` → controlador |
| Máquina de estados            | `domain/calificacion.js` (`TRANSICIONES`)     |
| Singleton                     | conexión a MongoDB (`config/db.js`)           |
| Manejo centralizado de errores | `AppError` + `catchAsync` + `errorHandler`   |

## Tests

`npm test` corre **86 tests**: unitarios (dominio y casos de uso) y de integración
(la API completa por HTTP con Supertest). No necesitan MongoDB: los casos de uso
reciben repositorios en memoria (`tests/helpers/repositoriosEnMemoria.js`).

## Postman y MongoDB Compass

- **Postman:** importá `postman/Sistema-Calificaciones.postman_collection.json`. Ejecutá
  primero la carpeta **1. Login** (guarda los tokens sola) y después las demás en orden.
- **Compass:** conectate a `mongodb://127.0.0.1:27017`, base `calificaciones`. Las colecciones
  son `users`, `materias`, `evaluacions` y `calificacions`.

## Endpoints

Todas las rutas, salvo login, registro y salud, necesitan `Authorization: Bearer <token>`.

| Módulo         | Rutas                                                                 | Quién |
|----------------|-----------------------------------------------------------------------|-------|
| Auth           | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | Todos |
| Salud          | `GET /api/salud`                                                      | Todos |
| Usuarios       | `GET` · `POST /api/usuarios` · `PATCH /api/usuarios/:id/rol`          | Admin |
| Materias       | `GET /api/materias` · `GET /api/materias/:id`                         | Todos |
|                | `POST` · `PUT` · `DELETE /api/materias/:id` · `POST/DELETE /api/materias/:id/alumnos` | Admin |
| Evaluaciones   | `GET /api/evaluaciones` · `GET /api/evaluaciones/:id`                 | Todos |
|                | `POST` · `PUT` · `DELETE /api/evaluaciones/:id`                       | Docente / Admin |
| Calificaciones | `GET /api/calificaciones` (filtros: alumno, materia, periodo, tipo, estado, desde, hasta) | Todos* |
|                | `GET /api/calificaciones/mis-calificaciones`                          | Alumno |
|                | `GET /api/calificaciones/alumno/:id` · `GET /api/calificaciones/:id`  | Todos* |
|                | `POST` · `PUT /:id` · `PATCH /:id/estado` · `DELETE /:id`             | Docente / Admin |

\* Cada rol ve solo lo que le corresponde (ver Permisos).
