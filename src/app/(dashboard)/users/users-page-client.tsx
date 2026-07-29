"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UsersTable, UserForm } from "@/features/auth";
import { createUserAction, backfillUserKabupatenAction } from "@/features/auth/actions/user-actions";

export function UsersPageInner() {
  const [showCreate, setShowCreate] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  async function handleBackfill() {
    setBackfilling(true);
    const result = await backfillUserKabupatenAction();
    if (result.success) {
      toast.success(`Wilayah tugas berhasil diisi untuk ${result.updated} pengguna`);
    } else {
      toast.error(result.error ?? "Gagal backfill");
    }
    setBackfilling(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengguna"
        description="Kelola pengguna dan role"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleBackfill} disabled={backfilling}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${backfilling ? "animate-spin" : ""}`} />
              {backfilling ? "Memproses..." : "Isi Wilayah Tugas"}
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Pengguna
            </Button>
          </div>
        }
      />

      <UsersTable />

      <UserForm
        action={createUserAction}
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}
