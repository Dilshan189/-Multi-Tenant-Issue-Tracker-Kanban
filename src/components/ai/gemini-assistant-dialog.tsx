"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/use-ui-store";
import { runGeminiAgentAction, AgentExecutionResult } from "@/server/ai/agent";
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Wrench,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface GeminiAssistantDialogProps {
  workspaceId: string;
}

export function GeminiAssistantDialog({ workspaceId }: GeminiAssistantDialogProps) {
  const { isAIAssistantOpen, setAIAssistantOpen, addTask, updateTaskInStore, removeTaskFromStore, tasks } = useUIStore();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; text: string; tools?: AgentExecutionResult["toolCallsExecuted"] }[]
  >([
    {
      role: "assistant",
      text: "Hello! I am your autonomous Gemini Project Manager. You can instruct me in natural language to create issues, reassign team members, update statuses, or optimize sprint workflows.",
    },
  ]);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAIAssistantOpen(!isAIAssistantOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAIAssistantOpen, setAIAssistantOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isPending) return;

    const userMsg = prompt.trim();
    setPrompt("");
    setHistory((prev) => [...prev, { role: "user", text: userMsg }]);

    startTransition(async () => {
      const result = await runGeminiAgentAction(userMsg, workspaceId);
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.reply,
          tools: result.toolCallsExecuted,
        },
      ]);

      // Optimistic Reactive Board Update
      if (result.affectedTask) {
        const exists = tasks.some((t) => t.id === result.affectedTask!.id);
        if (exists) {
          updateTaskInStore(result.affectedTask.id, result.affectedTask);
        } else {
          addTask(result.affectedTask);
        }
      }

      if (result.deletedTaskId) {
        removeTaskFromStore(result.deletedTaskId);
      }

      router.refresh();
    });
  };

  const handleQuickPrompt = (quickText: string) => {
    setPrompt(quickText);
  };

  return (
    <Dialog open={isAIAssistantOpen} onOpenChange={setAIAssistantOpen}>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-border/80 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 bg-muted/30 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span>Gemini Autonomous Agent</span>
                  <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Tool Calling Enabled
                  </span>
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Natural language task creation, updates, and sprint orchestration
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/40">
              ⌘K
            </span>
          </div>
        </DialogHeader>

        {/* Message Conversation Stream */}
        <div className="p-4 max-h-[380px] min-h-[220px] overflow-y-auto space-y-3.5">
          {history.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 text-sm ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted/40 border border-border/40 text-foreground"
                }`}
              >
                {/* Tool calls execution badge */}
                {msg.tools && msg.tools.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {msg.tools.map((tc, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono bg-purple-950/40 border border-purple-800/40 text-purple-300 rounded p-1.5 flex items-center gap-1.5"
                      >
                        <Wrench className="w-3 h-3 text-purple-400" />
                        <span>Called: <strong>{tc.name}</strong></span>
                        <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-xs md:text-sm">{msg.text}</div>
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex gap-3 items-center text-xs text-muted-foreground animate-pulse">
              <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Gemini is evaluating tools and executing actions...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-border/30 bg-muted/10 flex items-center gap-1.5 overflow-x-auto text-[11px] text-muted-foreground scrollbar-none">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-purple-400" />
          <span className="shrink-0 font-medium">Quick commands:</span>
          <button
            type="button"
            onClick={() =>
              handleQuickPrompt("Create urgent task in FE project: Optimize bundle split & hydration")
            }
            className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/40 hover:text-foreground shrink-0 transition-colors text-[11px]"
          >
            + Create urgent FE issue
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("Assign FE-1 to Sarah Chen")}
            className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 transition-colors text-[11px]"
          >
            ⚡ Assign FE-1 to Sarah
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("Move FE-2 status to DONE")}
            className="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 transition-colors text-[11px]"
          >
            ✓ Move FE-2 to DONE
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("Create task in AI project: Implement memory caching")}
            className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/40 hover:text-foreground shrink-0 transition-colors text-[11px]"
          >
            + Create AI task
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-muted/20 border-t border-border/40 flex items-center gap-2">
          <input
            type="text"
            placeholder="Instruct the autonomous agent (e.g. 'Create task in FE project...')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isPending}
            autoFocus
            className="flex-1 bg-background/80 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-purple-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!prompt.trim() || isPending}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
