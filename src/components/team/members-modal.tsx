"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUIStore } from "@/stores/use-ui-store";
import { MemberRole, WorkspaceMemberItem } from "@/types";
import { updateMemberRoleAction, inviteMemberAction } from "@/server/actions/workspaces";
import { ShieldCheck, UserPlus, Loader2, Crown, Shield, User, Eye, CheckCircle2 } from "lucide-react";

interface MembersModalProps {
  workspaceId: string;
  workspaceName: string;
  initialMembers: WorkspaceMemberItem[];
}

export function MembersModal({
  workspaceId,
  workspaceName,
  initialMembers,
}: MembersModalProps) {
  const router = useRouter();
  const { isMembersModalOpen, setMembersModalOpen } = useUIStore();
  const [members, setMembers] = useState<WorkspaceMemberItem[]>(initialMembers);
  const [isPending, startTransition] = useTransition();

  // Invite form state
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [successMsg, setSuccessMsg] = useState("");

  React.useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const handleRoleChange = (memberId: string, newRole: MemberRole) => {
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );

    startTransition(async () => {
      await updateMemberRoleAction(memberId, newRole, workspaceId);
      router.refresh();
    });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    startTransition(async () => {
      const res = await inviteMemberAction(
        workspaceId,
        inviteEmail,
        inviteName,
        inviteRole
      );

      if (res.success && res.data) {
        setMembers((prev) => [...prev, res.data as unknown as WorkspaceMemberItem]);
        setInviteEmail("");
        setInviteName("");
        setIsInviting(false);
        setSuccessMsg(`Invited ${inviteName} as ${inviteRole}!`);
        setTimeout(() => setSuccessMsg(""), 3000);
        router.refresh();
      } else {
        alert("Failed to invite: " + res.error);
      }
    });
  };

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case "ADMIN":
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      case "MEMBER":
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case "VIEWER":
        return <Eye className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <Dialog open={isMembersModalOpen} onOpenChange={setMembersModalOpen}>
      <DialogContent className="sm:max-w-xl bg-card border-border/80 p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Workspace Members & RBAC</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {members.length} members
                  </span>
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Role-based member isolation for <strong>{workspaceName}</strong>
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsInviting(!isInviting)}
              className="h-8 text-xs bg-primary text-primary-foreground font-medium flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isInviting ? "Cancel" : "Invite"}</span>
            </Button>
          </div>
        </DialogHeader>

        {successMsg && (
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Invite Member Drawer Form */}
        {isInviting && (
          <form
            onSubmit={handleInviteSubmit}
            className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-3 transition-all"
          >
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-primary" />
              Invite New Team Member
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                placeholder="Full Name (e.g. David Miller)"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                className="h-8 text-xs bg-background"
              />
              <Input
                type="email"
                placeholder="Work Email (e.g. david@acme.dev)"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground text-[11px]">Role:</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="text-xs bg-background border border-border/70 rounded px-2 py-1 text-foreground font-medium outline-none"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isPending || !inviteEmail.trim() || !inviteName.trim()}
                className="h-7 text-xs px-3"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                Send Invite
              </Button>
            </div>
          </form>
        )}

        {/* Member List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card/60 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 ring-1 ring-border">
                  {member.user.avatarUrl && <AvatarImage src={member.user.avatarUrl} />}
                  <AvatarFallback className="text-xs bg-primary/20 text-primary uppercase font-medium">
                    {member.user.name?.[0] || member.user.email[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {member.user.name || "Member"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {member.user.email}
                  </span>
                </div>
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded border border-border/60">
                  {getRoleIcon(member.role)}
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as MemberRole)
                    }
                    disabled={isPending}
                    className="text-[11px] font-semibold bg-transparent text-foreground outline-none cursor-pointer"
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
