import { FormEvent, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminResetPasswordPayload, AdminUser } from "@/services/adminUsersService";

interface AdminResetPasswordDialogProps {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminResetPasswordPayload) => void;
  isPending: boolean;
  fieldErrors?: Record<string, string>;
}

const AdminResetPasswordDialog = ({
  user,
  onOpenChange,
  onSubmit,
  isPending,
  fieldErrors = {},
}: AdminResetPasswordDialogProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!user) return;
    setPassword("");
    setConfirmPassword("");
    setLocalError("");
  }, [user]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");

    if (password.length < 8) {
      setLocalError("The new password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("The passwords do not match.");
      return;
    }

    onSubmit({ password, confirm_password: confirmPassword });
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !isPending && onOpenChange(open)}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <KeyRound className="h-5 w-5" />
          </div>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for <strong className="font-semibold text-foreground">{user?.full_name || user?.email}</strong>.
            Share it through a secure channel.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="admin-reset-password">New password</Label>
            <Input
              id="admin-reset-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
              disabled={isPending}
              autoFocus
            />
            {fieldErrors.password && <p className="text-xs font-medium text-destructive">{fieldErrors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-reset-password-confirm">Confirm new password</Label>
            <Input
              id="admin-reset-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
              disabled={isPending}
            />
            {fieldErrors.confirm_password && (
              <p className="text-xs font-medium text-destructive">{fieldErrors.confirm_password}</p>
            )}
          </div>

          {(localError || fieldErrors.non_field_errors || fieldErrors.detail) && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {localError || fieldErrors.non_field_errors || fieldErrors.detail}
            </div>
          )}

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !password || !confirmPassword}>
              <KeyRound className="h-4 w-4" />
              {isPending ? "Resetting..." : "Reset password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminResetPasswordDialog;
