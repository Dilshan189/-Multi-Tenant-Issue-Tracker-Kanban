"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@/types";

export interface CreateProjectInput {
  name: string;
  key: string;
  color?: string;
  description?: string;
  workspaceId: string;
}

export async function createProjectAction(data: CreateProjectInput) {
  try {
    const key = data.key.toUpperCase().trim();
    const existing = await prisma.project.findFirst({
      where: {
        workspaceId: data.workspaceId,
        key,
      },
    });

    if (existing) {
      return { success: false, error: `Project key "${key}" already exists in this workspace.` };
    }

    const project = await prisma.project.create({
      data: {
        name: data.name.trim(),
        key,
        color: data.color || "#6366f1",
        description: data.description?.trim() || null,
        workspaceId: data.workspaceId,
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        action: "PROJECT_CREATED",
        details: JSON.stringify({ name: project.name, key: project.key }),
        workspaceId: data.workspaceId,
      },
    });

    revalidatePath("/");
    return { success: true, data: project };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateMemberRoleAction(
  memberId: string,
  newRole: MemberRole,
  workspaceId: string
) {
  try {
    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: { user: true },
    });

    await prisma.activityLog.create({
      data: {
        action: "MEMBER_ROLE_UPDATED",
        details: JSON.stringify({ user: updated.user.name, newRole }),
        workspaceId,
        userId: updated.userId,
      },
    });

    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update member role:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function inviteMemberAction(
  workspaceId: string,
  email: string,
  name: string,
  role: MemberRole = "MEMBER"
) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    // 1. Find or create user
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: { name: name.trim() },
      create: {
        email: cleanEmail,
        name: name.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    // 2. Check if already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return { success: false, error: "User is already a member of this workspace." };
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role,
      },
      include: { user: true },
    });

    await prisma.activityLog.create({
      data: {
        action: "MEMBER_INVITED",
        details: JSON.stringify({ email: cleanEmail, role }),
        workspaceId,
        userId: user.id,
      },
    });

    revalidatePath("/");
    return { success: true, data: membership };
  } catch (error) {
    console.error("Failed to invite member:", error);
    return { success: false, error: (error as Error).message };
  }
}
