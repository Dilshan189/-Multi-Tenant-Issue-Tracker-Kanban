import { ensureSeedData } from "@/server/services/seed-data";
import { getTasksForBoard } from "@/server/queries/tasks";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { TaskItem, WorkspaceSummary, UserSummary } from "@/types";

// Mock Fallback Data in case PostgreSQL is not yet spun up
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
];

const FALLBACK_TASKS: TaskItem[] = [
  {
    id: "task-1",
    taskNumber: 1,
    title: "Build Multi-tenant Workspace navigation & sidebar",
    description: "Allow switching between workspaces and projects seamlessly with keyboard shortcuts.",
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
    title: "Integrate @hello-pangea/dnd for fluid Kanban Board",
    description: "Smooth drag-and-drop state syncing with instant optimistic client updates.",
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
    title: "Define Gemini Tool Calling schemas for Task Automation",
    description: "Auto-parse commands: 'Create high priority bug in FE project assigned to Sarah'",
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
    title: "Add real-time Activity Audit Log stream",
    description: "Track all actions (created, status changed, AI updated) with timestamps.",
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

export default async function HomePage() {
  let workspace: WorkspaceSummary = FALLBACK_WORKSPACE;
  let tasks: TaskItem[] = FALLBACK_TASKS;
  let members: UserSummary[] = FALLBACK_MEMBERS;

  try {
    const seeded = await ensureSeedData();
    if (seeded) {
      workspace = {
        id: seeded.id,
        name: seeded.name,
        slug: seeded.slug,
        logoUrl: seeded.logoUrl,
        projects: seeded.projects.map((p) => ({
          id: p.id,
          name: p.name,
          key: p.key,
          color: p.color,
        })),
      };

      const dbTasks = await getTasksForBoard(seeded.id);
      if (dbTasks.length > 0) {
        tasks = dbTasks;
      }
    }
  } catch (error) {
    console.warn("Database not reachable, rendering with demo workspace fallback:", error);
  }

  return (
    <DashboardView
      workspace={workspace}
      initialTasks={tasks}
      members={members}
    />
  );
}
