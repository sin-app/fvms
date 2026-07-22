"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/components/auth-context";
import { Copy, Trash2, Plus, Loader2, Key } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

export function ApiKeyManager() {
  const { user } = useAuth();
  if (user?.role !== "admin") return null;

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys ?? []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

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
        setKeys((prev) => [...prev, data.key]);
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
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Nama API Key baru..."
          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
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
                  {k.key.slice(0, 16)}...
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyKey(k.key)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Salin"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteKey(k.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
