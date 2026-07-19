"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useKecamatanList } from "../hooks/use-kecamatan";
import { useAllKabupaten } from "../hooks/use-kabupaten";
import { createKecamatanAction, updateKecamatanAction, deleteKecamatanAction } from "../actions/master-data-actions";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useActionState } from "react";
import { cn } from "@/lib/utils";
import type { Kecamatan } from "@/types";
import type { ActionResponse } from "@/types/common";
import type { ReactNode } from "react";

function KecamatanForm({
  action,
  defaultValues,
  onSuccess,
  children,
}: {
  action: (prev: ActionResponse, formData: FormData) => Promise<ActionResponse>;
  defaultValues?: { name?: string; code?: string; kabupaten_id?: string };
  onSuccess?: () => void;
  children?: ReactNode;
}) {
  const { data: kabupaten } = useAllKabupaten();
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
        <Label htmlFor="kabupaten_id">Kabupaten</Label>
        <select
          id="kabupaten_id"
          name="kabupaten_id"
          defaultValue={defaultValues?.kabupaten_id ?? ""}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Pilih Kabupaten</option>
          {kabupaten?.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.kabupaten_id && (
          <p className="text-sm text-destructive">{state.fieldErrors.kabupaten_id[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nama Kecamatan</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
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

export function KecamatanTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [kabupatenFilter, setKabupatenFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Kecamatan | null>(null);
  const [deleting, setDeleting] = useState<Kecamatan | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data: kabupaten } = useAllKabupaten();
  const { data, isLoading, isError, refetch } = useKecamatanList(kabupatenFilter || undefined, debouncedSearch, page);

  async function handleDelete() {
    if (!deleting) return;
    const formData = new FormData();
    formData.set("id", deleting.id);
    try {
      const result = await deleteKecamatanAction({ success: false }, formData);
      if (!result.success) throw new Error(result.error);
      refetch();
    } catch { /* noop */ }
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        title="Kecamatan"
        description="Kelola data kecamatan"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Kecamatan
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari kecamatan..." />
        </div>
        <select
          value={kabupatenFilter}
          onChange={(e) => { setKabupatenFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Semua Kabupaten</option>
          {kabupaten?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingState variant="table" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data?.data.length ? (
        <EmptyState
          title="Belum ada data"
          description="Belum ada kecamatan yang ditambahkan"
          action={{ label: "Tambah Kecamatan", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <>
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kode</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Nama</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kabupaten</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm whitespace-nowrap font-mono">{item.code}</td>
                    <td className="p-3 text-sm whitespace-nowrap">{item.name}</td>
                    <td className="p-3 text-sm whitespace-nowrap text-muted-foreground">
                      {(item as unknown as { kabupaten?: { name: string } }).kabupaten?.name}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(item)}>
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
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button>
              <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Selanjutnya</Button>
            </div>
          )}
        </>
      )}

      <ReusableDialog open={showCreate} onOpenChange={setShowCreate} title="Tambah Kecamatan" description="Masukkan data kecamatan baru">
        <KecamatanForm action={createKecamatanAction} onSuccess={() => setShowCreate(false)} />
      </ReusableDialog>

      <ReusableDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Edit Kecamatan">
        {editing && (
          <KecamatanForm
            action={updateKecamatanAction}
            defaultValues={{ name: editing.name, code: editing.code, kabupaten_id: editing.kabupaten_id }}
            onSuccess={() => setEditing(null)}
          >
            <input type="hidden" name="id" value={editing.id} />
          </KecamatanForm>
        )}
      </ReusableDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus Kecamatan?"
        message={`Yakin ingin menghapus ${deleting?.name}?`}
        confirmLabel="Hapus" variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
