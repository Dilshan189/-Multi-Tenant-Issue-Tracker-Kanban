"use client";

import React from "react";
import { useUIStore } from "@/stores/use-ui-store";
import { ProjectSummary, TaskPriority } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Kanban,
  ListTodo,
  Sparkles,
  Plus,
  X,
  History,
} from "lucide-react";

interface TopHeaderProps {
  projects: ProjectSummary[];
  workspaceName: string;
}

export function TopHeader({ projects, workspaceName }: TopHeaderProps) {
  const {
    filters,
    setSearchQuery,
    setPriorityFilter,
    resetFilters,
    viewMode,
    setViewMode,
    openCreateTask,
    toggleAIAssistant,
  } = useUIStore();

  const activeProject = projects.find((p) => p.id === filters.projectId);
  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.projectId !== null ||
    filters.priority !== null ||
    filters.assigneeId !== null;

  return (
    <header className="h-14 border-b border-border/40 bg-card/30 backdrop-blur-md px-6 flex items-center justify-between gap-4 select-none shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <span className="font-medium text-foreground">{workspaceName}</span>
        <span>/</span>
        <span className="truncate">
          {activeProject ? activeProject.name : "All Projects"}
        </span>
        <span>/</span>
        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
          {viewMode === "kanban" ? "Board" : "Issues"}
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues or keys..."
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/40 border-border/50 focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <select
          value={filters.priority || ""}
          onChange={(e) =>
            setPriorityFilter(
              e.target.value === "" ? null : (e.target.value as TaskPriority)
            )
          }
          className="h-8 text-xs bg-muted/40 border border-border/50 rounded-lg px-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent 🔴</option>
          <option value="HIGH">High 🟠</option>
          <option value="MEDIUM">Medium 🟡</option>
          <option value="LOW">Low 🔵</option>
        </select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Clear
          </Button>
        )}

        {/* View Switcher: Board vs List */}
        <div className="flex items-center bg-muted/40 border border-border/40 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-1 rounded-md text-xs transition-colors ${
              viewMode === "kanban"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Kanban Board View"
          >
            <Kanban className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded-md text-xs transition-colors ${
              viewMode === "list"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List View"
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("activity")}
            className={`p-1 rounded-md text-xs transition-colors ${
              viewMode === "activity"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Activity Audit Trail"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Gemini Action */}
        <Button
          onClick={toggleAIAssistant}
          size="sm"
          className="h-8 text-xs bg-purple-600/90 hover:bg-purple-600 text-white font-medium flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI Agent</span>
        </Button>
      </div>
    </header>
  );
}
