"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UsersTable, UserForm } from "@/features/auth";
import { createUserAction } from "@/features/auth/actions/user-actions";

export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengguna"
        description="Kelola pengguna dan role"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Pengguna
          </Button>
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
