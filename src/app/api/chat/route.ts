/**
 * Route Handler para el asistente de IA usando GitHub Copilot SDK
 * Procesa mensajes del usuario, ejecuta herramientas y genera respuestas
 */

import { NextRequest, NextResponse } from "next/server";
import { CopilotClient, defineTool } from "@github/copilot-sdk";
import { z } from "zod/v4";
import { TaigaClient } from "@/lib/taiga";

// ============================================
// Tipos
// ============================================

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  taigaToken: string;
  taigaUrl: string;
  sessionId?: string;
}

// ============================================
// System Prompt
// ============================================

const SYSTEM_PROMPT = `Eres un asistente experto en gestión de proyectos que ayuda a los usuarios a interactuar con Taiga, una plataforma de gestión ágil de proyectos.

Tu rol es:
1. Interpretar las solicitudes del usuario en lenguaje natural
2. Usar las herramientas disponibles para obtener información o realizar acciones en Taiga
3. Proporcionar respuestas claras y útiles basadas en los datos reales

Reglas estrictas:
- NUNCA inventes datos. Si no tienes información, usa las herramientas para obtenerla
- NUNCA asumas IDs de proyectos, sprints o historias. Siempre búscalos primero
- Si el usuario no especifica un proyecto, pregúntale cuál quiere usar o lista los disponibles
- Cuando crees o modifiques elementos, confirma siempre la acción realizada
- Si una operación falla, explica el error de forma clara al usuario
- Responde siempre en español

IMPORTANTE - Ordenamiento de resultados:
- Cuando el usuario pida elementos "recientes", "últimos", "más nuevos": usa orderBy="-created_date" (orden descendente por fecha de creación)
- Cuando el usuario pida elementos "antiguos", "primeros", "más viejos": usa orderBy="created_date" (orden ascendente)
- Cuando el usuario pida un número específico de elementos (ej: "las 3 últimas"), usa el parámetro limit junto con orderBy
- Siempre usa ordenamiento descendente (-created_date) cuando se pidan los últimos N elementos

Capacidades disponibles:
- Listar y consultar proyectos
- Ver y resumir sprints (milestones)
- Buscar, crear y actualizar historias de usuario (con ordenamiento y límite)
- Buscar, crear y actualizar tareas (con ordenamiento y límite)
- Leer comentarios de historias de usuario y tareas para obtener más contexto
- Crear comentarios en historias de usuario y tareas
- Obtener estadísticas de proyectos y sprints
- Búsqueda global en proyectos

IMPORTANTE - Comentarios:
- Cuando el usuario pregunte sobre el contexto o detalles de una historia/tarea, considera leer los comentarios para obtener información adicional
- Los comentarios contienen discusiones importantes sobre el desarrollo y decisiones tomadas
- Cuando el usuario pida añadir una nota o comentario, usa las herramientas de crear comentarios

Formato de respuestas:
- Usa markdown para formatear las respuestas
- Presenta listas de elementos de forma clara y organizada
- Incluye información relevante como IDs y referencias cuando sea útil
- Sé conciso pero informativo`;

// ============================================
// Crear herramientas de Taiga con defineTool
// ============================================

function createTaigaTools(taigaToken: string, taigaUrl: string) {
  const client = new TaigaClient(taigaUrl);
  client.setAuthToken(taigaToken);

  return [
    // ===== PROYECTOS =====
    defineTool("get_projects", {
      description:
        "Obtiene la lista de todos los proyectos accesibles por el usuario en Taiga",
      parameters: z.object({}),
      handler: async () => {
        try {
          const projects = await client.getProjects();
          return projects.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description?.substring(0, 200),
            is_private: p.is_private,
            total_milestones: p.total_milestones,
            members_count: p.members?.length || 0,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("get_project", {
      description:
        "Obtiene los detalles de un proyecto específico por su ID, incluyendo estados, roles y configuración",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
      }),
      handler: async ({ projectId }) => {
        try {
          const project = await client.getProject(projectId);
          return {
            id: project.id,
            name: project.name,
            slug: project.slug,
            description: project.description,
            created_date: project.created_date,
            is_private: project.is_private,
            owner: {
              id: project.owner.id,
              username: project.owner.username,
              full_name: project.owner.full_name,
            },
            members: project.members?.map((m) => ({
              id: m.id,
              username: m.username,
              full_name: m.full_name,
              role_name: m.role_name,
            })),
            us_statuses: project.us_statuses?.map((s) => ({
              id: s.id,
              name: s.name,
              is_closed: s.is_closed,
            })),
            task_statuses: project.task_statuses?.map((s) => ({
              id: s.id,
              name: s.name,
              is_closed: s.is_closed,
            })),
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("get_project_stats", {
      description:
        "Obtiene estadísticas de un proyecto: puntos totales, cerrados, historias, tareas y velocidad",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
      }),
      handler: async ({ projectId }) => {
        try {
          return await client.getProjectStats(projectId);
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    // ===== MILESTONES/SPRINTS =====
    defineTool("get_milestones", {
      description: "Obtiene todos los sprints/milestones de un proyecto",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
      }),
      handler: async ({ projectId }) => {
        try {
          const milestones = await client.getMilestones(projectId);
          return milestones.map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            estimated_start: m.estimated_start,
            estimated_finish: m.estimated_finish,
            closed: m.closed,
            total_points: m.total_points,
            closed_points: m.closed_points,
            user_stories_count: m.user_stories?.length || 0,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("get_milestone", {
      description:
        "Obtiene los detalles de un sprint/milestone específico incluyendo sus historias de usuario",
      parameters: z.object({
        milestoneId: z.number().describe("ID del milestone/sprint en Taiga"),
      }),
      handler: async ({ milestoneId }) => {
        try {
          const milestone = await client.getMilestone(milestoneId);
          return {
            id: milestone.id,
            name: milestone.name,
            slug: milestone.slug,
            estimated_start: milestone.estimated_start,
            estimated_finish: milestone.estimated_finish,
            closed: milestone.closed,
            total_points: milestone.total_points,
            closed_points: milestone.closed_points,
            user_stories: milestone.user_stories?.map((us) => ({
              id: us.id,
              ref: us.ref,
              subject: us.subject,
              status: us.status_extra_info?.name,
              is_closed: us.is_closed,
              total_points: us.total_points,
            })),
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("get_milestone_stats", {
      description:
        "Obtiene estadísticas detalladas de un sprint: progreso, burndown y tareas completadas",
      parameters: z.object({
        milestoneId: z.number().describe("ID del milestone/sprint en Taiga"),
      }),
      handler: async ({ milestoneId }) => {
        try {
          return await client.getMilestoneStats(milestoneId);
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    // ===== HISTORIAS DE USUARIO =====
    defineTool("get_user_stories", {
      description:
        "Obtiene historias de usuario de un proyecto con filtros opcionales por sprint, estado o asignación. Soporta ordenamiento y límite de resultados.",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
        milestoneId: z
          .number()
          .optional()
          .describe("ID del milestone/sprint para filtrar"),
        status: z.number().optional().describe("ID del estado para filtrar"),
        assignedTo: z
          .number()
          .optional()
          .describe("ID del usuario asignado para filtrar"),
        isClosed: z
          .boolean()
          .optional()
          .describe("Filtrar por historias cerradas"),
        orderBy: z
          .string()
          .optional()
          .describe(
            "Campo para ordenar: created_date, modified_date, ref, subject, total_points. Usar - para descendente (ej: -created_date para las más recientes primero)",
          ),
        limit: z
          .number()
          .optional()
          .describe("Número máximo de resultados a devolver"),
      }),
      handler: async ({
        projectId,
        milestoneId,
        status,
        assignedTo,
        isClosed,
        orderBy,
        limit,
      }) => {
        try {
          const stories = await client.getUserStories({
            project: projectId,
            milestone: milestoneId,
            status,
            assigned_to: assignedTo,
            status__is_closed: isClosed,
            order_by: orderBy,
          });
          // Aplicar límite si se especifica
          const limitedStories = limit ? stories.slice(0, limit) : stories;
          return limitedStories.map((us) => ({
            id: us.id,
            ref: us.ref,
            subject: us.subject,
            status: us.status_extra_info?.name,
            status_color: us.status_extra_info?.color,
            is_closed: us.is_closed,
            is_blocked: us.is_blocked,
            total_points: us.total_points,
            assigned_to: us.assigned_to_extra_info?.full_name || null,
            milestone: us.milestone_name || null,
            tags: us.tags,
            created_date: us.created_date,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("get_user_story", {
      description:
        "Obtiene los detalles completos de una historia de usuario específica",
      parameters: z.object({
        userStoryId: z.number().describe("ID de la historia de usuario"),
      }),
      handler: async ({ userStoryId }) => {
        try {
          const story = await client.getUserStory(userStoryId);
          return {
            id: story.id,
            ref: story.ref,
            subject: story.subject,
            description: story.description,
            status: story.status_extra_info?.name,
            status_id: story.status,
            is_closed: story.is_closed,
            is_blocked: story.is_blocked,
            blocked_note: story.blocked_note,
            total_points: story.total_points,
            assigned_to: story.assigned_to_extra_info
              ? {
                  id: story.assigned_to_extra_info.id,
                  username: story.assigned_to_extra_info.username,
                  full_name: story.assigned_to_extra_info.full_name,
                }
              : null,
            owner: {
              id: story.owner_extra_info.id,
              username: story.owner_extra_info.username,
              full_name: story.owner_extra_info.full_name,
            },
            milestone: story.milestone_name,
            milestone_id: story.milestone,
            tags: story.tags,
            created_date: story.created_date,
            modified_date: story.modified_date,
            version: story.version,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("search_user_stories", {
      description:
        "Busca historias de usuario por texto en un proyecto específico",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
        query: z
          .string()
          .describe("Texto de búsqueda (busca en título y descripción)"),
      }),
      handler: async ({ projectId, query }) => {
        try {
          const stories = await client.searchUserStories(projectId, query);
          return stories.map((us) => ({
            id: us.id,
            ref: us.ref,
            subject: us.subject,
            status: us.status_extra_info?.name,
            is_closed: us.is_closed,
            total_points: us.total_points,
            assigned_to: us.assigned_to_extra_info?.full_name || null,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("create_user_story", {
      description:
        "Crea una nueva historia de usuario en un proyecto. Requiere al menos el título",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
        subject: z.string().describe("Título de la historia de usuario"),
        description: z.string().optional().describe("Descripción detallada"),
        milestoneId: z
          .number()
          .optional()
          .describe("ID del milestone/sprint para asignar"),
        tags: z.array(z.string()).optional().describe("Etiquetas a asignar"),
      }),
      handler: async ({
        projectId,
        subject,
        description,
        milestoneId,
        tags,
      }) => {
        try {
          // Añadir marca de IA
          const aiTag = "🤖ai-generated";
          const aiDescription = description
            ? `${description}\n\n---\n_🤖 Creado por Taiga AI Assistant_`
            : "_🤖 Creado por Taiga AI Assistant_";
          const allTags = tags ? [...tags, aiTag] : [aiTag];

          const story = await client.createUserStory({
            project: projectId,
            subject,
            description: aiDescription,
            milestone: milestoneId,
            tags: allTags,
          });
          return {
            id: story.id,
            ref: story.ref,
            subject: story.subject,
            status: story.status_extra_info?.name,
            created_date: story.created_date,
            message: `Historia de usuario #${story.ref} "${story.subject}" creada exitosamente`,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("update_user_story", {
      description:
        "Actualiza una historia de usuario existente. Solo se modifican los campos proporcionados",
      parameters: z.object({
        userStoryId: z
          .number()
          .describe("ID de la historia de usuario a actualizar"),
        subject: z.string().optional().describe("Nuevo título"),
        description: z.string().optional().describe("Nueva descripción"),
        milestoneId: z
          .number()
          .nullable()
          .optional()
          .describe("Nuevo milestone/sprint, null para quitar"),
        status: z.number().optional().describe("Nuevo ID de estado"),
        assignedTo: z
          .number()
          .nullable()
          .optional()
          .describe("Nuevo usuario asignado, null para desasignar"),
        tags: z.array(z.string()).optional().describe("Nuevas etiquetas"),
        isBlocked: z.boolean().optional().describe("Marcar como bloqueada"),
        blockedNote: z.string().optional().describe("Nota de bloqueo"),
      }),
      handler: async ({
        userStoryId,
        subject,
        description,
        milestoneId,
        status,
        assignedTo,
        tags,
        isBlocked,
        blockedNote,
      }) => {
        try {
          const currentStory = await client.getUserStory(userStoryId);
          const story = await client.updateUserStory(userStoryId, {
            subject,
            description,
            milestone: milestoneId,
            status,
            assigned_to: assignedTo,
            tags,
            is_blocked: isBlocked,
            blocked_note: blockedNote,
            version: currentStory.version,
          });
          return {
            id: story.id,
            ref: story.ref,
            subject: story.subject,
            status: story.status_extra_info?.name,
            modified_date: story.modified_date,
            message: `Historia de usuario #${story.ref} actualizada exitosamente`,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    // ===== TAREAS =====
    defineTool("get_tasks", {
      description:
        "Obtiene tareas de un proyecto con filtros opcionales por historia, sprint o estado. Soporta ordenamiento y límite de resultados.",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
        userStoryId: z
          .number()
          .optional()
          .describe("ID de la historia de usuario padre"),
        milestoneId: z
          .number()
          .optional()
          .describe("ID del milestone/sprint para filtrar"),
        status: z.number().optional().describe("ID del estado para filtrar"),
        assignedTo: z
          .number()
          .optional()
          .describe("ID del usuario asignado para filtrar"),
        isClosed: z
          .boolean()
          .optional()
          .describe("Filtrar por tareas cerradas"),
        orderBy: z
          .string()
          .optional()
          .describe(
            "Campo para ordenar: created_date, modified_date, ref, subject. Usar - para descendente (ej: -created_date para las más recientes primero)",
          ),
        limit: z
          .number()
          .optional()
          .describe("Número máximo de resultados a devolver"),
      }),
      handler: async ({
        projectId,
        userStoryId,
        milestoneId,
        status,
        assignedTo,
        isClosed,
        orderBy,
        limit,
      }) => {
        try {
          const tasks = await client.getTasks({
            project: projectId,
            user_story: userStoryId,
            milestone: milestoneId,
            status,
            assigned_to: assignedTo,
            status__is_closed: isClosed,
            order_by: orderBy,
          });
          // Aplicar límite si se especifica
          const limitedTasks = limit ? tasks.slice(0, limit) : tasks;
          return limitedTasks.map((t) => ({
            id: t.id,
            ref: t.ref,
            subject: t.subject,
            status: t.status_extra_info?.name,
            status_color: t.status_extra_info?.color,
            is_closed: t.is_closed,
            is_blocked: t.is_blocked,
            user_story_ref: t.user_story_extra_info?.ref || null,
            user_story_subject: t.user_story_extra_info?.subject || null,
            assigned_to: t.assigned_to_extra_info?.full_name || null,
            tags: t.tags,
            created_date: t.created_date,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("get_task", {
      description: "Obtiene los detalles completos de una tarea específica",
      parameters: z.object({
        taskId: z.number().describe("ID de la tarea"),
      }),
      handler: async ({ taskId }) => {
        try {
          const task = await client.getTask(taskId);
          return {
            id: task.id,
            ref: task.ref,
            subject: task.subject,
            description: task.description,
            status: task.status_extra_info?.name,
            status_id: task.status,
            is_closed: task.is_closed,
            is_blocked: task.is_blocked,
            blocked_note: task.blocked_note,
            user_story: task.user_story_extra_info
              ? {
                  id: task.user_story_extra_info.id,
                  ref: task.user_story_extra_info.ref,
                  subject: task.user_story_extra_info.subject,
                }
              : null,
            assigned_to: task.assigned_to_extra_info
              ? {
                  id: task.assigned_to_extra_info.id,
                  username: task.assigned_to_extra_info.username,
                  full_name: task.assigned_to_extra_info.full_name,
                }
              : null,
            owner: {
              id: task.owner_extra_info.id,
              username: task.owner_extra_info.username,
              full_name: task.owner_extra_info.full_name,
            },
            milestone_id: task.milestone,
            tags: task.tags,
            created_date: task.created_date,
            modified_date: task.modified_date,
            version: task.version,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("search_tasks", {
      description: "Busca tareas por texto en un proyecto específico",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
        query: z
          .string()
          .describe("Texto de búsqueda (busca en título y descripción)"),
      }),
      handler: async ({ projectId, query }) => {
        try {
          const tasks = await client.searchTasks(projectId, query);
          return tasks.map((t) => ({
            id: t.id,
            ref: t.ref,
            subject: t.subject,
            status: t.status_extra_info?.name,
            is_closed: t.is_closed,
            user_story_ref: t.user_story_extra_info?.ref || null,
            assigned_to: t.assigned_to_extra_info?.full_name || null,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("create_task", {
      description:
        "Crea una nueva tarea en un proyecto. Puede asociarse a una historia de usuario",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
        subject: z.string().describe("Título de la tarea"),
        description: z.string().optional().describe("Descripción detallada"),
        userStoryId: z
          .number()
          .optional()
          .describe("ID de la historia de usuario padre"),
        milestoneId: z.number().optional().describe("ID del milestone/sprint"),
        assignedTo: z.number().optional().describe("ID del usuario a asignar"),
        tags: z.array(z.string()).optional().describe("Etiquetas a asignar"),
      }),
      handler: async ({
        projectId,
        subject,
        description,
        userStoryId,
        milestoneId,
        assignedTo,
        tags,
      }) => {
        try {
          // Añadir marca de IA
          const aiTag = "🤖ai-generated";
          const aiDescription = description
            ? `${description}\n\n---\n_🤖 Creado por Taiga AI Assistant_`
            : "_🤖 Creado por Taiga AI Assistant_";
          const allTags = tags ? [...tags, aiTag] : [aiTag];

          const task = await client.createTask({
            project: projectId,
            subject,
            description: aiDescription,
            user_story: userStoryId,
            milestone: milestoneId,
            assigned_to: assignedTo,
            tags: allTags,
          });
          return {
            id: task.id,
            ref: task.ref,
            subject: task.subject,
            status: task.status_extra_info?.name,
            created_date: task.created_date,
            message: `Tarea #${task.ref} "${task.subject}" creada exitosamente`,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("update_task", {
      description:
        "Actualiza una tarea existente. Solo se modifican los campos proporcionados",
      parameters: z.object({
        taskId: z.number().describe("ID de la tarea a actualizar"),
        subject: z.string().optional().describe("Nuevo título"),
        description: z.string().optional().describe("Nueva descripción"),
        userStoryId: z
          .number()
          .nullable()
          .optional()
          .describe("Nueva historia de usuario, null para quitar"),
        milestoneId: z
          .number()
          .nullable()
          .optional()
          .describe("Nuevo milestone/sprint, null para quitar"),
        status: z.number().optional().describe("Nuevo ID de estado"),
        assignedTo: z
          .number()
          .nullable()
          .optional()
          .describe("Nuevo usuario asignado, null para desasignar"),
        tags: z.array(z.string()).optional().describe("Nuevas etiquetas"),
        isBlocked: z.boolean().optional().describe("Marcar como bloqueada"),
        blockedNote: z.string().optional().describe("Nota de bloqueo"),
      }),
      handler: async ({
        taskId,
        subject,
        description,
        userStoryId,
        milestoneId,
        status,
        assignedTo,
        tags,
        isBlocked,
        blockedNote,
      }) => {
        try {
          const currentTask = await client.getTask(taskId);
          const task = await client.updateTask(taskId, {
            subject,
            description,
            user_story: userStoryId,
            milestone: milestoneId,
            status,
            assigned_to: assignedTo,
            tags,
            is_blocked: isBlocked,
            blocked_note: blockedNote,
            version: currentTask.version,
          });
          return {
            id: task.id,
            ref: task.ref,
            subject: task.subject,
            status: task.status_extra_info?.name,
            modified_date: task.modified_date,
            message: `Tarea #${task.ref} actualizada exitosamente`,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    // ===== BÚSQUEDA GLOBAL =====
    defineTool("global_search", {
      description:
        "Realiza una búsqueda global en un proyecto que incluye historias de usuario, tareas e issues",
      parameters: z.object({
        projectId: z.number().describe("ID del proyecto en Taiga"),
        query: z.string().describe("Texto de búsqueda"),
      }),
      handler: async ({ projectId, query }) => {
        try {
          const results = await client.search(projectId, query);
          return {
            total_count: results.count,
            user_stories: results.userstories?.map((us) => ({
              id: us.id,
              ref: us.ref,
              subject: us.subject,
              type: "user_story",
            })),
            tasks: results.tasks?.map((t) => ({
              id: t.id,
              ref: t.ref,
              subject: t.subject,
              type: "task",
            })),
            issues: results.issues?.map((i) => ({
              id: i.id,
              ref: i.ref,
              subject: i.subject,
              type: "issue",
            })),
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    // ===== COMENTARIOS =====
    defineTool("get_user_story_comments", {
      description:
        "Obtiene los comentarios de una historia de usuario. Útil para entender el contexto y las discusiones sobre la historia.",
      parameters: z.object({
        userStoryId: z.number().describe("ID de la historia de usuario"),
      }),
      handler: async ({ userStoryId }) => {
        try {
          const comments = await client.getComments("userstory", userStoryId);
          return comments.map((c) => ({
            id: c.id,
            author: c.user.name || c.user.username,
            author_username: c.user.username,
            created_at: c.created_at,
            comment: c.comment,
            is_edited: !!c.edit_comment_date,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("get_task_comments", {
      description:
        "Obtiene los comentarios de una tarea. Útil para entender el contexto y las discusiones sobre la tarea.",
      parameters: z.object({
        taskId: z.number().describe("ID de la tarea"),
      }),
      handler: async ({ taskId }) => {
        try {
          const comments = await client.getComments("task", taskId);
          return comments.map((c) => ({
            id: c.id,
            author: c.user.name || c.user.username,
            author_username: c.user.username,
            created_at: c.created_at,
            comment: c.comment,
            is_edited: !!c.edit_comment_date,
          }));
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("create_user_story_comment", {
      description:
        "Crea un nuevo comentario en una historia de usuario. Útil para añadir notas, preguntas o actualizaciones.",
      parameters: z.object({
        userStoryId: z.number().describe("ID de la historia de usuario"),
        comment: z.string().describe("Texto del comentario a crear"),
      }),
      handler: async ({ userStoryId, comment }) => {
        try {
          // Obtener la versión actual de la historia
          const story = await client.getUserStory(userStoryId);
          // Añadir marca de IA al comentario
          const aiComment = `${comment}\n\n_🤖 Comentario creado por Taiga AI Assistant_`;
          await client.createComment(
            "userstory",
            userStoryId,
            aiComment,
            story.version,
          );
          return {
            success: true,
            message: `Comentario añadido a la historia #${story.ref}`,
            user_story_ref: story.ref,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),

    defineTool("create_task_comment", {
      description:
        "Crea un nuevo comentario en una tarea. Útil para añadir notas, preguntas o actualizaciones.",
      parameters: z.object({
        taskId: z.number().describe("ID de la tarea"),
        comment: z.string().describe("Texto del comentario a crear"),
      }),
      handler: async ({ taskId, comment }) => {
        try {
          // Obtener la versión actual de la tarea
          const task = await client.getTask(taskId);
          // Añadir marca de IA al comentario
          const aiComment = `${comment}\n\n_🤖 Comentario creado por Taiga AI Assistant_`;
          await client.createComment("task", taskId, aiComment, task.version);
          return {
            success: true,
            message: `Comentario añadido a la tarea #${task.ref}`,
            task_ref: task.ref,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Error desconocido",
          };
        }
      },
    }),
  ];
}

// ============================================
// Route Handler con Streaming
// ============================================

export async function POST(request: NextRequest) {
  let copilotClient: CopilotClient | null = null;

  try {
    // Parsear request
    const body: ChatRequest = await request.json();
    const { messages: userMessages, taigaToken, taigaUrl, sessionId } = body;

    if (!taigaToken) {
      return NextResponse.json(
        { error: "Token de Taiga no proporcionado" },
        { status: 401 },
      );
    }

    if (!taigaUrl) {
      return NextResponse.json(
        { error: "URL de Taiga no proporcionada" },
        { status: 400 },
      );
    }

    if (
      !userMessages ||
      !Array.isArray(userMessages) ||
      userMessages.length === 0
    ) {
      return NextResponse.json(
        { error: "Mensajes no proporcionados" },
        { status: 400 },
      );
    }

    // Crear cliente Copilot con autoStart: false para control manual
    copilotClient = new CopilotClient({
      autoStart: false,
      logLevel: "error",
    });

    await copilotClient.start();

    // Crear herramientas con el token y URL de Taiga
    const tools = createTaigaTools(taigaToken, taigaUrl);

    // Crear sesión con streaming habilitado
    const session = await copilotClient.createSession({
      sessionId: sessionId || `taiga-${Date.now()}`,
      model: "gpt-4o",
      streaming: true,
      tools,
      systemMessage: {
        mode: "replace",
        content: SYSTEM_PROMPT,
      },
    });

    // Enviar mensajes previos para dar contexto (excepto el último)
    const previousMessages = userMessages.slice(0, -1);
    for (const msg of previousMessages) {
      if (msg.role === "user") {
        await session.sendAndWait({ prompt: msg.content }, 120000); // 2 minutos
      }
    }

    // Obtener el último mensaje del usuario
    const lastMessage = userMessages[userMessages.length - 1];

    // Capturar el cliente para limpieza en el finally del stream
    const clientToCleanup = copilotClient;

    // Crear un stream de respuesta usando TransformStream para mejor control
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Flag para controlar si ya terminamos
    let isComplete = false;

    // Función para cerrar el stream de forma segura
    const closeStream = async () => {
      if (isComplete) return;
      isComplete = true;

      try {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        );
      } catch {
        // Ignorar si ya está cerrado
      }

      try {
        await writer.close();
      } catch {
        // Ignorar si ya está cerrado
      }

      // Limpiar sesión y cliente
      try {
        await session.destroy();
      } catch {
        // Ignorar errores al destruir sesión
      }
      try {
        await clientToCleanup.stop();
      } catch {
        // Ignorar errores al detener cliente
      }
    };

    // Configurar listeners para streaming real
    session.on("assistant.message_delta", async (event) => {
      if (isComplete) return;
      try {
        const deltaContent = event.data?.deltaContent || "";
        if (deltaContent) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", content: deltaContent })}\n\n`,
            ),
          );
        }
      } catch {
        // Ignorar errores de escritura si el stream se cerró
      }
    });

    // Escuchar razonamiento (chain of thought)
    session.on("assistant.reasoning_delta", async (event) => {
      if (isComplete) return;
      try {
        const deltaContent = event.data?.deltaContent || "";
        if (deltaContent) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: "reasoning", content: deltaContent })}\n\n`,
            ),
          );
        }
      } catch {
        // Ignorar errores de escritura si el stream se cerró
      }
    });

    // Escuchar inicio de ejecución de tool
    session.on("tool.execution_start", async (event) => {
      if (isComplete) return;
      try {
        const toolCallId = event.data?.toolCallId || `tool-${Date.now()}`;
        const toolName = event.data?.toolName || "unknown";
        const input = event.data?.arguments || {};
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_call_start",
              toolCallId,
              toolName,
              input,
            })}\n\n`,
          ),
        );
      } catch {
        // Ignorar errores de escritura si el stream se cerró
      }
    });

    // Escuchar resultado de tool
    session.on("tool.execution_complete", async (event) => {
      if (isComplete) return;
      try {
        const toolCallId = event.data?.toolCallId || "";
        const success = event.data?.success ?? true;
        const result = event.data?.result?.content;
        const error = event.data?.error?.message;
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_call_result",
              toolCallId,
              result,
              isError: !success,
              error: !success ? error : undefined,
            })}\n\n`,
          ),
        );
      } catch {
        // Ignorar errores de escritura si el stream se cerró
      }
    });

    // Escuchar cuando la sesión está idle (respuesta completa)
    session.on("session.idle", async () => {
      await closeStream();
    });

    // Procesar en background
    (async () => {
      try {
        // Enviar mensaje sin esperar (los eventos manejan la respuesta)
        await session.send({ prompt: lastMessage.content });

        // Timeout de seguridad de 120 segundos
        setTimeout(async () => {
          if (!isComplete) {
            console.warn("Timeout de seguridad alcanzado");
            await closeStream();
          }
        }, 120000);
      } catch (error) {
        // Enviar error como parte del stream
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        console.error("Error en streaming:", error);

        if (!isComplete) {
          try {
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({ error: errorMessage })}\n\n`,
              ),
            );
          } catch {
            // Ignorar
          }
          await closeStream();
        }
      }
    })();

    // Marcar que la limpieza se hará en el stream
    copilotClient = null;

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error en chat API:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    );
  } finally {
    // Limpiar cliente Copilot solo si no se transfirió al stream
    if (copilotClient) {
      try {
        await copilotClient.stop();
      } catch {
        // Ignorar errores al detener
      }
    }
  }
}
