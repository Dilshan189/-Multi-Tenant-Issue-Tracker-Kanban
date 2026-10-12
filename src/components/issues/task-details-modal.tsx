"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Check,
  Edit2,
} from "lucide-react";

interface TaskDetailsModalProps {
  tasks?: TaskItem[];
  members: UserSummary[];
}

export function TaskDetailsModal({ members }: TaskDetailsModalProps) {
  const router = useRouter();
  const {
    tasks: storeTasks,
    selectedTaskId,
    closeTaskDetails,
    updateTaskInStore,
    removeTaskFromStore,
  } = useUIStore();
  const [isPending, startTransition] = useTransition();

  const task = storeTasks.find((t) => t.id === selectedTaskId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState("");

  useEffect(() => {
    if (task) {
      setTitleText(task.title);
      setDescText(task.description || "");
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    }
  }, [task?.id, task?.title, task?.description]);

  if (!task) return null;

  const handleStatusChange = (newStatus: TaskStatus) => {
    // 1. Optimistic instant local update
    updateTaskInStore(task.id, { status: newStatus });
    // 2. Server transition
    startTransition(async () => {
      await updateTaskStatusAndOrderAction(task.id, newStatus, task.order);
      router.refresh();
    });
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    updateTaskInStore(task.id, { priority: newPriority });
    startTransition(async () => {
      await updateTaskDetailsAction(task.id, { priority: newPriority });
      router.refresh();
    });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const selectedUser = members.find((m) => m.id === assigneeId) || null;
    updateTaskInStore(task.id, {
      assigneeId: assigneeId === "" ? null : assigneeId,
      assignee: selectedUser,
    });

    startTransition(async () => {
      await updateTaskDetailsAction(task.id, {
        assigneeId: assigneeId === "" ? null : assigneeId,
      });
      router.refresh();
    });
  };

  const handleSaveTitle = () => {
    if (!titleText.trim() || titleText === task.title) {
      setIsEditingTitle(false);
      return;
    }
    updateTaskInStore(task.id, { title: titleText.trim() });
    setIsEditingTitle(false);

    startTransition(async () => {
      await updateTaskDetailsAction(task.id, { title: titleText.trim() });
      router.refresh();
    });
  };

  const handleSaveDesc = () => {
    updateTaskInStore(task.id, { description: descText.trim() || null });
    setIsEditingDesc(false);

    startTransition(async () => {
      await updateTaskDetailsAction(task.id, { description: descText.trim() || null });
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete ${task.project.key}-${task.taskNumber}?`)) return;
    const deletedId = task.id;
    removeTaskFromStore(deletedId);
    closeTaskDetails();

    startTransition(async () => {
      await deleteTaskAction(deletedId);
      router.refresh();
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

          {/* Editable Title */}
          <div className="mt-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  autoFocus
                  className="flex-1 bg-muted/60 border border-border/70 rounded px-2.5 py-1 text-base font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                <Button size="sm" onClick={handleSaveTitle} className="h-8 px-2.5">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <DialogTitle
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-semibold text-foreground hover:bg-muted/40 p-1 -ml-1 rounded cursor-pointer flex items-center justify-between group"
              >
                <span>{task.title}</span>
                <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 text-muted-foreground ml-2" />
              </DialogTitle>
            )}
          </div>
        </DialogHeader>

        {/* Properties Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3 border-b border-border/40 text-xs">
          {/* Status */}
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Status</span>
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
            <span className="text-muted-foreground font-medium">Priority</span>
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
            <span className="text-muted-foreground font-medium">Assignee</span>
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
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </h4>
            {!isEditingDesc && (
              <button
                onClick={() => setIsEditingDesc(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {isEditingDesc ? (
            <div className="space-y-2">
              <textarea
                value={descText}
                onChange={(e) => setDescText(e.target.value)}
                rows={4}
                className="w-full bg-background border border-border/70 rounded p-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Add description..."
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingDesc(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveDesc} className="h-7 text-xs">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingDesc(true)}
              className="text-sm text-foreground/90 bg-muted/20 hover:bg-muted/30 transition-colors p-3.5 rounded-lg border border-border/30 whitespace-pre-wrap leading-relaxed min-h-[80px] cursor-pointer"
            >
              {task.description || (
                <span className="text-muted-foreground italic text-xs">Click to add description...</span>
              )}
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/40">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>Created by {task.creator?.name || "System"}</span>
          </div>
          <div className="flex items-center gap-1" suppressHydrationWarning>
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
