/**
 * Ejecutor de herramientas de Taiga
 * Recibe una herramienta y sus parámetros, ejecuta contra la API de Taiga
 * y devuelve el resultado formateado
 */

import { TaigaClient, TaigaApiError } from "@/lib/taiga";
import type {
  TaigaToolName,
  GetProjectParams,
  GetProjectStatsParams,
  GetMilestonesParams,
  GetMilestoneParams,
  GetMilestoneStatsParams,
  GetUserStoriesParams,
  GetUserStoryParams,
  SearchUserStoriesParams,
  CreateUserStoryParams,
  UpdateUserStoryParams,
  GetTasksParams,
  GetTaskParams,
  SearchTasksParams,
  CreateTaskParams,
  UpdateTaskParams,
  GlobalSearchParams,
} from "./tools";

// ============================================
// Tipos de resultado
// ============================================

export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  errorType?: string;
}

// ============================================
// Ejecutor de herramientas
// ============================================

export async function executeToolCall(
  toolName: TaigaToolName,
  args: Record<string, unknown>,
  authToken: string,
): Promise<ToolExecutionResult> {
  const client = new TaigaClient();
  client.setAuthToken(authToken);

  try {
    switch (toolName) {
      case "get_projects": {
        const projects = await client.getProjects();
        return {
          success: true,
          data: projects.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description?.substring(0, 200),
            is_private: p.is_private,
            total_milestones: p.total_milestones,
            members_count: p.members?.length || 0,
          })),
        };
      }

      case "get_project": {
        const { projectId } = args as GetProjectParams;
        const project = await client.getProject(projectId);
        return {
          success: true,
          data: {
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
              color: s.color,
            })),
            task_statuses: project.task_statuses?.map((s) => ({
              id: s.id,
              name: s.name,
              is_closed: s.is_closed,
              color: s.color,
            })),
          },
        };
      }

      case "get_project_stats": {
        const { projectId } = args as GetProjectStatsParams;
        const stats = await client.getProjectStats(projectId);
        return {
          success: true,
          data: stats,
        };
      }

      case "get_milestones": {
        const { projectId } = args as GetMilestonesParams;
        const milestones = await client.getMilestones(projectId);
        return {
          success: true,
          data: milestones.map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            estimated_start: m.estimated_start,
            estimated_finish: m.estimated_finish,
            closed: m.closed,
            total_points: m.total_points,
            closed_points: m.closed_points,
            user_stories_count: m.user_stories?.length || 0,
          })),
        };
      }

      case "get_milestone": {
        const { milestoneId } = args as GetMilestoneParams;
        const milestone = await client.getMilestone(milestoneId);
        return {
          success: true,
          data: {
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
          },
        };
      }

      case "get_milestone_stats": {
        const { milestoneId } = args as GetMilestoneStatsParams;
        const stats = await client.getMilestoneStats(milestoneId);
        return {
          success: true,
          data: stats,
        };
      }

      case "get_user_stories": {
        const { projectId, milestoneId, status, assignedTo, isClosed } =
          args as GetUserStoriesParams;
        const stories = await client.getUserStories({
          project: projectId,
          milestone: milestoneId,
          status,
          assigned_to: assignedTo,
          status__is_closed: isClosed,
        });
        return {
          success: true,
          data: stories.map((us) => ({
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
          })),
        };
      }

      case "get_user_story": {
        const { userStoryId } = args as GetUserStoryParams;
        const story = await client.getUserStory(userStoryId);
        return {
          success: true,
          data: {
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
          },
        };
      }

      case "search_user_stories": {
        const { projectId, query } = args as SearchUserStoriesParams;
        const stories = await client.searchUserStories(projectId, query);
        return {
          success: true,
          data: stories.map((us) => ({
            id: us.id,
            ref: us.ref,
            subject: us.subject,
            status: us.status_extra_info?.name,
            is_closed: us.is_closed,
            total_points: us.total_points,
            assigned_to: us.assigned_to_extra_info?.full_name || null,
          })),
        };
      }

      case "create_user_story": {
        const { projectId, subject, description, milestoneId, tags } =
          args as CreateUserStoryParams;
        const story = await client.createUserStory({
          project: projectId,
          subject,
          description,
          milestone: milestoneId,
          tags,
        });
        return {
          success: true,
          data: {
            id: story.id,
            ref: story.ref,
            subject: story.subject,
            status: story.status_extra_info?.name,
            created_date: story.created_date,
            message: `Historia de usuario #${story.ref} "${story.subject}" creada exitosamente`,
          },
        };
      }

      case "update_user_story": {
        const {
          userStoryId,
          subject,
          description,
          milestoneId,
          status,
          assignedTo,
          tags,
          isBlocked,
          blockedNote,
        } = args as UpdateUserStoryParams;

        // Primero obtenemos la historia actual para obtener la versión
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
          success: true,
          data: {
            id: story.id,
            ref: story.ref,
            subject: story.subject,
            status: story.status_extra_info?.name,
            modified_date: story.modified_date,
            message: `Historia de usuario #${story.ref} actualizada exitosamente`,
          },
        };
      }

      case "get_tasks": {
        const {
          projectId,
          userStoryId,
          milestoneId,
          status,
          assignedTo,
          isClosed,
        } = args as GetTasksParams;
        const tasks = await client.getTasks({
          project: projectId,
          user_story: userStoryId,
          milestone: milestoneId,
          status,
          assigned_to: assignedTo,
          status__is_closed: isClosed,
        });
        return {
          success: true,
          data: tasks.map((t) => ({
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
          })),
        };
      }

      case "get_task": {
        const { taskId } = args as GetTaskParams;
        const task = await client.getTask(taskId);
        return {
          success: true,
          data: {
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
          },
        };
      }

      case "search_tasks": {
        const { projectId, query } = args as SearchTasksParams;
        const tasks = await client.searchTasks(projectId, query);
        return {
          success: true,
          data: tasks.map((t) => ({
            id: t.id,
            ref: t.ref,
            subject: t.subject,
            status: t.status_extra_info?.name,
            is_closed: t.is_closed,
            user_story_ref: t.user_story_extra_info?.ref || null,
            assigned_to: t.assigned_to_extra_info?.full_name || null,
          })),
        };
      }

      case "create_task": {
        const {
          projectId,
          subject,
          description,
          userStoryId,
          milestoneId,
          assignedTo,
          tags,
        } = args as CreateTaskParams;
        const task = await client.createTask({
          project: projectId,
          subject,
          description,
          user_story: userStoryId,
          milestone: milestoneId,
          assigned_to: assignedTo,
          tags,
        });
        return {
          success: true,
          data: {
            id: task.id,
            ref: task.ref,
            subject: task.subject,
            status: task.status_extra_info?.name,
            created_date: task.created_date,
            message: `Tarea #${task.ref} "${task.subject}" creada exitosamente`,
          },
        };
      }

      case "update_task": {
        const {
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
        } = args as UpdateTaskParams;

        // Primero obtenemos la tarea actual para obtener la versión
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
          success: true,
          data: {
            id: task.id,
            ref: task.ref,
            subject: task.subject,
            status: task.status_extra_info?.name,
            modified_date: task.modified_date,
            message: `Tarea #${task.ref} actualizada exitosamente`,
          },
        };
      }

      case "global_search": {
        const { projectId, query } = args as GlobalSearchParams;
        const results = await client.search(projectId, query);
        return {
          success: true,
          data: {
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
          },
        };
      }

      default:
        return {
          success: false,
          error: `Herramienta desconocida: ${toolName}`,
          errorType: "UNKNOWN_TOOL",
        };
    }
  } catch (error) {
    if (error instanceof TaigaApiError) {
      return {
        success: false,
        error: error.message,
        errorType: error.errorType || `HTTP_${error.statusCode}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      errorType: "INTERNAL_ERROR",
    };
  }
}
