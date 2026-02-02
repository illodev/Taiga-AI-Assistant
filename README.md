# Taiga AI Assistant

Asistente inteligente para gestionar proyectos en Taiga usando lenguaje natural.

## 🎯 Descripción

Esta aplicación actúa como un wrapper inteligente de Taiga, añadiendo un asistente de IA capaz de interactuar con proyectos, historias de usuario, tareas, sprints, comentarios y estadísticas mediante conversación natural.

## ✨ Características

- 🤖 **Asistente IA** - Interactúa con Taiga usando lenguaje natural
- 🔗 **URL dinámica** - Conecta a cualquier instancia de Taiga (pública o self-hosted)
- 💬 **Sesiones persistentes** - El historial de chat se guarda en localStorage
- 📝 **Gestión de comentarios** - Lee y crea comentarios en historias y tareas
- 🏷️ **Marcado de IA** - El contenido creado por la IA se marca con `🤖ai-generated`
- 📊 **Estadísticas** - Consulta métricas de proyectos y sprints
- 🔍 **Búsqueda avanzada** - Busca en proyectos con ordenamiento y límites

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         UI (React)                          │
│              Chat Interface + Auth + Sessions               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Route Handlers (Next.js)                   │
│                 /api/chat    /api/auth                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  GitHub Copilot │  │  Tool Executor  │  │  Taiga Client   │
│       SDK       │  │   (21 tools)    │  │  (dynamic URL)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Taiga REST    │
                    │      API        │
                    └─────────────────┘
```

### Principios clave

1. **La IA NO accede directamente a Taiga** - Solo puede usar herramientas explícitas
2. **El backend valida, transforma y ejecuta** - Las acciones pasan por el servidor
3. **No se inventan datos** - Si Taiga no lo devuelve, se responde "no disponible"
4. **Separación clara** entre interpretación (IA), ejecución (código) y presentación (UI)

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js 20+
- pnpm (recomendado) o npm
- Cuenta de Taiga (pública o self-hosted)
- Acceso a GitHub Copilot

### Instalación

```bash
# Clonar e instalar dependencias
cd taiga
pnpm install
```

### Ejecución

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Login

1. Introduce la URL de tu instancia de Taiga (ej: `https://api.taiga.io` o `https://tu-taiga.ejemplo.com`)
2. Introduce tu usuario y contraseña de Taiga
3. ¡Empieza a chatear!

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts       # Autenticación con Taiga
│   │   └── chat/
│   │       └── route.ts       # Endpoint principal del chat (21 herramientas)
│   ├── globals.css            # Estilos globales + Tailwind
│   ├── layout.tsx             # Layout raíz
│   └── page.tsx               # Página principal
├── components/
│   ├── auth/
│   │   ├── auth-provider.tsx  # Contexto de autenticación (token + URL)
│   │   ├── login-form.tsx     # Formulario de login con URL dinámica
│   │   └── index.ts
│   ├── chat/
│   │   ├── chat-interface.tsx # Interfaz principal con sidebar de sesiones
│   │   ├── chat-message.tsx   # Componente de mensaje con Markdown
│   │   ├── chat-input.tsx     # Input del chat
│   │   └── index.ts
│   └── ui/                    # Componentes shadcn/ui
├── hooks/
│   ├── use-chat-storage.ts    # Hook para persistencia de sesiones en localStorage
│   └── use-toast.ts           # Hook para notificaciones
└── lib/
    ├── taiga/
    │   ├── types.ts           # Tipos de Taiga API
    │   ├── client.ts          # Cliente HTTP de Taiga (URL dinámica)
    │   └── index.ts
    └── utils.ts               # Utilidades (cn, etc)
