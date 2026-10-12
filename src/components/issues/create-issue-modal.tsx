"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/stores/use-ui-store";
import { createTaskAction } from "@/server/actions/tasks";
import { ProjectSummary, TaskPriority, TaskStatus, UserSummary } from "@/types";
import { Sparkles, Loader2 } from "lucide-react";

interface CreateIssueModalProps {
  projects: ProjectSummary[];
  members: UserSummary[];
  workspaceId: string;
}

export function CreateIssueModal({
  projects,
  members,
  workspaceId,
}: CreateIssueModalProps) {
  const {
    isCreateTaskOpen,
    closeCreateTask,
    createTaskDefaultStatus,
    createTaskDefaultProjectId,
  } = useUIStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>(
    createTaskDefaultProjectId || projects[0]?.id || ""
  );
  const [status, setStatus] = useState<TaskStatus>(createTaskDefaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Reset form when modal opens with new defaults
  React.useEffect(() => {
    if (isCreateTaskOpen) {
      setStatus(createTaskDefaultStatus);
      if (createTaskDefaultProjectId) {
        setProjectId(createTaskDefaultProjectId);
      } else if (!projectId && projects.length > 0) {
        setProjectId(projects[0].id);
      }
    }
  }, [isCreateTaskOpen, createTaskDefaultStatus, createTaskDefaultProjectId, projects, projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    startTransition(async () => {
      const res = await createTaskAction({
        title,
        description,
        projectId,
        workspaceId,
        status,
        priority,
        assigneeId: assigneeId || null,
      });

      if (res.success) {
        setTitle("");
        setDescription("");
        closeCreateTask();
      } else {
        alert("Failed to create task: " + res.error);
      }
    });
  };

  return (
    <Dialog open={isCreateTaskOpen} onOpenChange={(open) => !open && closeCreateTask()}>
      <DialogContent className="sm:max-w-xl bg-card border-border/70 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            <span>New Issue</span>
            <span className="text-xs font-mono text-muted-foreground font-normal">
              Press Esc to dismiss
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Project & Issue Key Bar */}
          <div className="flex items-center gap-3">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="text-xs bg-muted/60 border border-border/60 rounded-md px-2.5 py-1.5 text-foreground font-medium focus:ring-1 focus:ring-primary outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="text-xs bg-muted/60 border border-border/60 rounded-md px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="text-xs bg-muted/60 border border-border/60 rounded-md px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="URGENT">Urgent 🔴</option>
              <option value="HIGH">High 🟠</option>
              <option value="MEDIUM">Medium 🟡</option>
              <option value="LOW">Low 🔵</option>
              <option value="NONE">None</option>
            </select>
          </div>

          {/* Issue Title Input */}
          <div>
            <Input
              placeholder="Issue title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="text-base font-medium bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Issue Description */}
          <div>
            <Textarea
              placeholder="Add description, acceptance criteria, or markdown notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none text-sm bg-background/80 border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Assignee Selection */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <span className="text-xs text-muted-foreground">Assignee:</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="text-xs bg-muted/50 border border-border/50 rounded-md px-2 py-1 text-foreground outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Autonomous Gemini Agent available via CMD+K</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeCreateTask}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!title.trim() || isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Create Issue
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
