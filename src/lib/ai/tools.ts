/**
 * Definición de herramientas disponibles para el asistente de IA
 * Cada herramienta tiene un esquema JSON que define sus parámetros
 */

import { z } from "zod";

// ============================================
// Esquemas de validación con Zod
// ============================================

export const GetProjectsSchema = z.object({});

export const GetProjectSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
});

export const GetProjectStatsSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
});

export const GetMilestonesSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
});

export const GetMilestoneSchema = z.object({
  milestoneId: z.number().describe("ID del milestone/sprint en Taiga"),
});

export const GetMilestoneStatsSchema = z.object({
  milestoneId: z.number().describe("ID del milestone/sprint en Taiga"),
});

export const GetUserStoriesSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
  milestoneId: z
    .number()
    .optional()
    .describe("ID del milestone/sprint (opcional)"),
  status: z.number().optional().describe("ID del estado (opcional)"),
  assignedTo: z
    .number()
    .optional()
    .describe("ID del usuario asignado (opcional)"),
  isClosed: z
    .boolean()
    .optional()
    .describe("Filtrar por historias cerradas (opcional)"),
});

export const GetUserStorySchema = z.object({
  userStoryId: z.number().describe("ID de la historia de usuario"),
});

export const SearchUserStoriesSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
  query: z.string().describe("Texto de búsqueda"),
});

export const CreateUserStorySchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
  subject: z.string().describe("Título de la historia de usuario"),
  description: z
    .string()
    .optional()
    .describe("Descripción detallada (opcional)"),
  milestoneId: z
    .number()
    .optional()
    .describe("ID del milestone/sprint (opcional)"),
  tags: z.array(z.string()).optional().describe("Etiquetas (opcional)"),
});

export const UpdateUserStorySchema = z.object({
  userStoryId: z.number().describe("ID de la historia de usuario"),
  subject: z.string().optional().describe("Nuevo título (opcional)"),
  description: z.string().optional().describe("Nueva descripción (opcional)"),
  milestoneId: z
    .number()
    .nullable()
    .optional()
    .describe("Nuevo milestone/sprint (null para quitar)"),
  status: z.number().optional().describe("Nuevo estado (opcional)"),
  assignedTo: z
    .number()
    .nullable()
    .optional()
    .describe("Nuevo usuario asignado (null para desasignar)"),
  tags: z.array(z.string()).optional().describe("Nuevas etiquetas (opcional)"),
  isBlocked: z
    .boolean()
    .optional()
    .describe("Marcar como bloqueada (opcional)"),
  blockedNote: z.string().optional().describe("Nota de bloqueo (opcional)"),
});

export const GetTasksSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
  userStoryId: z
    .number()
    .optional()
    .describe("ID de la historia de usuario (opcional)"),
  milestoneId: z
    .number()
    .optional()
    .describe("ID del milestone/sprint (opcional)"),
  status: z.number().optional().describe("ID del estado (opcional)"),
  assignedTo: z
    .number()
    .optional()
    .describe("ID del usuario asignado (opcional)"),
  isClosed: z
    .boolean()
    .optional()
    .describe("Filtrar por tareas cerradas (opcional)"),
});

export const GetTaskSchema = z.object({
  taskId: z.number().describe("ID de la tarea"),
});

export const SearchTasksSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
  query: z.string().describe("Texto de búsqueda"),
});

export const CreateTaskSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
  subject: z.string().describe("Título de la tarea"),
  description: z
    .string()
    .optional()
    .describe("Descripción detallada (opcional)"),
  userStoryId: z
    .number()
    .optional()
    .describe("ID de la historia de usuario padre (opcional)"),
  milestoneId: z
    .number()
    .optional()
    .describe("ID del milestone/sprint (opcional)"),
  assignedTo: z
    .number()
    .optional()
    .describe("ID del usuario asignado (opcional)"),
  tags: z.array(z.string()).optional().describe("Etiquetas (opcional)"),
});

export const UpdateTaskSchema = z.object({
  taskId: z.number().describe("ID de la tarea"),
  subject: z.string().optional().describe("Nuevo título (opcional)"),
  description: z.string().optional().describe("Nueva descripción (opcional)"),
  userStoryId: z
    .number()
    .nullable()
    .optional()
    .describe("Nueva historia de usuario (null para quitar)"),
  milestoneId: z
    .number()
    .nullable()
    .optional()
    .describe("Nuevo milestone/sprint (null para quitar)"),
  status: z.number().optional().describe("Nuevo estado (opcional)"),
  assignedTo: z
    .number()
    .nullable()
    .optional()
    .describe("Nuevo usuario asignado (null para desasignar)"),
  tags: z.array(z.string()).optional().describe("Nuevas etiquetas (opcional)"),
  isBlocked: z
    .boolean()
    .optional()
    .describe("Marcar como bloqueada (opcional)"),
  blockedNote: z.string().optional().describe("Nota de bloqueo (opcional)"),
});