```

## 🛠️ Herramientas disponibles (21)

El asistente tiene acceso a las siguientes herramientas:

### Proyectos

| Herramienta         | Descripción                        |
| ------------------- | ---------------------------------- |
| `get_projects`      | Lista todos los proyectos          |
| `get_project`       | Detalles de un proyecto específico |
| `get_project_stats` | Estadísticas del proyecto          |

### Sprints (Milestones)

| Herramienta           | Descripción                  |
| --------------------- | ---------------------------- |
| `get_milestones`      | Lista sprints de un proyecto |
| `get_milestone`       | Detalles de un sprint        |
| `get_milestone_stats` | Estadísticas del sprint      |

### Historias de Usuario

| Herramienta                 | Descripción                                        |
| --------------------------- | -------------------------------------------------- |
| `get_user_stories`          | Lista historias con filtros, ordenamiento y límite |
| `get_user_story`            | Detalles de una historia                           |
| `search_user_stories`       | Búsqueda por texto                                 |
| `create_user_story`         | Crear nueva historia (con marca 🤖ai-generated)    |
| `update_user_story`         | Actualizar historia                                |
| `get_user_story_comments`   | Leer comentarios de una historia                   |
| `create_user_story_comment` | Crear comentario en una historia                   |

### Tareas

| Herramienta           | Descripción                                     |
| --------------------- | ----------------------------------------------- |
| `get_tasks`           | Lista tareas con filtros, ordenamiento y límite |
| `get_task`            | Detalles de una tarea                           |
| `search_tasks`        | Búsqueda por texto                              |
| `create_task`         | Crear nueva tarea (con marca 🤖ai-generated)    |
| `update_task`         | Actualizar tarea                                |
| `get_task_comments`   | Leer comentarios de una tarea                   |
| `create_task_comment` | Crear comentario en una tarea                   |

### Búsqueda

| Herramienta     | Descripción                    |
| --------------- | ------------------------------ |
| `global_search` | Búsqueda global en un proyecto |

## 💬 Ejemplos de uso

```
Usuario: ¿Cuáles son mis proyectos?
Asistente: [Lista los proyectos del usuario]

Usuario: Dame las últimas 3 historias creadas
Asistente: [Muestra las 3 historias más recientes ordenadas por fecha]

Usuario: Muéstrame el sprint actual del proyecto "Mi App"
Asistente: [Muestra detalles del sprint activo]

Usuario: Crea una historia "Implementar login con Google" en el proyecto X
Asistente: [Crea la historia con tag 🤖ai-generated y confirma]

Usuario: ¿Qué comentarios tiene la historia #123?
Asistente: [Lista los comentarios de la historia]

Usuario: Añade un comentario a la tarea #45 diciendo que está en revisión
Asistente: [Crea el comentario y confirma]

Usuario: ¿Cuántas tareas pendientes hay en el sprint actual?
Asistente: [Calcula y muestra el conteo]

Usuario: Busca historias relacionadas con "autenticación"
Asistente: [Muestra resultados de búsqueda]
```

## 🏷️ Marcado de contenido creado por IA

Cuando la IA crea contenido en Taiga, se marca automáticamente:

- **Historias/Tareas**: Se añade el tag `🤖ai-generated` y al final de la descripción:

  ```
  _🤖 Creado por Taiga AI Assistant_
  ```

- **Comentarios**: Se añade al final del comentario:
  ```
  _🤖 Comentario creado por Taiga AI Assistant_
  ```

## 💾 Persistencia de sesiones

El chat guarda automáticamente:

- Todas las conversaciones en localStorage
- Historial de mensajes por sesión
- Título de cada sesión (editable)
- Agrupación por fecha (Hoy, Ayer, Esta semana, Anteriores)

## 🔐 Seguridad

- El token de Taiga se almacena solo en `localStorage` del navegador
- La URL de Taiga también se guarda en `localStorage`
- Las peticiones a Taiga se hacen desde el servidor (nunca expuestas al cliente)
- No se persiste ningún dato en el servidor
- El token y URL se envían en cada petición al endpoint `/api/chat`

## 🧪 Flujo de una petición

1. **Usuario escribe** un mensaje en el chat
2. **Frontend envía** el mensaje + historial + token + URL a `/api/chat`
3. **Route Handler** construye el prompt con el system message
4. **GitHub Copilot SDK** analiza la intención y decide qué herramientas usar
5. **Ejecutor** ejecuta las herramientas contra la API de Taiga (URL dinámica)
6. **Copilot SDK** recibe los resultados y genera respuesta final
7. **Frontend muestra** la respuesta formateada con Markdown

## 📝 Notas técnicas

### Stack tecnológico

- **Framework**: Next.js 16 con App Router y Turbopack
- **SDK de IA**: @github/copilot-sdk con zod/v4
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Cliente API**: TaigaClient custom con URL dinámica

### Por qué no streaming

Esta implementación usa respuestas completas en lugar de streaming porque:

1. Las herramientas requieren ejecución secuencial
2. El loop de tool calling necesita respuestas completas
3. Simplifica el manejo de estado en el frontend

### Límites

- El contexto se limita al historial de la conversación actual
- No hay caché de respuestas de Taiga

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT
