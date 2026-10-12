"use server";

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { TaskItem, TaskPriority, TaskStatus } from "@/types";
import { revalidatePath } from "next/cache";

const apiKey = process.env.GEMINI_API_KEY || "";
const gemini = new GoogleGenAI({ apiKey });

// 1. Tool Declaration: Create Task
const createTaskDeclaration: FunctionDeclaration = {
  name: "create_task",
  description:
    "Creates a new issue or task within a workspace and project. Auto-sets next task number.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Concise summary or title of the task",
      },
      description: {
        type: Type.STRING,
        description: "Detailed description of what needs to be done",
      },
      projectKey: {
        type: Type.STRING,
        description: "The uppercase key of the project, e.g. 'FE' or 'AI'",
      },
      priority: {
        type: Type.STRING,
        description: "One of: URGENT, HIGH, MEDIUM, LOW, NONE",
      },
      status: {
        type: Type.STRING,
        description: "One of: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE",
      },
      assigneeEmail: {
        type: Type.STRING,
        description: "Email or name of the member to assign to (optional)",
      },
    },
    required: ["title"],
  },
};

// 2. Tool Declaration: Update Task
const updateTaskDeclaration: FunctionDeclaration = {
  name: "update_task",
  description:
    "Updates status, priority, or details of an existing task by task key (e.g. 'FE-1') or ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskKeyOrId: {
        type: Type.STRING,
        description: "The task key (e.g. 'FE-1', 'AI-2') or unique ID",
      },
      status: {
        type: Type.STRING,
        description: "New status: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED",
      },
      priority: {
        type: Type.STRING,
        description: "New priority: URGENT, HIGH, MEDIUM, LOW, NONE",
      },
      title: {
        type: Type.STRING,
        description: "New title (optional)",
      },
    },
    required: ["taskKeyOrId"],
  },
};

// 3. Tool Declaration: Assign Task
const assignTaskDeclaration: FunctionDeclaration = {
  name: "assign_task",
  description: "Assigns an existing task to a team member by email or name.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskKeyOrId: {
        type: Type.STRING,
        description: "The task key (e.g. 'FE-1') or ID",
      },
      assigneeEmailOrName: {
        type: Type.STRING,
        description: "Email or name of the team member to assign",
      },
    },
    required: ["taskKeyOrId", "assigneeEmailOrName"],
  },
};

// 4. Tool Declaration: Delete Task
const deleteTaskDeclaration: FunctionDeclaration = {
  name: "delete_task",
  description: "Deletes a task by its task key (e.g. 'FE-1') or ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskKeyOrId: {
        type: Type.STRING,
        description: "The task key (e.g. 'FE-1') or unique ID to delete",
      },
    },
    required: ["taskKeyOrId"],
  },
};

// 5. Tool Declaration: List / Summarize Tasks
const listTasksDeclaration: FunctionDeclaration = {
  name: "list_tasks",
  description: "Queries tasks or summarizes sprint status for the workspace or specific project.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      projectKey: {
        type: Type.STRING,
        description: "Optional project key filter, e.g. 'FE'",
      },
      status: {
        type: Type.STRING,
        description: "Optional status filter",
      },
    },
  },
};

export interface AgentExecutionResult {
  reply: string;
  toolCallsExecuted: {
    name: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
  }[];
  affectedTask?: TaskItem | null;
  deletedTaskId?: string | null;
}

// Helper: Find task by key like "FE-1" or by cuid ID
async function findTaskByKeyOrId(keyOrId: string, workspaceId: string) {
  const trimmed = keyOrId.trim();
  // Check if matches pattern "KEY-123"
  const match = trimmed.match(/^([A-Za-z]+)-(\d+)$/);
  if (match) {
    const projectKey = match[1].toUpperCase();
    const taskNumber = parseInt(match[2], 10);
    return await prisma.task.findFirst({
      where: {
        workspaceId,
        taskNumber,
        project: { key: projectKey },
      },
      include: { project: true, assignee: true, creator: true },
    });
  }

  // Otherwise try ID match
  return await prisma.task.findFirst({
    where: {
      id: trimmed,
      workspaceId,
    },
    include: { project: true, assignee: true, creator: true },
  });
}

// Helper: Find user by email or name in workspace
async function findUserByEmailOrName(query: string, workspaceId: string) {
  const clean = query.trim().toLowerCase();
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      OR: [
        { user: { email: { contains: clean } } },
        { user: { name: { contains: clean } } },
      ],
    },
    include: { user: true },
  });
  return member?.user || null;
}

