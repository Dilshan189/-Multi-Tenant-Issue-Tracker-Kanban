"use client";

import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { TaskItem, TaskStatus } from "@/types";
import { KanbanCard } from "./kanban-card";
import { useUIStore } from "@/stores/use-ui-store";
import {
  CircleDashed,
  Circle,
  Clock,
  Eye,
  CheckCircle2,
  Plus,
} from "lucide-react";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: TaskItem[];
}

export function KanbanColumn({ status, title, tasks }: KanbanColumnProps) {
  const { openCreateTask } = useUIStore();

  const getStatusIcon = (st: TaskStatus) => {
    switch (st) {
      case "BACKLOG":
        return <CircleDashed className="w-4 h-4 text-muted-foreground" />;
      case "TODO":
        return <Circle className="w-4 h-4 text-zinc-400" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case "IN_REVIEW":
        return <Eye className="w-4 h-4 text-indigo-400" />;
      case "DONE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col w-72 md:w-80 shrink-0 bg-muted/20 border border-border/40 rounded-xl overflow-hidden backdrop-blur-sm max-h-[calc(100vh-140px)]">
      {/* Column Header */}
      <div className="p-3 border-b border-border/40 flex items-center justify-between bg-card/40">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => openCreateTask(status)}
          className="w-6 h-6 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Droppable Card Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2.5 overflow-y-auto min-h-[300px] transition-colors ${
              snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/20" : ""
            }`}
          >
            {tasks.map((task, idx) => (
              <KanbanCard key={task.id} task={task} index={idx} />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-28 flex flex-col items-center justify-center border border-dashed border-border/40 rounded-lg text-xs text-muted-foreground/60">
                <span>No issues</span>
                <button
                  onClick={() => openCreateTask(status)}
                  className="mt-1 text-primary hover:underline text-[11px]"
                >
                  + Create issue
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
