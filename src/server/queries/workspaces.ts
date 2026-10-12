import { prisma } from "@/lib/prisma";

export async function getWorkspaceBySlug(slug: string) {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        projects: {
          orderBy: { createdAt: "asc" },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });
    return workspace;
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return null;
  }
}

export async function getAllWorkspaces() {
  try {
    return await prisma.workspace.findMany({
      include: {
        projects: true,
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return [];
  }
}
