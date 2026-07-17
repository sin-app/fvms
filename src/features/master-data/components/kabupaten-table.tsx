"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useKabupatenList } from "../hooks/use-kabupaten";
import { createKabupatenAction, updateKabupatenAction, deleteKabupatenAction } from "../actions/master-data-actions";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { MasterForm } from "./master-form";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import type { Kabupaten } from "@/types";

export function KabupatenTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingKabupaten, setEditingKabupaten] = useState<Kabupaten | null>(null);
  const [deletingKabupaten, setDeletingKabupaten] = useState<Kabupaten | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, isError, refetch } = useKabupatenList(debouncedSearch, page);

  async function handleDelete() {
    if (!deletingKabupaten) return;
    const formData = new FormData();
    formData.set("id", deletingKabupaten.id);
    try {
      await deleteKabupatenAction(formData);
      refetch();
    } catch {
      // error handled
    }
    setDeletingKabupaten(null);
  }

  return (
    <div>
      <PageHeader
        title="Kabupaten"
        description="Kelola data kabupaten"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kabupaten
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari kabupaten..." />
      </div>

      {isLoading ? (
        <LoadingState variant="table" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data?.data.length ? (
        <EmptyState
          title="Belum ada data"
          description="Belum ada kabupaten yang ditambahkan"
          action={{ label: "Tambah Kabupaten", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <>
          <div className="rounded-xl border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Kode</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nama</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm font-mono">{item.code}</td>
                    <td className="p-3 text-sm">{item.name}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingKabupaten(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingKabupaten(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}

      <ReusableDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Tambah Kabupaten"
        description="Masukkan data kabupaten baru"
      >
        <MasterForm
          action={createKabupatenAction}
          onSuccess={() => setShowCreate(false)}
        />
      </ReusableDialog>

      <ReusableDialog
        open={!!editingKabupaten}
        onOpenChange={(open) => !open && setEditingKabupaten(null)}
        title="Edit Kabupaten"
        description="Ubah data kabupaten"
      >
        {editingKabupaten && (
          <MasterForm
            action={updateKabupatenAction}
            defaultValues={{ name: editingKabupaten.name, code: editingKabupaten.code }}
            onSuccess={() => setEditingKabupaten(null)}
          >
            <input type="hidden" name="id" value={editingKabupaten.id} />
          </MasterForm>
        )}
      </ReusableDialog>

      <ConfirmDialog
        open={!!deletingKabupaten}
        onOpenChange={(open) => !open && setDeletingKabupaten(null)}
        title="Hapus Kabupaten?"
        message={`Yakin ingin menghapus ${deletingKabupaten?.name}? Data yang terkait juga akan terhapus.`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
