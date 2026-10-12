export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED";

export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  color: string | null;
}

export interface TaskItem {
  id: string;
  taskNumber: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  dueDate: Date | string | null;
  workspaceId: string;
  projectId: string;
  creatorId: string;
  assigneeId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  project: ProjectSummary;
  assignee: UserSummary | null;
  creator: UserSummary;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskItem[];
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  projects: ProjectSummary[];
}

export interface FilterState {
  searchQuery: string;
  projectId: string | null;
  priority: TaskPriority | null;
  assigneeId: string | null;
}

export interface WorkspaceMemberItem {
  id: string;
  role: MemberRole;
  workspaceId: string;
  userId: string;
  user: UserSummary;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date | string;
  taskId: string | null;
  userId: string | null;
  user: UserSummary | null;
  task?: {
    id: string;
    title: string;
    taskNumber?: number;
    project?: { key: string };
  } | null;
}

export interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  projectsCount?: number;
  tasksCount?: number;
}
