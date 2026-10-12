"use client";

import React from "react";
import { TaskItem, WorkspaceSummary, UserSummary } from "@/types";
import { useUIStore } from "@/stores/use-ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskListView } from "@/components/issues/task-list-view";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";
import { TaskDetailsModal } from "@/components/issues/task-details-modal";
import { GeminiAssistantDialog } from "@/components/ai/gemini-assistant-dialog";

interface DashboardViewProps {
  workspace: WorkspaceSummary;
  initialTasks: TaskItem[];
  members: UserSummary[];
}

export function DashboardView({
  workspace,
  initialTasks,
  members,
}: DashboardViewProps) {
  const { viewMode } = useUIStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased">
      {/* 1. Sidebar (Workspace & Project Hierarchy) */}
      <Sidebar workspace={workspace} />

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Top Header & Search/Filters */}
        <TopHeader
          projects={workspace.projects}
          workspaceName={workspace.name}
        />

        {/* Content Canvas */}
        <main className="flex-1 p-6 overflow-hidden">
          {viewMode === "kanban" ? (
            <KanbanBoard
              initialTasks={initialTasks}
              workspaceSlug={workspace.slug}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <TaskListView tasks={initialTasks} />
            </div>
          )}
        </main>
      </div>

      {/* 3. Interactive Modals & Autonomous Agent */}
      <CreateIssueModal
        projects={workspace.projects}
        members={members}
        workspaceId={workspace.id}
      />
      <TaskDetailsModal tasks={initialTasks} members={members} />
      <GeminiAssistantDialog workspaceId={workspace.id} />
    </div>
  );
}
