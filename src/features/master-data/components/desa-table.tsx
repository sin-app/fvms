"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDesaList } from "../hooks/use-desa";
import { useAllKecamatan } from "../hooks/use-kecamatan";
import { useAllKabupaten } from "../hooks/use-kabupaten";
import { createDesaAction, updateDesaAction, deleteDesaAction } from "../actions/master-data-actions";
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
import { useAuth } from "@/features/auth/components/auth-context";
import type { Desa } from "@/types";
import type { ActionResponse } from "@/types/common";
import type { ReactNode } from "react";

function DesaForm({
  action,
  defaultValues,
  onSuccess,
  children,
}: {
  action: (prev: ActionResponse, formData: FormData) => Promise<ActionResponse>;
  defaultValues?: { name?: string; code?: string; kecamatan_id?: string; kabupaten_id?: string };
  onSuccess?: () => void;
  children?: ReactNode;
}) {
  const { data: kabupaten } = useAllKabupaten();
  const [selectedKabupaten, setSelectedKabupaten] = useState(
    defaultValues?.kabupaten_id ?? "",
  );
  const [selectedKecamatan, setSelectedKecamatan] = useState(
    defaultValues?.kecamatan_id ?? "",
  );
  const { data: kecamatan } = useAllKecamatan(selectedKabupaten);

  function handleKabupatenChange(value: string) {
    setSelectedKabupaten(value);
    setSelectedKecamatan("");
  }
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
        <Label>Kabupaten</Label>
        <select
          value={selectedKabupaten}
          onChange={(e) => handleKabupatenChange(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Pilih Kabupaten</option>
          {kabupaten?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kecamatan_id">Kecamatan</Label>
        <select
          id="kecamatan_id"
          name="kecamatan_id"
          value={selectedKecamatan}
          onChange={(e) => setSelectedKecamatan(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Pilih Kecamatan</option>
          {kecamatan?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
        {state.fieldErrors?.kecamatan_id && (
          <p className="text-sm text-destructive">{state.fieldErrors.kecamatan_id[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nama Desa</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} className={cn(state.fieldErrors?.name && "border-destructive")} />
        {state.fieldErrors?.name && <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Kode</Label>
        <Input id="code" name="code" defaultValue={defaultValues?.code} className={cn(state.fieldErrors?.code && "border-destructive")} />
        {state.fieldErrors?.code && <p className="text-sm text-destructive">{state.fieldErrors.code[0]}</p>}
      </div>

      {state.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function DesaTable() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Desa | null>(null);
  const [deleting, setDeleting] = useState<Desa | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data: kabupaten } = useAllKabupaten();
  const [filterKab, setFilterKab] = useState("");
  const { data: kecamatanList } = useAllKecamatan(filterKab || "__none__");
  const { data, isLoading, isError, refetch } = useDesaList(kecamatanFilter || undefined, debouncedSearch, page);

  async function handleDelete() {
    if (!deleting) return;
    const fd = new FormData();
    fd.set("id", deleting.id);
    try {
      const result = await deleteDesaAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
      refetch();
    } catch { /* noop */ }
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        title="Desa"
        description="Kelola data desa"
        actions={isAdmin ? <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Tambah Desa</Button> : undefined}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari desa..." />
        </div>
        <select value={filterKab} onChange={(e) => { setFilterKab(e.target.value); setKecamatanFilter(""); }} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Semua Kabupaten</option>
          {kabupaten?.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <select value={kecamatanFilter} onChange={(e) => { setKecamatanFilter(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Semua Kecamatan</option>
          {kecamatanList?.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <LoadingState variant="table" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data?.data.length ? (
        <EmptyState title="Belum ada data" description="Belum ada desa yang ditambahkan" action={isAdmin ? { label: "Tambah Desa", onClick: () => setShowCreate(true) } : undefined} />
      ) : (
        <>
          <div className="rounded-xl border overflow-x-auto min-w-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kode</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Nama</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kecamatan</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm whitespace-nowrap font-mono">{item.code}</td>
                    <td className="p-3 text-sm whitespace-nowrap">{item.name}</td>
                    <td className="p-3 text-sm whitespace-nowrap text-muted-foreground">
                      {(item as unknown as { kecamatan?: { name: string } }).kecamatan?.name}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </>
                        )}
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

      <ReusableDialog open={showCreate} onOpenChange={setShowCreate} title="Tambah Desa" description="Masukkan data desa baru">
        <DesaForm action={createDesaAction} onSuccess={() => setShowCreate(false)} />
      </ReusableDialog>

      <ReusableDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Edit Desa">
        {editing && (
          <DesaForm
            action={updateDesaAction}
            defaultValues={{
              name: editing.name,
              code: editing.code,
              kecamatan_id: editing.kecamatan_id,
              kabupaten_id: (editing as unknown as { kecamatan?: { kabupaten_id?: string } }).kecamatan?.kabupaten_id ?? "",
            }}
            onSuccess={() => setEditing(null)}
          >
            <input type="hidden" name="id" value={editing.id} />
          </DesaForm>
        )}
      </ReusableDialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Hapus Desa?" message={`Yakin ingin menghapus ${deleting?.name}?`} confirmLabel="Hapus" variant="destructive" onConfirm={handleDelete} />
    </div>
  );
}
