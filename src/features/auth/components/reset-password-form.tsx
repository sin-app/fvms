"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ActionResponse } from "@/types/common";
import { MailCheck } from "lucide-react";

const initialState: ActionResponse = { success: false };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <MailCheck className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold">Cek Email Anda</h2>
        <p className="text-sm text-muted-foreground">
          Kami telah mengirim instruksi reset password ke email Anda.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          className={cn(state.fieldErrors?.email && "border-destructive")}
        />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      {state.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim Instruksi Reset"}
      </Button>
    </form>
  );
}
