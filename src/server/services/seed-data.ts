import { prisma } from "@/lib/prisma";

export async function ensureSeedData() {
  try {
    // Check if any workspace exists
    const existing = await prisma.workspace.findFirst({
      include: { projects: true, tasks: true },
    });

    if (existing && existing.projects.length > 0 && existing.tasks.length > 0) {
      return existing;
    }

    // Create Demo User
    const user = await prisma.user.upsert({
      where: { email: "lead@acme.dev" },
      update: {},
      create: {
        email: "lead@acme.dev",
        name: "Alex Vance",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
    });

    const devUser = await prisma.user.upsert({
      where: { email: "sarah@acme.dev" },
      update: {},
      create: {
        email: "sarah@acme.dev",
        name: "Sarah Chen",
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      },
    });

    // Create Default Workspace
    const workspace = await prisma.workspace.upsert({
      where: { slug: "acme-hq" },
      update: {},
      create: {
        name: "Acme Engineering",
        slug: "acme-hq",
        members: {
          create: [
            { userId: user.id, role: "OWNER" },
            { userId: devUser.id, role: "MEMBER" },
          ],
        },
      },
    });

    // Create Projects
    const frontendProject = await prisma.project.upsert({
      where: {
        workspaceId_key: {
          workspaceId: workspace.id,
          key: "FE",
        },
      },
      update: {},
      create: {
        name: "Frontend Platform",
        key: "FE",
        color: "#6366f1", // Indigo
        description: "Next.js 15, Tailwind & shadcn UI components",
        workspaceId: workspace.id,
      },
    });

    const aiProject = await prisma.project.upsert({
      where: {
        workspaceId_key: {
          workspaceId: workspace.id,
          key: "AI",
        },
      },
      update: {},
      create: {
        name: "Gemini Intelligence",
        key: "AI",
        color: "#8b5cf6", // Purple
        description: "Agentic tool calling and task orchestration",
        workspaceId: workspace.id,
      },
    });

    // Create Initial Tasks
    const initialTasks = [
      {
        taskNumber: 1,
        title: "Build Multi-tenant Workspace navigation & sidebar",
        description: "Allow switching between workspaces and projects seamlessly with keyboard shortcuts.",
        status: "DONE" as const,
        priority: "HIGH" as const,
        order: 1000,
        projectId: frontendProject.id,
        workspaceId: workspace.id,
        creatorId: user.id,
        assigneeId: devUser.id,
      },
      {
        taskNumber: 2,
        title: "Integrate @hello-pangea/dnd for fluid Kanban Board",
        description: "Smooth drag-and-drop state syncing with instant optimistic client updates.",
        status: "IN_PROGRESS" as const,
        priority: "URGENT" as const,
        order: 2000,
        projectId: frontendProject.id,
        workspaceId: workspace.id,
        creatorId: user.id,
        assigneeId: user.id,
      },
      {
        taskNumber: 1,
        title: "Define Gemini Tool Calling schemas for Task Automation",
        description: "Auto-parse commands: 'Create high priority bug in FE project assigned to Sarah'",
        status: "TODO" as const,
        priority: "URGENT" as const,
        order: 1000,
        projectId: aiProject.id,
        workspaceId: workspace.id,
        creatorId: user.id,
        assigneeId: devUser.id,
      },
      {
        taskNumber: 3,
        title: "Add real-time Activity Audit Log stream",
        description: "Track all actions (created, status changed, AI updated) with timestamps.",
        status: "BACKLOG" as const,
        priority: "MEDIUM" as const,
        order: 1000,
        projectId: frontendProject.id,
        workspaceId: workspace.id,
        creatorId: user.id,
        assigneeId: null,
      },
    ];

    for (const task of initialTasks) {
      await prisma.task.create({
        data: task,
      });
    }

    return await prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: { projects: true, tasks: true },
    });
  } catch (error) {
    console.error("Error in ensureSeedData:", error);
    return null;
  }
}
