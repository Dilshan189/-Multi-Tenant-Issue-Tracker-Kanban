import { ensureSeedData } from "@/server/services/seed-data";
import { getTasksForBoard } from "@/server/queries/tasks";
import {
  getAllWorkspaces,
  getWorkspaceBySlug,
  getWorkspaceMembers,
  getActivityLogs,
} from "@/server/queries/workspaces";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import {
  TaskItem,
  WorkspaceSummary,
  UserSummary,
  WorkspaceListItem,
  WorkspaceMemberItem,
  ActivityLogItem,
} from "@/types";

// Mock Fallback Data in case SQLite / PostgreSQL is not ready
const FALLBACK_WORKSPACE: WorkspaceSummary = {
  id: "ws-demo-1",
  name: "Acme Engineering",
  slug: "acme-hq",
  logoUrl: null,
  projects: [
    {
      id: "proj-fe",
      name: "Frontend Platform",
      key: "FE",
      color: "#6366f1",
    },
    {
      id: "proj-ai",
      name: "Gemini Intelligence",
      key: "AI",
      color: "#8b5cf6",
    },
  ],
};

const FALLBACK_MEMBERS: UserSummary[] = [
  {
    id: "user-alex",
    name: "Alex Vance",
    email: "lead@acme.dev",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "user-sarah",
    name: "Sarah Chen",
    email: "sarah@acme.dev",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "user-marcus",
    name: "Marcus Brody",
    email: "marcus@acme.dev",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  },
];

const FALLBACK_TASKS: TaskItem[] = [
  {
    id: "task-1",
    taskNumber: 1,
    title: "Multi-Tenant Workspace & Project Hierarchy Isolation",
    description: "Provide enterprise-grade isolation between tenant workspaces, projects, and role-based permissions.",
    status: "DONE",
    priority: "HIGH",
    order: 1000,
    projectId: "proj-fe",
    workspaceId: "ws-demo-1",
    creatorId: "user-alex",
    assigneeId: "user-sarah",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    project: { id: "proj-fe", name: "Frontend Platform", key: "FE", color: "#6366f1" },
    assignee: FALLBACK_MEMBERS[1],
    creator: FALLBACK_MEMBERS[0],
  },
  {
    id: "task-2",
    taskNumber: 2,
    title: "Interactive Kanban with 0ms Optimistic Drag-and-Drop Sync",
    description: "Seamless drag-and-drop state transitions with instant UI feedback and backend transactional synchronization.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    order: 2000,
    projectId: "proj-fe",
    workspaceId: "ws-demo-1",
    creatorId: "user-alex",
    assigneeId: "user-alex",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    project: { id: "proj-fe", name: "Frontend Platform", key: "FE", color: "#6366f1" },
    assignee: FALLBACK_MEMBERS[0],
    creator: FALLBACK_MEMBERS[0],
  },
  {
    id: "task-3",
    taskNumber: 1,
    title: "Autonomous Gemini Agent Tool Calling Engine",
    description: "Auto-parse natural language commands to create, update status, and assign tasks across projects.",
    status: "TODO",
    priority: "URGENT",
    order: 1000,
    projectId: "proj-ai",
    workspaceId: "ws-demo-1",
    creatorId: "user-alex",
    assigneeId: "user-sarah",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    project: { id: "proj-ai", name: "Gemini Intelligence", key: "AI", color: "#8b5cf6" },
    assignee: FALLBACK_MEMBERS[1],
    creator: FALLBACK_MEMBERS[0],
  },
  {
    id: "task-4",
    taskNumber: 3,
    title: "Real-time Activity Audit Trail Stream",
    description: "Record and display all mutation logs (creation, drag moves, AI actions) with relational integrity.",
    status: "BACKLOG",
    priority: "MEDIUM",
    order: 1000,
    projectId: "proj-fe",
    workspaceId: "ws-demo-1",
    creatorId: "user-alex",
    assigneeId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    project: { id: "proj-fe", name: "Frontend Platform", key: "FE", color: "#6366f1" },
    assignee: null,
    creator: FALLBACK_MEMBERS[0],
  },
];

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<{ workspace?: string }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const targetSlug = searchParams?.workspace || "acme-hq";

  let workspace: WorkspaceSummary = FALLBACK_WORKSPACE;
  let tasks: TaskItem[] = FALLBACK_TASKS;
  let members: UserSummary[] = FALLBACK_MEMBERS;
  let allWorkspaces: WorkspaceListItem[] = [];
  let workspaceMembers: WorkspaceMemberItem[] = [];
  let activityLogs: ActivityLogItem[] = [];

  try {
    // 1. Ensure seed data
    await ensureSeedData();

    // 2. Fetch all workspaces for switcher
    const rawAllWs = await getAllWorkspaces();
    if (rawAllWs.length > 0) {
      allWorkspaces = rawAllWs.map((ws) => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        logoUrl: ws.logoUrl,
        projectsCount: ws.projects.length,
        tasksCount: ws._count?.tasks || 0,
      }));
    }

    // 3. Find target workspace
    let activeWs = await getWorkspaceBySlug(targetSlug);
    if (!activeWs && rawAllWs.length > 0) {
      activeWs = await getWorkspaceBySlug(rawAllWs[0].slug);
    }

    if (activeWs) {
      workspace = {
        id: activeWs.id,
        name: activeWs.name,
        slug: activeWs.slug,
        logoUrl: activeWs.logoUrl,
        projects: activeWs.projects.map((p) => ({
          id: p.id,
          name: p.name,
          key: p.key,
          color: p.color,
        })),
      };

      // 4. Fetch DB tasks for this workspace
      const dbTasks = await getTasksForBoard(activeWs.id);
      if (dbTasks) {
        tasks = dbTasks;
      }

      // 5. Fetch DB members for this workspace
      const rawMembers = await getWorkspaceMembers(activeWs.id);
      if (rawMembers.length > 0) {
        workspaceMembers = rawMembers as unknown as WorkspaceMemberItem[];
        members = rawMembers.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        }));
      }

      // 6. Fetch DB activity logs
      const rawLogs = await getActivityLogs(activeWs.id, 30);
      if (rawLogs.length > 0) {
        activityLogs = rawLogs as unknown as ActivityLogItem[];
      }
    }
  } catch (error) {
    console.warn("Database query notice, rendering with fallback data:", error);
  }

  return (
    <DashboardView
      workspace={workspace}
      initialTasks={tasks}
      members={members}
      allWorkspaces={allWorkspaces}
      workspaceMembers={workspaceMembers}
      activityLogs={activityLogs}
    />
  );
}
