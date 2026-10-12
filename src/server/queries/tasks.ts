import { prisma } from "@/lib/prisma";
import { TaskItem, TaskPriority } from "@/types";

export async function getTasksForBoard(
  workspaceId: string,
  options?: {
    projectId?: string | null;
    priority?: TaskPriority | null;
    assigneeId?: string | null;
    searchQuery?: string | null;
  }
): Promise<TaskItem[]> {
  try {
    const whereClause: Record<string, unknown> = {
      workspaceId,
    };

    if (options?.projectId) {
      whereClause.projectId = options.projectId;
    }

    if (options?.priority) {
      whereClause.priority = options.priority;
    }

    if (options?.assigneeId) {
      whereClause.assigneeId = options.assigneeId;
    }

    if (options?.searchQuery && options.searchQuery.trim() !== "") {
      whereClause.OR = [
        { title: { contains: options.searchQuery, mode: "insensitive" } },
        { description: { contains: options.searchQuery, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, key: true, color: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return tasks as unknown as TaskItem[];
  } catch (error) {
    console.error("Error fetching tasks for board:", error);
    return [];
  }
}

export async function getTaskById(taskId: string) {
  try {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignee: true,
        creator: true,
        activityLogs: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}
