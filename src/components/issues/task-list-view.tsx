"use client";

import React from "react";
import { TaskItem, TaskPriority, TaskStatus } from "@/types";
import { useUIStore } from "@/stores/use-ui-store";
import {
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
  CircleDot,
  CheckCircle2,
  Clock,
  Eye,
  Circle,
  CircleDashed,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskListViewProps {
  tasks: TaskItem[];
}

export function TaskListView({ tasks }: TaskListViewProps) {
  const { openTaskDetails, filters } = useUIStore();

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case "HIGH":
        return <ArrowUp className="w-3.5 h-3.5 text-amber-500" />;
      case "MEDIUM":
        return <Minus className="w-3.5 h-3.5 text-yellow-500" />;
      case "LOW":
        return <ArrowDown className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <CircleDot className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "BACKLOG":
        return (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CircleDashed className="w-3.5 h-3.5" /> Backlog
          </span>
        );
      case "TODO":
        return (
          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Circle className="w-3.5 h-3.5" /> Todo
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
            <Eye className="w-3.5 h-3.5" /> In Review
          </span>
        );
      case "DONE":
        return (
          <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Filter tasks
  const filtered = tasks.filter((t) => {
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        `${t.project.key}-${t.taskNumber}`.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.projectId && t.projectId !== filters.projectId) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
    return true;
  });

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden select-none">
      <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 bg-muted/20">
        <div className="col-span-2 sm:col-span-1">Priority</div>
        <div className="col-span-3 sm:col-span-2">Key</div>
        <div className="col-span-7 sm:col-span-5">Title</div>
        <div className="hidden sm:block sm:col-span-2">Status</div>
        <div className="hidden sm:block sm:col-span-2 text-right">Assignee</div>
      </div>

      <div className="divide-y divide-border/30">
        {filtered.map((task) => (
          <div
            key={task.id}
            onClick={() => openTaskDetails(task.id)}
            className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-accent/40 cursor-pointer transition-colors group"
          >
            {/* Priority */}
            <div className="col-span-2 sm:col-span-1 flex items-center">
              {getPriorityIcon(task.priority)}
            </div>

            {/* Key */}
            <div className="col-span-3 sm:col-span-2 flex items-center gap-1.5 font-mono text-muted-foreground group-hover:text-foreground">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: task.project.color || "#6366f1" }}
              />
              <span className="font-medium">
                {task.project.key}-{task.taskNumber}
              </span>
            </div>

            {/* Title */}
            <div className="col-span-7 sm:col-span-5 font-medium text-foreground truncate pr-2">
              {task.title}
            </div>

            {/* Status */}
            <div className="hidden sm:block sm:col-span-2">
              {getStatusBadge(task.status)}
            </div>

            {/* Assignee */}
            <div className="hidden sm:flex sm:col-span-2 justify-end items-center">
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5 ring-1 ring-border">
                    {task.assignee.avatarUrl && (
                      <AvatarImage src={task.assignee.avatarUrl} />
                    )}
                    <AvatarFallback className="text-[9px] bg-primary/20 text-primary uppercase">
                      {task.assignee.name?.[0] || task.assignee.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">
                    {task.assignee.name || task.assignee.email.split("@")[0]}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground/60 italic">Unassigned</span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No issues match current filters.
          </div>
        )}
      </div>
    </div>
  );
}
