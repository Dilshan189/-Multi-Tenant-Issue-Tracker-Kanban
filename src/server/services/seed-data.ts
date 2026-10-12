import { prisma } from "@/lib/prisma";

export async function ensureSeedData() {
  try {
    // Check if any workspace exists
    const existing = await prisma.workspace.findFirst({
      where: { slug: "acme-hq" },
      include: {
        projects: true,
        tasks: true,
        members: { include: { user: true } },
      },
    });

    if (existing && existing.projects.length > 0 && existing.tasks.length > 0) {
      return existing;
    }

    // 1. Create Demo Users
    const alex = await prisma.user.upsert({
      where: { email: "lead@acme.dev" },
      update: {},
      create: {
        email: "lead@acme.dev",
        name: "Alex Vance",
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
    });

    const sarah = await prisma.user.upsert({
      where: { email: "sarah@acme.dev" },
      update: {},
      create: {
        email: "sarah@acme.dev",
        name: "Sarah Chen",
        avatarUrl:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      },
    });

    const marcus = await prisma.user.upsert({
      where: { email: "marcus@acme.dev" },
      update: {},
      create: {
        email: "marcus@acme.dev",
        name: "Marcus Brody",
        avatarUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      },
    });

    // 2. Workspace 1: Acme Engineering
    const workspace1 = await prisma.workspace.upsert({
      where: { slug: "acme-hq" },
      update: {},
      create: {
        name: "Acme Engineering",
        slug: "acme-hq",
        members: {
          create: [
            { userId: alex.id, role: "OWNER" },
            { userId: sarah.id, role: "ADMIN" },
            { userId: marcus.id, role: "MEMBER" },
          ],
        },
      },
    });

    // 3. Workspace 2: Starlight Cloud Labs (proves multi-tenancy isolation!)
    const workspace2 = await prisma.workspace.upsert({
      where: { slug: "starlight-labs" },
      update: {},
      create: {
        name: "Starlight Cloud Labs",
        slug: "starlight-labs",
        members: {
          create: [
            { userId: sarah.id, role: "OWNER" },
            { userId: alex.id, role: "MEMBER" },
          ],
        },
      },
    });

    // Projects for Workspace 1
    const frontendProject = await prisma.project.upsert({
      where: {
        workspaceId_key: {
          workspaceId: workspace1.id,
          key: "FE",
        },
      },
      update: {},
      create: {
        name: "Frontend Platform",
        key: "FE",
        color: "#6366f1", // Indigo
        description: "Next.js 15, Tailwind & fluid Kanban interface",
        workspaceId: workspace1.id,
      },
    });

    const aiProject = await prisma.project.upsert({
      where: {
        workspaceId_key: {
          workspaceId: workspace1.id,
          key: "AI",
        },
      },
      update: {},
      create: {
        name: "Gemini Intelligence",
        key: "AI",
        color: "#8b5cf6", // Purple
        description: "Autonomous agent tool calling & natural language orchestration",
        workspaceId: workspace1.id,
      },
    });

    // Projects for Workspace 2
    const infraProject = await prisma.project.upsert({
      where: {
        workspaceId_key: {
          workspaceId: workspace2.id,
          key: "INFRA",
        },
      },
      update: {},
      create: {
        name: "Cloud Infrastructure",
        key: "INFRA",
        color: "#06b6d4", // Cyan
        description: "Kubernetes clusters & zero-downtime database failover",
        workspaceId: workspace2.id,
      },
    });

    // Seed Tasks for Workspace 1
    const initialTasks1 = [
      {
        taskNumber: 1,
        title: "Multi-Tenant Workspace & Project Hierarchy Isolation",
        description: "Provide enterprise-grade isolation between tenant workspaces, projects, and role-based permissions.",
        status: "DONE" as const,
        priority: "HIGH" as const,
        order: 1000,
        projectId: frontendProject.id,
        workspaceId: workspace1.id,
        creatorId: alex.id,
        assigneeId: sarah.id,
      },
      {
        taskNumber: 2,
        title: "Interactive Kanban with 0ms Optimistic Drag-and-Drop Sync",
        description: "Seamless drag-and-drop state transitions with instant UI feedback and backend transactional synchronization.",
        status: "IN_PROGRESS" as const,
        priority: "URGENT" as const,
        order: 2000,
        projectId: frontendProject.id,
        workspaceId: workspace1.id,
        creatorId: alex.id,
        assigneeId: alex.id,
      },
      {
        taskNumber: 1,
        title: "Autonomous Gemini Agent Tool Calling Engine",
        description: "Auto-parse natural language commands to create, update status, and assign tasks across projects.",
        status: "TODO" as const,
        priority: "URGENT" as const,
        order: 1000,
        projectId: aiProject.id,
        workspaceId: workspace1.id,
        creatorId: alex.id,
        assigneeId: sarah.id,
      },
      {
        taskNumber: 3,
        title: "Real-time Activity Audit Trail Stream",
        description: "Record and display all mutation logs (creation, drag moves, AI actions) with relational integrity.",
        status: "BACKLOG" as const,
        priority: "MEDIUM" as const,
        order: 1000,
        projectId: frontendProject.id,
        workspaceId: workspace1.id,
        creatorId: alex.id,
        assigneeId: marcus.id,
      },
    ];

    for (const task of initialTasks1) {
      const created = await prisma.task.create({
        data: task,
      });

      await prisma.activityLog.create({
        data: {
          action: "TASK_CREATED",
          details: JSON.stringify({ title: task.title, status: task.status }),
          workspaceId: workspace1.id,
          taskId: created.id,
          userId: alex.id,
        },
      });
    }

    // Seed Tasks for Workspace 2
    await prisma.task.create({
      data: {
        taskNumber: 1,
        title: "Provision Multi-Region PostgreSQL Cluster with Connection Pooling",
        description: "Setup read replicas and connection pooling for high throughput issue streaming.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        order: 1000,
        projectId: infraProject.id,
        workspaceId: workspace2.id,
        creatorId: sarah.id,
        assigneeId: alex.id,
      },
    });

    return await prisma.workspace.findUnique({
      where: { id: workspace1.id },
      include: {
        projects: true,
        tasks: true,
        members: { include: { user: true } },
      },
    });
  } catch (error) {
    console.error("Error in ensureSeedData:", error);
    return null;
  }
}
