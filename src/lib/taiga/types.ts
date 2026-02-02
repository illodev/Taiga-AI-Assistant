/**
 * Tipos para la API de Taiga
 * Basados en la documentación oficial de Taiga API v1
 */

// ============================================
// Tipos de autenticación
// ============================================

export interface TaigaAuthCredentials {
  username: string;
  password: string;
  type: "normal";
}

export interface TaigaAuthResponse {
  id: number;
  username: string;
  full_name: string;
  full_name_display: string;
  email: string;
  photo: string | null;
  auth_token: string;
  refresh: string;
}

// ============================================
// Tipos de proyecto
// ============================================

export interface TaigaProject {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_date: string;
  modified_date: string;
  owner: TaigaMember;
  members: TaigaMember[];
  is_private: boolean;
  total_milestones: number;
  total_story_points: number;
  is_featured: boolean;
  is_looking_for_people: boolean;
  tags: string[];
  tags_colors: Record<string, string>;
  my_permissions: string[];
  i_am_owner: boolean;
  i_am_admin: boolean;
  i_am_member: boolean;
}

export interface TaigaProjectDetail extends TaigaProject {
  us_statuses: TaigaStatus[];
  task_statuses: TaigaStatus[];
  issue_statuses: TaigaStatus[];
  priorities: TaigaPriority[];
  severities: TaigaSeverity[];
  issue_types: TaigaIssueType[];
  points: TaigaPoints[];
  roles: TaigaRole[];
}

export interface TaigaProjectStats {
  name: string;
  total_milestones: number;
  total_points: number;
  closed_points: number;
  defined_points: number;
  assigned_points: number;
  speed: number;
  total_userstories: number;
  closed_userstories: number;
  total_tasks: number;
  closed_tasks: number;
}

// ============================================
// Tipos de usuario y miembros
// ============================================

export interface TaigaMember {
  id: number;
  username: string;
  full_name: string;
  full_name_display: string;
  photo: string | null;
  is_active: boolean;
  role: number;
  role_name: string;
}

export interface TaigaRole {
  id: number;
  name: string;
  slug: string;
  permissions: string[];
  order: number;
  computable: boolean;
}

// ============================================
// Tipos de milestone (sprint)
// ============================================

export interface TaigaMilestone {
  id: number;
  name: string;
  slug: string;
  project: number;
  project_extra_info: {
    id: number;
    name: string;
    slug: string;
    logo_small_url: string | null;
  };
  owner: number;
  estimated_start: string;
  estimated_finish: string;
  created_date: string;
  modified_date: string;
  closed: boolean;
  disponibility: number;
  order: number;
  user_stories: TaigaUserStory[];
  total_points: number;
  closed_points: number;
}

export interface TaigaMilestoneStats {
  name: string;
  estimated_start: string;
  estimated_finish: string;
  total_points: number;
  completed_points: number;
  total_userstories: number;
  completed_userstories: number;
  total_tasks: number;
  completed_tasks: number;
  iocaine_doses: number;
  days: TaigaMilestoneDay[];
}

export interface TaigaMilestoneDay {
  day: string;
  name: number;
  open_points: number;
  optimal_points: number;
}

// ============================================
// Tipos de historia de usuario
// ============================================

export interface TaigaUserStory {
  id: number;
  ref: number;
  project: number;
  project_extra_info: {
    id: number;
    name: string;
    slug: string;
    logo_small_url: string | null;
  };
  milestone: number | null;
  milestone_slug: string | null;
  milestone_name: string | null;
  created_date: string;
  modified_date: string;
  finish_date: string | null;
  subject: string;
  description: string;
  description_html: string;
  client_requirement: boolean;
  team_requirement: boolean;
  is_blocked: boolean;
  blocked_note: string;
  blocked_note_html: string;
  is_closed: boolean;
  backlog_order: number;
  sprint_order: number;
  kanban_order: number;
  status: number;
  status_extra_info: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  assigned_to: number | null;
  assigned_to_extra_info: TaigaMember | null;
  assigned_users: number[];
  owner: number;
  owner_extra_info: TaigaMember;
  points: Record<string, number>;
  total_points: number;
  tags: string[];
  watchers: number[];
  external_reference: string | null;
  tribe_gig: string | null;
  version: number;
}

export interface TaigaUserStoryDetail extends TaigaUserStory {
  neighbors: {
    previous: { id: number; ref: number; subject: string } | null;
    next: { id: number; ref: number; subject: string } | null;
  };
  tasks: TaigaTask[];
  attachments: TaigaAttachment[];
  comment: string;
  generated_from_issue: number | null;
  generated_from_task: number | null;
}

export interface TaigaCreateUserStory {
  project: number;
  subject: string;
  description?: string;
  milestone?: number | null;
  status?: number;
  assigned_to?: number | null;
  assigned_users?: number[];
  tags?: string[];
  points?: Record<string, number>;
  is_blocked?: boolean;
  blocked_note?: string;
}

export interface TaigaUpdateUserStory {
  subject?: string;
  description?: string;
  milestone?: number | null;
  status?: number;
  assigned_to?: number | null;
  assigned_users?: number[];
  tags?: string[];
  points?: Record<string, number>;
  is_blocked?: boolean;
  blocked_note?: string;
  version: number;
}

// ============================================
// Tipos de tarea
// ============================================

