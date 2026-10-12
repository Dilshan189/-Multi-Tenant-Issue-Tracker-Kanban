"use client";

import React, { useState } from "react";
import { ActivityLogItem } from "@/types";
import {
  History,
  Bot,
  PlusCircle,
  ArrowRightLeft,
  ShieldCheck,
  FolderPlus,
  Clock,
  Code,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActivityLogViewProps {
  logs: ActivityLogItem[];
}

export function ActivityLogView({ logs }: ActivityLogViewProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "AI_AGENT_ACTION":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-medium font-mono">
            <Bot className="w-3 h-3 text-purple-400" />
            Gemini Autonomous Agent
          </span>
        );
      case "STATUS_CHANGED":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">
            <ArrowRightLeft className="w-3 h-3 text-blue-400" />
            Status Transition
          </span>
        );
      case "TASK_CREATED":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
            <PlusCircle className="w-3 h-3 text-emerald-400" />
            Issue Created
          </span>
        );
      case "MEMBER_ROLE_UPDATED":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            RBAC Permission Change
          </span>
        );
      case "PROJECT_CREATED":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-medium">
            <FolderPlus className="w-3 h-3 text-indigo-400" />
            Project Created
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-mono">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Real-time Activity Audit Trail Stream
            </h2>
            <p className="text-xs text-muted-foreground">
              Immutable relational activity stream proving human & AI agent operations
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/40">
          {logs.length} logged mutations
        </span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          let parsedDetails: Record<string, unknown> | null = null;
          try {
            if (log.details) parsedDetails = JSON.parse(log.details);
          } catch {
            // raw string
          }

          const isExpanded = expandedLogId === log.id;

          return (
            <div
              key={log.id}
              className="p-3.5 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm hover:border-border transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {log.user ? (
                    <Avatar className="w-7 h-7 ring-1 ring-border mt-0.5 shrink-0">
                      {log.user.avatarUrl && <AvatarImage src={log.user.avatarUrl} />}
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary uppercase">
                        {log.user.name?.[0] || log.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 mt-0.5 shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">
                        {log.user ? log.user.name || log.user.email : "Autonomous Gemini System"}
                      </span>
                      {getActionBadge(log.action)}
                    </div>

                    {/* Task association */}
                    {log.task && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 text-[10px] text-foreground font-semibold">
                          {log.task.project?.key ? `${log.task.project.key}-${log.task.taskNumber}` : log.task.id}
                        </span>
                        <span className="truncate max-w-sm text-foreground/80 font-sans">
                          {log.task.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-muted-foreground text-[11px]" suppressHydrationWarning>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Collapsible Details Payload */}
              {log.details && (
                <div className="mt-2.5 pt-2 border-t border-border/30">
                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Code className="w-3 h-3" />
                    <span>{isExpanded ? "Hide Transaction Payload" : "View Audit Payload"}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <pre className="mt-2 p-2.5 rounded-lg bg-black/40 border border-border/50 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                      {parsedDetails ? JSON.stringify(parsedDetails, null, 2) : log.details}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No audit logs captured yet. Create an issue or command the Gemini Agent to generate logs!
          </div>
        )}
      </div>
    </div>
  );
}