export const GlobalSearchSchema = z.object({
  projectId: z.number().describe("ID del proyecto en Taiga"),
  query: z.string().describe("Texto de búsqueda"),
});

// ============================================
// Tipos derivados de los esquemas
// ============================================

export type GetProjectsParams = z.infer<typeof GetProjectsSchema>;
export type GetProjectParams = z.infer<typeof GetProjectSchema>;
export type GetProjectStatsParams = z.infer<typeof GetProjectStatsSchema>;
export type GetMilestonesParams = z.infer<typeof GetMilestonesSchema>;
export type GetMilestoneParams = z.infer<typeof GetMilestoneSchema>;
export type GetMilestoneStatsParams = z.infer<typeof GetMilestoneStatsSchema>;
export type GetUserStoriesParams = z.infer<typeof GetUserStoriesSchema>;
export type GetUserStoryParams = z.infer<typeof GetUserStorySchema>;
export type SearchUserStoriesParams = z.infer<typeof SearchUserStoriesSchema>;
export type CreateUserStoryParams = z.infer<typeof CreateUserStorySchema>;
export type UpdateUserStoryParams = z.infer<typeof UpdateUserStorySchema>;
export type GetTasksParams = z.infer<typeof GetTasksSchema>;
export type GetTaskParams = z.infer<typeof GetTaskSchema>;
export type SearchTasksParams = z.infer<typeof SearchTasksSchema>;
export type CreateTaskParams = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskParams = z.infer<typeof UpdateTaskSchema>;
export type GlobalSearchParams = z.infer<typeof GlobalSearchSchema>;

// ============================================
// Definición de herramientas para OpenAI
// ============================================

