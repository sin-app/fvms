"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ActionResponse } from "@/types/common";

interface MasterFormProps {
  action: (prev: ActionResponse, formData: FormData) => Promise<ActionResponse>;
  defaultValues?: { name?: string; code?: string };
  onSuccess?: () => void;
  children?: ReactNode;
}

export function MasterForm({ action, defaultValues, onSuccess, children }: MasterFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResponse, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.success && onSuccess) onSuccess();
      return result;
    },
    { success: false },
  );

  return (
    <form action={formAction} className="space-y-4">
      {children}

      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Masukkan nama"
          className={cn(state.fieldErrors?.name && "border-destructive")}
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Kode</Label>
        <Input
          id="code"
          name="code"
          defaultValue={defaultValues?.code}
          placeholder="Masukkan kode"
          className={cn(state.fieldErrors?.code && "border-destructive")}
        />
        {state.fieldErrors?.code && (
          <p className="text-sm text-destructive">{state.fieldErrors.code[0]}</p>
        )}
      </div>

      {state.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
