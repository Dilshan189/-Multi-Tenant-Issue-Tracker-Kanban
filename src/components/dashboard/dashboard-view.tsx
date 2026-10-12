"use client";

import React, { useEffect } from "react";
import {
  TaskItem,
  WorkspaceSummary,
  UserSummary,
  WorkspaceListItem,
  WorkspaceMemberItem,
  ActivityLogItem,
} from "@/types";
import { useUIStore } from "@/stores/use-ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskListView } from "@/components/issues/task-list-view";
import { ActivityLogView } from "@/components/activity/activity-log-view";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";
import { TaskDetailsModal } from "@/components/issues/task-details-modal";
import { MembersModal } from "@/components/team/members-modal";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { GeminiAssistantDialog } from "@/components/ai/gemini-assistant-dialog";

interface DashboardViewProps {
  workspace: WorkspaceSummary;
  initialTasks: TaskItem[];
  members: UserSummary[];
  allWorkspaces?: WorkspaceListItem[];
  workspaceMembers?: WorkspaceMemberItem[];
  activityLogs?: ActivityLogItem[];
}

export function DashboardView({
  workspace,
  initialTasks,
  members,
  allWorkspaces = [],
  workspaceMembers = [],
  activityLogs = [],
}: DashboardViewProps) {
  const { viewMode, setTasks } = useUIStore();

  // Populate store tasks on initial mount
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTasks(initialTasks);
    }
  }, [initialTasks, setTasks]);

  const currentRole = workspaceMembers[0]?.role || "OWNER";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased selection:bg-indigo-500/20 selection:text-indigo-200">
      {/* 1. Sidebar (Workspace & Project Hierarchy + RBAC) */}
      <Sidebar
        workspace={workspace}
        allWorkspaces={allWorkspaces}
        currentMemberRole={currentRole}
      />

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
          ) : viewMode === "list" ? (
            <div className="h-full overflow-y-auto">
              <TaskListView tasks={initialTasks} />
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <ActivityLogView logs={activityLogs} />
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
      <TaskDetailsModal members={members} />
      <MembersModal
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        initialMembers={workspaceMembers}
      />
      <CreateProjectModal workspaceId={workspace.id} />
      <GeminiAssistantDialog workspaceId={workspace.id} />
    </div>
  );
}