export const TAIGA_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_projects",
      description:
        "Obtiene la lista de todos los proyectos accesibles por el usuario en Taiga",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_project",
      description:
        "Obtiene los detalles de un proyecto específico por su ID, incluyendo estados, roles y configuración",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
        },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_project_stats",
      description:
        "Obtiene estadísticas de un proyecto: puntos totales, cerrados, historias, tareas y velocidad del equipo",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
        },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_milestones",
      description: "Obtiene todos los sprints/milestones de un proyecto",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
        },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_milestone",
      description:
        "Obtiene los detalles de un sprint/milestone específico incluyendo sus historias de usuario",
      parameters: {
        type: "object",
        properties: {
          milestoneId: {
            type: "number",
            description: "ID del milestone/sprint en Taiga",
          },
        },
        required: ["milestoneId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_milestone_stats",
      description:
        "Obtiene estadísticas detalladas de un sprint: progreso, burndown y tareas completadas",
      parameters: {
        type: "object",
        properties: {
          milestoneId: {
            type: "number",
            description: "ID del milestone/sprint en Taiga",
          },
        },
        required: ["milestoneId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_stories",
      description:
        "Obtiene historias de usuario de un proyecto con filtros opcionales por sprint, estado o asignación",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
          milestoneId: {
            type: "number",
            description: "ID del milestone/sprint para filtrar (opcional)",
          },
          status: {
            type: "number",
            description: "ID del estado para filtrar (opcional)",
          },
          assignedTo: {
            type: "number",
            description: "ID del usuario asignado para filtrar (opcional)",
          },
          isClosed: {
            type: "boolean",
            description: "Filtrar por historias cerradas (opcional)",
          },
        },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_story",
      description:
        "Obtiene los detalles completos de una historia de usuario específica",
      parameters: {
        type: "object",
        properties: {
          userStoryId: {
            type: "number",
            description: "ID de la historia de usuario",
          },
        },
        required: ["userStoryId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_user_stories",
      description:
        "Busca historias de usuario por texto en un proyecto específico",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
          query: {
            type: "string",
            description: "Texto de búsqueda (busca en título y descripción)",
          },
        },
        required: ["projectId", "query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_user_story",
      description:
        "Crea una nueva historia de usuario en un proyecto. Requiere al menos el título",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
          subject: {
            type: "string",
            description: "Título de la historia de usuario",
          },
          description: {
            type: "string",
            description: "Descripción detallada (opcional)",
          },
          milestoneId: {
            type: "number",
            description: "ID del milestone/sprint para asignar (opcional)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Etiquetas a asignar (opcional)",
          },
        },
        required: ["projectId", "subject"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_user_story",
      description:
        "Actualiza una historia de usuario existente. Solo se modifican los campos proporcionados",
      parameters: {
        type: "object",
        properties: {
          userStoryId: {
            type: "number",
            description: "ID de la historia de usuario a actualizar",
          },
          subject: {
            type: "string",
            description: "Nuevo título (opcional)",
          },
          description: {
            type: "string",
            description: "Nueva descripción (opcional)",
          },
          milestoneId: {
            type: ["number", "null"],
            description: "Nuevo milestone/sprint, null para quitar (opcional)",
          },
          status: {
            type: "number",
            description: "Nuevo ID de estado (opcional)",
          },
          assignedTo: {
            type: ["number", "null"],
            description:
              "Nuevo usuario asignado, null para desasignar (opcional)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Nuevas etiquetas (opcional)",
          },
          isBlocked: {
            type: "boolean",
            description: "Marcar como bloqueada (opcional)",
          },
          blockedNote: {
            type: "string",
            description: "Nota de bloqueo (opcional)",
          },
        },
        required: ["userStoryId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_tasks",
      description:
        "Obtiene tareas de un proyecto con filtros opcionales por historia, sprint o estado",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
          userStoryId: {
            type: "number",
            description: "ID de la historia de usuario para filtrar (opcional)",
          },
          milestoneId: {
            type: "number",
            description: "ID del milestone/sprint para filtrar (opcional)",
          },
          status: {
            type: "number",
            description: "ID del estado para filtrar (opcional)",
          },
          assignedTo: {
            type: "number",
            description: "ID del usuario asignado para filtrar (opcional)",
          },
          isClosed: {
            type: "boolean",
            description: "Filtrar por tareas cerradas (opcional)",
          },
        },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_task",
      description: "Obtiene los detalles completos de una tarea específica",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "number",
            description: "ID de la tarea",
          },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_tasks",
      description: "Busca tareas por texto en un proyecto específico",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
          query: {
            type: "string",
            description: "Texto de búsqueda (busca en título y descripción)",
          },
        },
        required: ["projectId", "query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description:
        "Crea una nueva tarea en un proyecto. Puede asociarse a una historia de usuario",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
          subject: {
            type: "string",
            description: "Título de la tarea",
          },
          description: {
            type: "string",
            description: "Descripción detallada (opcional)",
          },
          userStoryId: {
            type: "number",
            description: "ID de la historia de usuario padre (opcional)",
          },
          milestoneId: {
            type: "number",
            description: "ID del milestone/sprint (opcional)",
          },
          assignedTo: {
            type: "number",
            description: "ID del usuario a asignar (opcional)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Etiquetas a asignar (opcional)",
          },
        },
        required: ["projectId", "subject"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_task",
      description:
        "Actualiza una tarea existente. Solo se modifican los campos proporcionados",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "number",
            description: "ID de la tarea a actualizar",
          },
          subject: {
            type: "string",
            description: "Nuevo título (opcional)",
          },
          description: {
            type: "string",
            description: "Nueva descripción (opcional)",
          },
          userStoryId: {
            type: ["number", "null"],
            description:
              "Nueva historia de usuario, null para quitar (opcional)",
          },
          milestoneId: {
            type: ["number", "null"],
            description: "Nuevo milestone/sprint, null para quitar (opcional)",
          },
          status: {
            type: "number",
            description: "Nuevo ID de estado (opcional)",
          },
          assignedTo: {
            type: ["number", "null"],
            description:
              "Nuevo usuario asignado, null para desasignar (opcional)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Nuevas etiquetas (opcional)",
          },
          isBlocked: {
            type: "boolean",
            description: "Marcar como bloqueada (opcional)",
          },
          blockedNote: {
            type: "string",
            description: "Nota de bloqueo (opcional)",
          },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "global_search",
      description:
        "Realiza una búsqueda global en un proyecto que incluye historias de usuario, tareas e issues",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "number",
            description: "ID del proyecto en Taiga",
          },
          query: {
            type: "string",
            description: "Texto de búsqueda",
          },
        },
        required: ["projectId", "query"],
      },
    },
  },
] as const;

// Tipo para los nombres de herramientas
export type TaigaToolName = (typeof TAIGA_TOOLS)[number]["function"]["name"];
