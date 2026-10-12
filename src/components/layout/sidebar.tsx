"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ProjectSummary, WorkspaceSummary } from "@/types";
import { useUIStore } from "@/stores/use-ui-store";
import { Button } from "@/components/ui/button";
import {
  Kanban,
  ListTodo,
  Sparkles,
  Plus,
  FolderKanban,
  CheckCircle2,
  ChevronDown,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  workspace: WorkspaceSummary;
}

export function Sidebar({ workspace }: SidebarProps) {
  const {
    openCreateTask,
    viewMode,
    setViewMode,
    filters,
    setProjectFilter,
    toggleAIAssistant,
  } = useUIStore();

  // Keyboard shortcut: Press 'C' to open Create Task modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "c" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        openCreateTask();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openCreateTask]);

  return (
    <aside className="w-64 shrink-0 h-screen border-r border-border/50 bg-card/40 backdrop-blur-md flex flex-col justify-between select-none">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Workspace Switcher Header */}
        <div className="p-3.5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {workspace.name[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1">
                {workspace.name}
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                workspace/{workspace.slug}
              </span>
            </div>
          </div>
        </div>

        {/* Action: New Issue Button */}
        <div className="p-3">
          <Button
            onClick={() => openCreateTask()}
            className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-medium text-xs h-8 flex items-center justify-between shadow-sm"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Issue
            </span>
            <span className="text-[10px] font-mono opacity-60 bg-black/20 px-1.5 py-0.5 rounded">
              C
            </span>
          </Button>
        </div>

        {/* Nav Links */}
        <div className="px-2 space-y-0.5">
          <button
            onClick={() => setViewMode("kanban")}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "kanban"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Kanban className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setViewMode("list")}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-amber-400" />
            <span>List View</span>
          </button>

          {/* AI Autonomous Agent Trigger */}
          <button
            onClick={toggleAIAssistant}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 transition-all mt-2 group"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>Gemini AI Agent</span>
            </span>
            <span className="text-[10px] font-mono text-purple-400/80 bg-purple-950/50 px-1 rounded">
              ⌘K
            </span>
          </button>
        </div>

        {/* Projects Hierarchy (Multi-Tenancy Layer) */}
        <div className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Projects</span>
            <span className="text-[10px] font-mono">{workspace.projects.length}</span>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => setProjectFilter(null)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filters.projectId === null
                  ? "bg-accent/60 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>All Projects</span>
            </button>

            {workspace.projects.map((project) => (
              <button
                key={project.id}
                onClick={() =>
                  setProjectFilter(filters.projectId === project.id ? null : project.id)
                }
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filters.projectId === project.id
                    ? "bg-accent/80 text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color || "#6366f1" }}
                  />
                  <span className="truncate">{project.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {project.key}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile & Role Info (RBAC) */}
        <div className="p-3 border-t border-border/40 bg-card/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7 ring-1 ring-border">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                  AV
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Alex Vance</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  WORKSPACE OWNER
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
