"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/stores/use-ui-store";
import { createProjectAction } from "@/server/actions/workspaces";
import { FolderPlus, Loader2 } from "lucide-react";

interface CreateProjectModalProps {
  workspaceId: string;
}

const COLOR_PRESETS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

export function CreateProjectModal({ workspaceId }: CreateProjectModalProps) {
  const router = useRouter();
  const { isCreateProjectOpen, setCreateProjectOpen } = useUIStore();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      // Auto suggest key from name
      const suggested = val
        .replace(/[^A-Za-z0-9]/g, "")
        .slice(0, 3)
        .toUpperCase();
      if (suggested) setKey(suggested);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    startTransition(async () => {
      const res = await createProjectAction({
        name: name.trim(),
        key: key.toUpperCase().trim(),
        color,
        description: description.trim() || undefined,
        workspaceId,
      });

      if (res.success) {
        setName("");
        setKey("");
        setDescription("");
        setCreateProjectOpen(false);
        router.refresh();
      } else {
        alert("Failed to create project: " + res.error);
      }
    });
  };

  return (
    <Dialog open={isCreateProjectOpen} onOpenChange={setCreateProjectOpen}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Create New Project
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Projects group issues, keys, and sprint boards
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Project Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Project Name
            </label>
            <Input
              placeholder="e.g. Mobile App, Infra Core"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
              className="bg-background text-sm"
            />
          </div>

          {/* Project Key & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Project Key (Prefix)
              </label>
              <Input
                placeholder="e.g. MOB, CORE"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                maxLength={6}
                required
                className="bg-background font-mono text-sm uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Color Tag
              </label>
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      color === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Description (Optional)
            </label>
            <Textarea
              placeholder="What is this project responsible for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background text-sm resize-none"
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateProjectOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || !key.trim() || isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
