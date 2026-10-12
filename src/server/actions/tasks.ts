"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TaskPriority, TaskStatus } from "@/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  workspaceId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  creatorId?: string;
  dueDate?: Date | string | null;
}

export async function createTaskAction(data: CreateTaskInput) {
  try {
    // 1. Get current highest task number for this project
    const latestTask = await prisma.task.findFirst({
      where: { projectId: data.projectId },
      orderBy: { taskNumber: "desc" },
      select: { taskNumber: true },
    });
    const nextNumber = (latestTask?.taskNumber ?? 0) + 1;

    // 2. Get highest order in target status
    const targetStatus = data.status || "TODO";
    const lastInColumn = await prisma.task.findFirst({
      where: { workspaceId: data.workspaceId, status: targetStatus },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastInColumn?.order ?? 0) + 1000;

    // 3. Fallback creator if not authenticated yet
    let creatorId = data.creatorId;
    if (!creatorId) {
      const defaultUser = await prisma.user.findFirst();
      creatorId = defaultUser?.id;
      if (!creatorId) {
        const newUser = await prisma.user.create({
          data: {
            email: "demo@linearclone.com",
            name: "Demo Admin",
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoAdmin",
          },
        });
        creatorId = newUser.id;
      }
    }

    // 4. Create task in DB
    const newTask = await prisma.task.create({
      data: {
        taskNumber: nextNumber,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: targetStatus,
        priority: data.priority || "MEDIUM",
        order: nextOrder,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        creatorId: creatorId,
        assigneeId: data.assigneeId || null,
        activityLogs: {
          create: {
            action: "TASK_CREATED",
            details: JSON.stringify({ title: data.title, status: targetStatus }),
            workspaceId: data.workspaceId,
            userId: creatorId,
          },
        },
      },
      include: {
        project: true,
        assignee: true,
        creator: true,
      },
    });

    revalidatePath(`/workspaces/${data.workspaceId}`);
    return { success: true, data: newTask };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateTaskStatusAndOrderAction(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number,
  workspaceSlug?: string
) {
  try {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true, workspaceId: true },
    });

    if (!existing) {
      return { success: false, error: "Task not found" };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        order: newOrder,
        activityLogs: {
          create: {
            action: "STATUS_CHANGED",
            details: JSON.stringify({ from: existing.status, to: newStatus }),
            workspaceId: existing.workspaceId,
          },
        },
      },
    });

    if (workspaceSlug) {
      revalidatePath(`/${workspaceSlug}`);
    } else {
      revalidatePath("/");
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update task status/order:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateTaskDetailsAction(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: Date | string | null;
  }
) {
  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.assigneeId !== undefined && { assigneeId: updates.assigneeId }),
        ...(updates.dueDate !== undefined && {
          dueDate: updates.dueDate ? new Date(updates.dueDate) : null,
        }),
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update task details:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: (error as Error).message };
  }
}