export interface TaigaTask {
  id: number;
  ref: number;
  project: number;
  project_extra_info: {
    id: number;
    name: string;
    slug: string;
    logo_small_url: string | null;
  };
  user_story: number | null;
  user_story_extra_info: {
    id: number;
    ref: number;
    subject: string;
    epics: Array<{
      id: number;
      ref: number;
      subject: string;
      color: string;
    }> | null;
  } | null;
  milestone: number | null;
  milestone_slug: string | null;
  created_date: string;
  modified_date: string;
  finished_date: string | null;
  subject: string;
  description: string;
  description_html: string;
  is_blocked: boolean;
  blocked_note: string;
  blocked_note_html: string;
  is_iocaine: boolean;
  is_closed: boolean;
  status: number;
  status_extra_info: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  assigned_to: number | null;
  assigned_to_extra_info: TaigaMember | null;
  owner: number;
  owner_extra_info: TaigaMember;
  tags: string[];
  watchers: number[];
  external_reference: string | null;
  taskboard_order: number;
  us_order: number;
  version: number;
}

export interface TaigaCreateTask {
  project: number;
  subject: string;
  description?: string;
  user_story?: number | null;
  milestone?: number | null;
  status?: number;
  assigned_to?: number | null;
  tags?: string[];
  is_blocked?: boolean;
  blocked_note?: string;
  is_iocaine?: boolean;
}

export interface TaigaUpdateTask {
  subject?: string;
  description?: string;
  user_story?: number | null;
  milestone?: number | null;
  status?: number;
  assigned_to?: number | null;
  tags?: string[];
  is_blocked?: boolean;
  blocked_note?: string;
  is_iocaine?: boolean;
  version: number;
}

// ============================================
// Tipos de issue
// ============================================

export interface TaigaIssue {
  id: number;
  ref: number;
  project: number;
  project_extra_info: {
    id: number;
    name: string;
    slug: string;
    logo_small_url: string | null;
  };
  milestone: number | null;
  created_date: string;
  modified_date: string;
  finished_date: string | null;
  subject: string;
  description: string;
  description_html: string;
  is_blocked: boolean;
  blocked_note: string;
  blocked_note_html: string;
  is_closed: boolean;
  status: number;
  status_extra_info: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  type: number;
  type_extra_info: {
    name: string;
    color: string;
  };
  priority: number;
  priority_extra_info: {
    name: string;
    color: string;
  };
  severity: number;
  severity_extra_info: {
    name: string;
    color: string;
  };
  assigned_to: number | null;
  assigned_to_extra_info: TaigaMember | null;
  owner: number;
  owner_extra_info: TaigaMember;
  tags: string[];
  watchers: number[];
  external_reference: string | null;
  version: number;
}

// ============================================
// Tipos auxiliares
// ============================================

export interface TaigaStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  is_closed: boolean;
  is_archived: boolean;
  order: number;
  project: number;
}

export interface TaigaPriority {
  id: number;
  name: string;
  color: string;
  order: number;
  project: number;
}

export interface TaigaSeverity {
  id: number;
  name: string;
  color: string;
  order: number;
  project: number;
}

export interface TaigaIssueType {
  id: number;
  name: string;
  color: string;
  order: number;
  project: number;
}

export interface TaigaPoints {
  id: number;
  name: string;
  value: number | null;
  order: number;
  project: number;
}

export interface TaigaAttachment {
  id: number;
  name: string;
  size: number;
  url: string;
  description: string;
  is_deprecated: boolean;
  created_date: string;
  modified_date: string;
  owner: number;
  attached_file: string;
  thumbnail_card_url: string | null;
  from_comment: boolean;
}

// ============================================
// Tipos de respuesta genéricos
// ============================================

export interface TaigaPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TaigaErrorResponse {
  _error_message: string;
  _error_type: string;
}

// ============================================
// Tipos de filtros
// ============================================

export interface TaigaUserStoryFilters {
  project?: number;
  milestone?: number | "null";
  milestone__isnull?: boolean;
  status?: number;
  status__is_archived?: boolean;
  status__is_closed?: boolean;
  tags?: string[];
  watchers?: number[];
  assigned_to?: number;
  owner?: number;
  epic?: number;
  role?: number;
  q?: string;
  // Ordenamiento: created_date, modified_date, ref, subject, total_points
  // Usar - para orden descendente (ej: -created_date)
  order_by?: string;
}

export interface TaigaTaskFilters {
  project?: number;
  milestone?: number | "null";
  user_story?: number | "null";
  status?: number;
  status__is_closed?: boolean;
  tags?: string[];
  assigned_to?: number;
  owner?: number;
  role?: number;
  q?: string;
  // Ordenamiento: created_date, modified_date, ref, subject
  // Usar - para orden descendente (ej: -created_date)
  order_by?: string;
}

export interface TaigaIssueFilters {
  project?: number;
  milestone?: number | "null";
  status?: number;
  status__is_closed?: boolean;
  type?: number;
  priority?: number;
  severity?: number;
  tags?: string[];
  assigned_to?: number;
  owner?: number;
  role?: number;
  q?: string;
}

// ============================================
// Tipos de comentarios/historial
// ============================================

export interface TaigaHistoryEntry {
  id: string;
  user: {
    pk: number;
    username: string;
    name: string;
    photo: string | null;
    is_active: boolean;
  };
  created_at: string;
  type: number; // 1 = change, 2 = comment
  key: string;
  diff: Record<string, unknown>;
  snapshot: Record<string, unknown> | null;
  values: Record<string, unknown>;
  values_diff: Record<string, unknown>;
  comment: string;
  comment_html: string;
  delete_comment_date: string | null;
  delete_comment_user: Record<string, unknown> | null;
  edit_comment_date: string | null;
  is_hidden: boolean;
  is_snapshot: boolean;
}

export type TaigaHistoryType = "userstory" | "task" | "issue";
