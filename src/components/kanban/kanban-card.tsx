"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { TaskItem, TaskPriority } from "@/types";
import { useUIStore } from "@/stores/use-ui-store";
import {
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
  CircleDot,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface KanbanCardProps {
  task: TaskItem;
  index: number;
}

export function KanbanCard({ task, index }: KanbanCardProps) {
  const { openTaskDetails } = useUIStore();

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

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => openTaskDetails(task.id)}
          className={`group relative p-3.5 mb-2.5 rounded-lg border bg-card/60 backdrop-blur-sm transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-lg hover:shadow-black/20 ${
            snapshot.isDragging
              ? "border-primary bg-accent/80 shadow-2xl scale-[1.02] ring-2 ring-primary/30 z-50 rotate-1"
              : "border-border/60"
          }`}
        >
          {/* Top metadata: Key & Priority */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.project.color || "#6366f1" }}
              />
              <span className="text-[11px] font-mono font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {task.project.key}-{task.taskNumber}
              </span>
            </div>
            <div className="flex items-center gap-1" title={`Priority: ${task.priority}`}>
              {getPriorityIcon(task.priority)}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-3">
            {task.title}
          </h4>

          {/* Bottom metadata: Due date & Assignee */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
            {task.dueDate ? (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
            ) : (
              <span />
            )}

            {task.assignee ? (
              <Avatar className="w-5 h-5 ring-1 ring-border">
                {task.assignee.avatarUrl && <AvatarImage src={task.assignee.avatarUrl} />}
                <AvatarFallback className="text-[9px] bg-primary/20 text-primary uppercase">
                  {task.assignee.name?.[0] || task.assignee.email[0]}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-5 h-5 rounded-full border border-dashed border-border/80 flex items-center justify-center text-[9px] text-muted-foreground/60">
                +
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
