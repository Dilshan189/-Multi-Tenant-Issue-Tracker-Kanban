"use client";

import React, { useState, useEffect, useTransition } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { TaskItem, TaskStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { useUIStore } from "@/stores/use-ui-store";
import { updateTaskStatusAndOrderAction } from "@/server/actions/tasks";

interface KanbanBoardProps {
  initialTasks: TaskItem[];
  workspaceSlug: string;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "BACKLOG", title: "Backlog" },
  { id: "TODO", title: "Todo" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
];

export function KanbanBoard({ initialTasks, workspaceSlug }: KanbanBoardProps) {
  const { tasks, setTasks, filters } = useUIStore();
  const [, startTransition] = useTransition();

  // Sync state whenever initialTasks from server updates
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTasks(initialTasks);
    }
  }, [initialTasks, setTasks]);

  // Apply Client-side Filters
  const filteredTasks = tasks.filter((task) => {
    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchKey = `${task.project.key}-${task.taskNumber}`.toLowerCase().includes(q);
      if (!matchTitle && !matchKey) return false;
    }
    // Project filter
    if (filters.projectId && task.projectId !== filters.projectId) {
      return false;
    }
    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    // Assignee filter
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) {
      return false;
    }
    return true;
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    // Make an optimistic copy of the state
    const previousTasks = [...tasks];

    // Find the moving task
    const movingTask = tasks.find((t) => t.id === draggableId);
    if (!movingTask) return;

    // Get current tasks in destination column
    const destColumnTasks = tasks
      .filter((t) => t.status === destStatus && t.id !== draggableId)
      .sort((a, b) => a.order - b.order);

    // Calculate new order
    let newOrder = 1000;
    if (destColumnTasks.length === 0) {
      newOrder = 1000;
    } else if (destination.index === 0) {
      newOrder = (destColumnTasks[0]?.order ?? 1000) / 2;
    } else if (destination.index >= destColumnTasks.length) {
      newOrder = (destColumnTasks[destColumnTasks.length - 1]?.order ?? 1000) + 1000;
    } else {
      const prevOrder = destColumnTasks[destination.index - 1]?.order ?? 0;
      const nextOrder = destColumnTasks[destination.index]?.order ?? 1000;
      newOrder = (prevOrder + nextOrder) / 2;
    }

    // 1. Optimistic Client State Update (0ms instant response)
    const updatedTasks = tasks.map((t) => {
      if (t.id === draggableId) {
        return {
          ...t,
          status: destStatus,
          order: newOrder,
        };
      }
      return t;
    });

    setTasks(updatedTasks);

    // 2. Asynchronous Server Action Execution
    startTransition(async () => {
      const res = await updateTaskStatusAndOrderAction(
        draggableId,
        destStatus,
        newOrder,
        workspaceSlug
      );

      if (!res.success) {
        console.error("Failed to sync drag status to server:", res.error);
        // Rollback state if server update failed
        setTasks(previousTasks);
      }
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 h-full select-none">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.order - b.order);

          return (
            <KanbanColumn
              key={col.id}
              status={col.id}
              title={col.title}
              tasks={colTasks}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
