/**
 * Cliente HTTP para la API de Taiga
 * Maneja autenticación, errores y transformación de respuestas
 */

import type {
  TaigaAuthCredentials,
  TaigaAuthResponse,
  TaigaProject,
  TaigaProjectDetail,
  TaigaProjectStats,
  TaigaMilestone,
  TaigaMilestoneStats,
  TaigaUserStory,
  TaigaUserStoryDetail,
  TaigaCreateUserStory,
  TaigaUpdateUserStory,
  TaigaTask,
  TaigaCreateTask,
  TaigaUpdateTask,
  TaigaIssue,
  TaigaUserStoryFilters,
  TaigaTaskFilters,
  TaigaIssueFilters,
  TaigaErrorResponse,
  TaigaHistoryEntry,
  TaigaHistoryType,
} from "./types";

// ============================================
// Configuración del cliente
// ============================================

const TAIGA_API_URL =
  process.env.TAIGA_API_URL || "https://api.taiga.io/api/v1";

export class TaigaApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType?: string,
  ) {
    super(message);
    this.name = "TaigaApiError";
  }
}

// ============================================
// Cliente principal
// ============================================

export class TaigaClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || TAIGA_API_URL;
  }

  /**
   * Configura el token de autenticación
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Realiza una petición HTTP a la API de Taiga
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.authToken) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType: string | undefined;

      try {
        const errorData: TaigaErrorResponse = await response.json();
        if (errorData._error_message) {
          errorMessage = errorData._error_message;
          errorType = errorData._error_type;
        }
      } catch {
        // Si no se puede parsear el error, usar el mensaje por defecto
      }

      throw new TaigaApiError(errorMessage, response.status, errorType);
    }

    // Para respuestas 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ============================================
  // Autenticación
  // ============================================

  /**
   * Autentica un usuario y obtiene el token
   */
  async authenticate(
    credentials: TaigaAuthCredentials,
  ): Promise<TaigaAuthResponse> {
    const response = await this.request<TaigaAuthResponse>("/auth", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    this.authToken = response.auth_token;
    return response;
  }

  /**
   * Autentica directamente con un token existente y valida
   */
  async authenticateWithToken(token: string): Promise<boolean> {
    this.authToken = token;
    try {
      // Intentar obtener la información del usuario para validar el token
      await this.request("/users/me");
      return true;
    } catch {
      this.authToken = null;
      return false;
    }
  }

  // ============================================
  // Proyectos
  // ============================================

  /**
   * Obtiene todos los proyectos del usuario
   */
  async getProjects(): Promise<TaigaProject[]> {
    return this.request<TaigaProject[]>("/projects");
  }

  /**
   * Obtiene un proyecto específico por ID
   */
  async getProject(projectId: number): Promise<TaigaProjectDetail> {
    return this.request<TaigaProjectDetail>(`/projects/${projectId}`);
  }

  /**
   * Obtiene un proyecto por slug
   */
  async getProjectBySlug(slug: string): Promise<TaigaProjectDetail> {
    return this.request<TaigaProjectDetail>(
      `/projects/by_slug?slug=${encodeURIComponent(slug)}`,
    );
  }

  /**
   * Obtiene estadísticas de un proyecto
   */
  async getProjectStats(projectId: number): Promise<TaigaProjectStats> {
    return this.request<TaigaProjectStats>(`/projects/${projectId}/stats`);
  }

  // ============================================
  // Milestones (Sprints)
  // ============================================

  /**
   * Obtiene todos los milestones de un proyecto
   */
  async getMilestones(projectId: number): Promise<TaigaMilestone[]> {
    return this.request<TaigaMilestone[]>(`/milestones?project=${projectId}`);
  }

  /**
   * Obtiene un milestone específico
   */
  async getMilestone(milestoneId: number): Promise<TaigaMilestone> {
    return this.request<TaigaMilestone>(`/milestones/${milestoneId}`);
  }

  /**
   * Obtiene estadísticas de un milestone
   */
  async getMilestoneStats(milestoneId: number): Promise<TaigaMilestoneStats> {
    return this.request<TaigaMilestoneStats>(
      `/milestones/${milestoneId}/stats`,
    );
  }

  // ============================================
  // Historias de Usuario
  // ============================================

  /**
   * Obtiene historias de usuario con filtros opcionales
   */
  async getUserStories(
    filters?: TaigaUserStoryFilters,
  ): Promise<TaigaUserStory[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.set(key, value.join(","));
          } else {
            params.set(key, String(value));
          }
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/userstories?${queryString}`
      : "/userstories";

    return this.request<TaigaUserStory[]>(endpoint);
  }

  /**
   * Obtiene una historia de usuario específica
   */
  async getUserStory(userStoryId: number): Promise<TaigaUserStoryDetail> {
    return this.request<TaigaUserStoryDetail>(`/userstories/${userStoryId}`);
  }

  /**
   * Obtiene una historia de usuario por referencia
   */
  async getUserStoryByRef(
    projectId: number,
    ref: number,
  ): Promise<TaigaUserStoryDetail> {
    return this.request<TaigaUserStoryDetail>(
      `/userstories/by_ref?project=${projectId}&ref=${ref}`,
    );
  }

  /**
   * Crea una nueva historia de usuario
   */
  async createUserStory(
    data: TaigaCreateUserStory,
  ): Promise<TaigaUserStoryDetail> {
    return this.request<TaigaUserStoryDetail>("/userstories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualiza una historia de usuario
   */
  async updateUserStory(
    userStoryId: number,
    data: TaigaUpdateUserStory,
  ): Promise<TaigaUserStoryDetail> {
    return this.request<TaigaUserStoryDetail>(`/userstories/${userStoryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Elimina una historia de usuario
   */
  async deleteUserStory(userStoryId: number): Promise<void> {
    await this.request<void>(`/userstories/${userStoryId}`, {
      method: "DELETE",
    });
  }

  /**
   * Busca historias de usuario por texto
   */
  async searchUserStories(
    projectId: number,
    query: string,
  ): Promise<TaigaUserStory[]> {
    return this.getUserStories({ project: projectId, q: query });
  }

  // ============================================
  // Tareas
  // ============================================

  /**
   * Obtiene tareas con filtros opcionales
   */
  async getTasks(filters?: TaigaTaskFilters): Promise<TaigaTask[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.set(key, value.join(","));
          } else {
            params.set(key, String(value));
          }
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : "/tasks";

    return this.request<TaigaTask[]>(endpoint);
  }

  /**
   * Obtiene una tarea específica
   */
  async getTask(taskId: number): Promise<TaigaTask> {
    return this.request<TaigaTask>(`/tasks/${taskId}`);
  }

  /**
   * Obtiene una tarea por referencia
   */
  async getTaskByRef(projectId: number, ref: number): Promise<TaigaTask> {
    return this.request<TaigaTask>(
      `/tasks/by_ref?project=${projectId}&ref=${ref}`,
    );
  }

  /**
   * Crea una nueva tarea
   */
  async createTask(data: TaigaCreateTask): Promise<TaigaTask> {
    return this.request<TaigaTask>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualiza una tarea
   */
  async updateTask(taskId: number, data: TaigaUpdateTask): Promise<TaigaTask> {
    return this.request<TaigaTask>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Elimina una tarea
   */
  async deleteTask(taskId: number): Promise<void> {
    await this.request<void>(`/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  /**
   * Busca tareas por texto
   */
  async searchTasks(projectId: number, query: string): Promise<TaigaTask[]> {
    return this.getTasks({ project: projectId, q: query });
  }

  // ============================================
  // Issues
  // ============================================

  /**
   * Obtiene issues con filtros opcionales
   */
  async getIssues(filters?: TaigaIssueFilters): Promise<TaigaIssue[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.set(key, value.join(","));
          } else {
            params.set(key, String(value));
          }
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/issues?${queryString}` : "/issues";

    return this.request<TaigaIssue[]>(endpoint);
  }

  /**
   * Obtiene un issue específico
   */
  async getIssue(issueId: number): Promise<TaigaIssue> {
    return this.request<TaigaIssue>(`/issues/${issueId}`);
  }

  // ============================================
  // Historial y Comentarios
  // ============================================

  /**
   * Obtiene el historial de un elemento (incluye comentarios)
   * @param type Tipo de elemento: userstory, task, issue
   * @param id ID del elemento
   */
  async getHistory(
    type: TaigaHistoryType,
    id: number,
  ): Promise<TaigaHistoryEntry[]> {
    return this.request<TaigaHistoryEntry[]>(`/history/${type}/${id}`);
  }

  /**
   * Obtiene solo los comentarios de un elemento
   */
  async getComments(
    type: TaigaHistoryType,
    id: number,
  ): Promise<TaigaHistoryEntry[]> {
    const history = await this.getHistory(type, id);
    // Filtrar solo entradas con comentarios (type 2 o comment no vacío)
    return history.filter(
      (entry) => entry.comment && entry.comment.trim() !== "",
    );
  }

  /**
   * Crea un comentario en un elemento
   * @param type Tipo de elemento: userstory, task, issue
   * @param id ID del elemento
   * @param comment Texto del comentario
   * @param version Versión actual del elemento (para control de concurrencia)
   */
  async createComment(
    type: TaigaHistoryType,
    id: number,
    comment: string,
    version: number,
  ): Promise<void> {
    // En Taiga, los comentarios se crean haciendo un PATCH al elemento con el campo comment
    const endpoint = type === "userstory" ? "userstories" : `${type}s`;
    await this.request(`/${endpoint}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ comment, version }),
    });
  }

  // ============================================
  // Búsqueda global
  // ============================================

  /**
   * Búsqueda global en un proyecto
   */
  async search(
    projectId: number,
    query: string,
  ): Promise<{
    count: number;
    userstories: TaigaUserStory[];
    tasks: TaigaTask[];
    issues: TaigaIssue[];
  }> {
    return this.request(
      `/search?project=${projectId}&text=${encodeURIComponent(query)}`,
    );
  }
}

// Instancia singleton del cliente
export const taigaClient = new TaigaClient();