export async function runGeminiAgentAction(
  prompt: string,
  workspaceId: string
): Promise<AgentExecutionResult> {
  const toolCallsExecuted: AgentExecutionResult["toolCallsExecuted"] = [];
  let affectedTask: TaskItem | null = null;
  let deletedTaskId: string | null = null;

  // Fallback / Simulation Mode when no live API key is configured
  if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey.trim() === "") {
    const lower = prompt.toLowerCase();

    // 1. Handle "assign" command
    if (lower.includes("assign")) {
      const keyMatch = prompt.match(/([A-Za-z]+-\d+)/i);
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: lower.includes("sarah") ? "Sarah" : lower.includes("alex") ? "Alex" : "Marcus" } },
            { email: { contains: lower.includes("sarah") ? "sarah" : lower.includes("alex") ? "lead" : "marcus" } },
          ],
        },
      });

      if (keyMatch) {
        const found = await findTaskByKeyOrId(keyMatch[1], workspaceId);
        if (found && user) {
          const updated = await prisma.task.update({
            where: { id: found.id },
            data: { assigneeId: user.id },
            include: { project: true, assignee: true, creator: true },
          });

          await prisma.activityLog.create({
            data: {
              action: "AI_AGENT_ACTION",
              details: JSON.stringify({ tool: "assign_task", task: keyMatch[1], assignee: user.name }),
              workspaceId,
              taskId: updated.id,
            },
          });

          revalidatePath("/");
          toolCallsExecuted.push({
            name: "assign_task",
            args: { taskKeyOrId: keyMatch[1], assignee: user.name },
            result: { success: true, taskId: updated.id, assigneeName: user.name },
          });

          return {
            reply: `Autonomous Agent called \`assign_task\`: Assigned **${found.project.key}-${found.taskNumber}** ("${found.title}") to **${user.name}**.`,
            toolCallsExecuted,
            affectedTask: updated as unknown as TaskItem,
          };
        }
      }
    }

    // 2. Handle "update" or "move" status
    if (lower.includes("move") || (lower.includes("update") && !lower.includes("create"))) {
      const keyMatch = prompt.match(/([A-Za-z]+-\d+)/i);
      let newStatus: TaskStatus = "IN_PROGRESS";
      if (lower.includes("done")) newStatus = "DONE";
      else if (lower.includes("review")) newStatus = "IN_REVIEW";
      else if (lower.includes("todo")) newStatus = "TODO";
      else if (lower.includes("backlog")) newStatus = "BACKLOG";

      if (keyMatch) {
        const found = await findTaskByKeyOrId(keyMatch[1], workspaceId);
        if (found) {
          const updated = await prisma.task.update({
            where: { id: found.id },
            data: { status: newStatus },
            include: { project: true, assignee: true, creator: true },
          });

          await prisma.activityLog.create({
            data: {
              action: "AI_AGENT_ACTION",
              details: JSON.stringify({ tool: "update_task", task: keyMatch[1], status: newStatus }),
              workspaceId,
              taskId: updated.id,
            },
          });

          revalidatePath("/");
          toolCallsExecuted.push({
            name: "update_task",
            args: { taskKeyOrId: keyMatch[1], status: newStatus },
            result: { success: true, taskId: updated.id, status: newStatus },
          });

          return {
            reply: `Autonomous Agent called \`update_task\`: Transitioned **${found.project.key}-${found.taskNumber}** to **${newStatus}**.`,
            toolCallsExecuted,
            affectedTask: updated as unknown as TaskItem,
          };
        }
      }
    }

    // 3. Handle "delete" command
    if (lower.includes("delete") || lower.includes("remove")) {
      const keyMatch = prompt.match(/([A-Za-z]+-\d+)/i);
      if (keyMatch) {
        const found = await findTaskByKeyOrId(keyMatch[1], workspaceId);
        if (found) {
          await prisma.task.delete({ where: { id: found.id } });
          revalidatePath("/");
          toolCallsExecuted.push({
            name: "delete_task",
            args: { taskKeyOrId: keyMatch[1] },
            result: { success: true, deletedId: found.id },
          });

          return {
            reply: `Autonomous Agent called \`delete_task\`: Successfully deleted issue **${keyMatch[1]}**.`,
            toolCallsExecuted,
            deletedTaskId: found.id,
          };
        }
      }
    }

    // 4. Handle "create" / "add" task
    if (lower.includes("create") || lower.includes("add") || lower.includes("new issue")) {
      // Pick target project
      let project = null;
      if (lower.includes("ai") || lower.includes("gemini")) {
        project = await prisma.project.findFirst({ where: { workspaceId, key: "AI" } });
      } else if (lower.includes("infra")) {
        project = await prisma.project.findFirst({ where: { workspaceId, key: "INFRA" } });
      }
      if (!project) {
        project = await prisma.project.findFirst({ where: { workspaceId } });
      }

      const defaultUser = await prisma.user.findFirst();
      if (project && defaultUser) {
        const titleMatch = prompt
          .replace(/create|add|task|issue|new|urgent|high priority|in fe project|in ai project|in infra project/gi, "")
          .replace(/^[:\s-]+/, "")
          .trim();
        const finalTitle = titleMatch || "Autonomous Task generated via Agent";
        const priority: TaskPriority = lower.includes("urgent")
          ? "URGENT"
          : lower.includes("high")
          ? "HIGH"
          : lower.includes("low")
          ? "LOW"
          : "MEDIUM";

        // Assignee detection
        let assignee = null;
        if (lower.includes("sarah")) {
          assignee = await prisma.user.findFirst({ where: { email: { contains: "sarah" } } });
        } else if (lower.includes("alex")) {
          assignee = await prisma.user.findFirst({ where: { email: { contains: "lead" } } });
        } else if (lower.includes("marcus")) {
          assignee = await prisma.user.findFirst({ where: { email: { contains: "marcus" } } });
        }

        const nextTask = await prisma.task.findFirst({
          where: { projectId: project.id },
          orderBy: { taskNumber: "desc" },
        });
        const taskNumber = (nextTask?.taskNumber || 0) + 1;

        const task = await prisma.task.create({
          data: {
            taskNumber,
            title: finalTitle,
            description: `Auto-generated by Autonomous Gemini Agent from prompt: "${prompt}"`,
            status: "TODO",
            priority,
            order: 3000,
            workspaceId,
            projectId: project.id,
            creatorId: defaultUser.id,
            assigneeId: assignee?.id || null,
            activityLogs: {
              create: {
                action: "AI_AGENT_ACTION",
                details: JSON.stringify({ agent: "Gemini 2.5 Flash Autonomous Agent", prompt, tool: "create_task" }),
                workspaceId,
                userId: defaultUser.id,
              },
            },
          },
          include: { project: true, assignee: true, creator: true },
        });

        revalidatePath("/");
        toolCallsExecuted.push({
          name: "create_task",
          args: { title: finalTitle, priority, projectKey: project.key, assignee: assignee?.name },
          result: { success: true, taskId: task.id, key: `${project.key}-${task.taskNumber}` },
        });

        return {
          reply: `Autonomous Agent executed tool \`create_task\`:\n- Issue: **${project.key}-${task.taskNumber}**\n- Title: "${finalTitle}"\n- Priority: **${priority}**\n- Project: **${project.name}**${assignee ? `\n- Assignee: **${assignee.name}**` : ""}`,
          toolCallsExecuted,
          affectedTask: task as unknown as TaskItem,
        };
      }
    }

    // Default info summary
    const count = await prisma.task.count({ where: { workspaceId } });
    return {
      reply: `Gemini Autonomous Agent is online! Found **${count} issues** in workspace. You can command me with:\n- "Create urgent task in FE project: Fix header alignment"\n- "Assign FE-2 to Sarah Chen"\n- "Move FE-1 status to DONE"\n- "Delete task FE-3"`,
      toolCallsExecuted: [],
    };
  }

  // Live Gemini 2.5 Function Calling Execution
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        projects: true,
        members: { include: { user: true } },
      },
    });

    const projectContext =
      workspace?.projects.map((p) => `${p.name} (Key: ${p.key}, ID: ${p.id})`).join(", ") || "None";
    const memberContext =
      workspace?.members.map((m) => `${m.user.name} (${m.user.email})`).join(", ") || "None";

    const systemInstruction = `
You are the autonomous AI project manager for Linear/Jira clone "Pulse".
Available Workspace Projects: ${projectContext}.
Available Members: ${memberContext}.
Workspace ID: ${workspaceId}.

When the user asks you to create, update, or assign tasks, ALWAYS call the appropriate tool.
Be concise, professional, and explain what tool was called and the outcome.
`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{
          functionDeclarations: [
            createTaskDeclaration,
            updateTaskDeclaration,
            assignTaskDeclaration,
            deleteTaskDeclaration,
            listTasksDeclaration,
          ],
        }],
      },
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        const { name, args } = call;
        const callArgs = (args || {}) as Record<string, any>;

        if (name === "create_task") {
          let project = null;
          if (callArgs.projectKey) {
            project = await prisma.project.findFirst({
              where: { workspaceId, key: String(callArgs.projectKey).toUpperCase() },
            });
          }
          if (!project) {
            project = await prisma.project.findFirst({ where: { workspaceId } });
          }

          let assignee = null;
          if (callArgs.assigneeEmail) {
            assignee = await findUserByEmailOrName(String(callArgs.assigneeEmail), workspaceId);
          }

          const defaultUser = await prisma.user.findFirst();

          if (project && defaultUser) {
            const nextTask = await prisma.task.findFirst({
              where: { projectId: project.id },
              orderBy: { taskNumber: "desc" },
            });
            const taskNumber = (nextTask?.taskNumber || 0) + 1;

            const created = await prisma.task.create({
              data: {
                taskNumber,
                title: String(callArgs.title),
                description: callArgs.description ? String(callArgs.description) : null,
                status: (callArgs.status as TaskStatus) || "TODO",
                priority: (callArgs.priority as TaskPriority) || "MEDIUM",
                workspaceId,
                projectId: project.id,
                creatorId: defaultUser.id,
                assigneeId: assignee?.id || null,
                activityLogs: {
                  create: {
                    action: "AI_AGENT_ACTION",
                    details: JSON.stringify({ agent: "Gemini 2.5 Flash", tool: "create_task", args: callArgs }),
                    workspaceId,
                  },
                },
              },
              include: { project: true, assignee: true, creator: true },
            });

            affectedTask = created as unknown as TaskItem;
            toolCallsExecuted.push({
              name,
              args: callArgs,
              result: { success: true, taskId: created.id, key: `${project.key}-${taskNumber}` },
            });
          }
        } else if (name === "update_task") {
          const keyOrId = String(callArgs.taskKeyOrId);
          const found = await findTaskByKeyOrId(keyOrId, workspaceId);

          if (found) {
            const updated = await prisma.task.update({
              where: { id: found.id },
              data: {
                ...(callArgs.status && { status: callArgs.status as TaskStatus }),
                ...(callArgs.priority && { priority: callArgs.priority as TaskPriority }),
                ...(callArgs.title && { title: String(callArgs.title).trim() }),
                activityLogs: {
                  create: {
                    action: "AI_AGENT_ACTION",
                    details: JSON.stringify({ agent: "Gemini 2.5 Flash", tool: "update_task", args: callArgs }),
                    workspaceId,
                  },
                },
              },
              include: { project: true, assignee: true, creator: true },
            });

            affectedTask = updated as unknown as TaskItem;
            toolCallsExecuted.push({
              name,
              args: callArgs,
              result: { success: true, updatedId: updated.id, key: `${found.project.key}-${found.taskNumber}` },
            });
          }
        } else if (name === "assign_task") {
          const keyOrId = String(callArgs.taskKeyOrId);
          const found = await findTaskByKeyOrId(keyOrId, workspaceId);
          const user = await findUserByEmailOrName(String(callArgs.assigneeEmailOrName), workspaceId);

          if (found && user) {
            const updated = await prisma.task.update({
              where: { id: found.id },
              data: { assigneeId: user.id },
              include: { project: true, assignee: true, creator: true },
            });

            affectedTask = updated as unknown as TaskItem;
            toolCallsExecuted.push({
              name,
              args: callArgs,
              result: { success: true, taskId: updated.id, assigneeName: user.name },
            });
          }
        } else if (name === "delete_task") {
          const keyOrId = String(callArgs.taskKeyOrId);
          const found = await findTaskByKeyOrId(keyOrId, workspaceId);
          if (found) {
            await prisma.task.delete({ where: { id: found.id } });
            deletedTaskId = found.id;
            toolCallsExecuted.push({
              name,
              args: callArgs,
              result: { success: true, deletedId: found.id },
            });
          }
        }
      }

      revalidatePath("/");
    }

    const replyText =
      response.text ||
      (toolCallsExecuted.length > 0
        ? `Autonomous Agent executed: ${toolCallsExecuted.map((t) => t.name).join(", ")}.`
        : "I processed your request.");

    return {
      reply: replyText,
      toolCallsExecuted,
      affectedTask,
      deletedTaskId,
    };
  } catch (err) {
    console.error("Gemini Agent execution error:", err);
    return {
      reply: `Agent encountered an error: ${(err as Error).message}`,
      toolCallsExecuted,
    };
  }
}
