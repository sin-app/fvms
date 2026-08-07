"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/components/auth-context";
import { Trash2, Plus, Loader2, Key, Copy } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
}

interface ApiKeyWithMasked extends ApiKey {
  key_masked: string;
}

interface CreatedKey extends ApiKey {
  key_value: string;
}

export function ApiKeyManager() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyWithMasked[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/keys")
      .then((res) => (res.ok ? res.json() : { keys: [] }))
      .then((data: { keys?: ApiKeyWithMasked[] }) => {
        if (cancelled) return;
        setKeys(data.keys ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user?.role !== "admin") return null;

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (res.ok && data.key) {
        setKeys((prev) => [{ ...data.key, key_masked: "" }, ...prev]);
        setJustCreated({ id: data.key.id, name: data.key.name, key_value: data.key.key_value, created_at: data.key.created_at });
        setNewKeyName("");
        toast.success("API Key berhasil dibuat");
      } else {
        toast.error(data.error ?? "Gagal membuat API Key");
      }
    } catch {
      toast.error("Gagal membuat API Key");
    } finally {
      setCreating(false);
    }
  }

  async function deleteKey(id: string) {
    try {
      const res = await fetch(`/api/v1/keys?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        if (justCreated?.id === id) setJustCreated(null);
        toast.success("API Key dihapus");
      }
    } catch {
      toast.error("Gagal menghapus API Key");
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("API Key disalin ke clipboard");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Nama API Key baru..."
          className="flex-1 min-w-0 h-9 rounded-lg border border-input bg-background px-3 text-sm"
        />
        <button
          onClick={createKey}
          disabled={creating || !newKeyName.trim()}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Buat
        </button>
      </div>

      {justCreated && (
        <div className="rounded-lg border border-green-200 dark:border-green-900 p-3 space-y-2">
          <p className="text-xs font-medium text-green-700 dark:text-green-400">
            Key hanya ditampilkan sekali. Salin sekarang:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 text-xs font-mono bg-muted rounded px-2 py-1.5 truncate">
              {justCreated.key_value}
            </code>
            <button
              onClick={() => copyKey(justCreated.key_value)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Salin"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat...
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
          <Key className="h-8 w-8" />
          <p className="text-sm">Belum ada API Key</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{k.name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {k.key_masked || "••••••••••"}
                </p>
              </div>
              <button
                onClick={() => deleteKey(k.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}