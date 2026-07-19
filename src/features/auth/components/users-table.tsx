"use client";

import { useState } from "react";
import { Pencil, ToggleLeft, ToggleRight, Shield, KeyRound } from "lucide-react";
import { useUsersAdmin, useToggleUserActive, useSetPassword } from "../hooks/use-users-admin";
import { createUserAction, updateUserAction } from "../actions/user-actions";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm } from "./user-form";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import type { User } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  field_officer: "Field Officer",
};

export function UsersTable() {
  const { data: users, isLoading, isError, refetch } = useUsersAdmin();
  const toggleActive = useToggleUserActive();
  const setPassword = useSetPassword();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toggling, setToggling] = useState<User | null>(null);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [pwdValue, setPwdValue] = useState("");

  if (isLoading) return <LoadingState variant="table" />;
  if (isError) return <ErrorState onRetry={refetch} />;

  if (!users?.length) {
    return (
      <EmptyState
        title="Tidak ada pengguna"
        description="Belum ada pengguna terdaftar."
        action={{ label: "Tambah Pengguna", onClick: () => setShowCreate(true) }}
      />
    );
  }

  return (
    <div>
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Nama</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Email</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Role</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Terdaftar</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-sm whitespace-nowrap font-medium">{user.name}</td>
                  <td className="p-3 text-sm whitespace-nowrap text-muted-foreground">{user.email}</td>
                  <td className="p-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      user.role === "admin" && "bg-purple-50 text-purple-700",
                      user.role === "supervisor" && "bg-blue-50 text-blue-700",
                      user.role === "field_officer" && "bg-green-50 text-green-700",
                    )}>
                      <Shield className="h-3 w-3" />
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      user.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
                    )}>
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap text-muted-foreground">{formatDate(user.created_at)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToggling(user)}
                        title={user.is_active ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {user.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPwdValue("");
                          setPwdUser(user);
                        }}
                        title="Atur Password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserForm
        action={createUserAction}
        open={showCreate}
        onOpenChange={setShowCreate}
      />

      <UserForm
        action={updateUserAction}
        defaultValues={editingUser ?? undefined}
        open={!!editingUser}
        onOpenChange={(o) => !o && setEditingUser(null)}
      />

      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.is_active ? "Nonaktifkan Pengguna?" : "Aktifkan Pengguna?"}
        message={
          toggling?.is_active
            ? `Pengguna "${toggling?.name}" tidak akan bisa login.`
            : `Aktifkan kembali pengguna "${toggling?.name}".`
        }
        confirmLabel={toggling?.is_active ? "Nonaktifkan" : "Aktifkan"}
        variant={toggling?.is_active ? "destructive" : "default"}
        onConfirm={async () => {
          if (!toggling) return;
          await toggleActive.mutateAsync({ id: toggling.id, is_active: !toggling.is_active });
          setToggling(null);
        }}
        loading={toggleActive.isPending}
      />

      <Dialog open={!!pwdUser} onOpenChange={(o) => !o && setPwdUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Password</DialogTitle>
            <DialogDescription>
              Tetapkan password login untuk {pwdUser?.name}. Password minimal 6 karakter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="password">Password baru</Label>
            <Input
              id="password"
              type="text"
              value={pwdValue}
              onChange={(e) => setPwdValue(e.target.value)}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdUser(null)}>
              Batal
            </Button>
            <Button
              disabled={pwdValue.length < 6 || setPassword.isPending}
              onClick={async () => {
                if (!pwdUser) return;
                await setPassword.mutateAsync({ id: pwdUser.id, password: pwdValue });
                setPwdUser(null);
              }}
            >
              {setPassword.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
