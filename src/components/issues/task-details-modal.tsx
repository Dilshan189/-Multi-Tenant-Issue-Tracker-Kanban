"use client";

import React, { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/use-ui-store";
import { TaskItem, TaskPriority, TaskStatus, UserSummary } from "@/types";
import {
  updateTaskDetailsAction,
  updateTaskStatusAndOrderAction,
  deleteTaskAction,
} from "@/server/actions/tasks";
import {
  Trash2,
  Calendar,
  User,
  History,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
  CircleDot,
} from "lucide-react";

interface TaskDetailsModalProps {
  tasks: TaskItem[];
  members: UserSummary[];
}

export function TaskDetailsModal({ tasks, members }: TaskDetailsModalProps) {
  const { selectedTaskId, closeTaskDetails } = useUIStore();
  const [isPending, startTransition] = useTransition();

  const task = tasks.find((t) => t.id === selectedTaskId);

  if (!task) return null;

  const handleStatusChange = (newStatus: TaskStatus) => {
    startTransition(async () => {
      await updateTaskStatusAndOrderAction(task.id, newStatus, task.order);
    });
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    startTransition(async () => {
      await updateTaskDetailsAction(task.id, { priority: newPriority });
    });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    startTransition(async () => {
      await updateTaskDetailsAction(task.id, {
        assigneeId: assigneeId === "" ? null : assigneeId,
      });
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    startTransition(async () => {
      await deleteTaskAction(task.id);
      closeTaskDetails();
    });
  };

  return (
    <Dialog open={!!selectedTaskId} onOpenChange={(open) => !open && closeTaskDetails()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border/80 p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: task.project.color || "#6366f1" }}
              />
              <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">
                {task.project.name} • {task.project.key}-{task.taskNumber}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete
            </Button>
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground mt-2">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        {/* Properties Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3 border-b border-border/40 text-xs">
          {/* Status */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Status</span>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="w-full bg-muted/60 border border-border/60 rounded px-2 py-1 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Priority</span>
            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
              className="w-full bg-muted/60 border border-border/60 rounded px-2 py-1 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="URGENT">Urgent 🔴</option>
              <option value="HIGH">High 🟠</option>
              <option value="MEDIUM">Medium 🟡</option>
              <option value="LOW">Low 🔵</option>
              <option value="NONE">None</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Assignee</span>
            <select
              value={task.assigneeId || ""}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="w-full bg-muted/60 border border-border/60 rounded px-2 py-1 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="py-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Description
          </h4>
          <div className="text-sm text-foreground/90 bg-muted/20 p-3.5 rounded-lg border border-border/30 whitespace-pre-wrap leading-relaxed min-h-[80px]">
            {task.description || (
              <span className="text-muted-foreground italic">No description provided.</span>
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/40">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>Created by {task.creator?.name || "System"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(task.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
