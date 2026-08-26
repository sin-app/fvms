"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/components/auth-context";
import {
  getOfflineDb,
  isOfflineDbAvailable,
  notifyOutboxChanged,
  outboxChangeEventName,
  OUTBOX_CHANGE_EVENT,
} from "./db";
import {
  hydrateOffline,
  pendingOutboxCount,
  pushOutbox,
  syncUserContext,
  type HydrateResult,
} from "./engine";
import { notifyProposalSubmittedAction } from "@/features/land-proposals/actions/land-proposal-actions";
import { createClient } from "@/lib/supabase/client";

export interface SyncState {
  /** Koneksi jaringan saat ini. */
  online: boolean;
  /** Sedang sinkron (push + hydrate) berjalan. */
  syncing: boolean;
  /** Jumlah mutasi lokal yang menunggu dikirim. */
  pending: number;
  /** Epoch ms sinkron penuh terakhir yang berhasil, atau null. */
  lastSyncAt: number | null;
  /** Pesan error sinkron terakhir (null bila bersih). */
  lastError: string | null;
  /** Naik setiap hydrate selesai — dipakai query lokal untuk refetch dari IndexedDB. */
  hydrateVersion: number;
}

const initialState: SyncState = {
  online: true,
  syncing: false,
  pending: 0,
  lastSyncAt: null,
  lastError: null,
  hydrateVersion: 0,
};

export { notifyOutboxChanged, outboxChangeEventName, OUTBOX_CHANGE_EVENT };

interface SyncContextValue extends SyncState {
  /** Jalankan sinkron manual: push outbox lalu tarik data terbaru. */
  syncNow: () => Promise<HydrateResult | null>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SyncState>(initialState);
  const hydratedFor = useRef<string | null>(null);

  const refreshPending = useCallback(async () => {
    if (!isOfflineDbAvailable()) return;
    try {
      const pending = await pendingOutboxCount();
      setState((prev) => (prev.pending === pending ? prev : { ...prev, pending }));
    } catch {
      setState((prev) => (prev.pending === 0 ? prev : { ...prev, pending: 0 }));
    }
  }, []);

  const syncNow = useCallback(async (): Promise<HydrateResult | null> => {
    if (!user || !isOfflineDbAvailable()) return null;
    setState((prev) => ({ ...prev, syncing: true, lastError: null }));
    try {
      const supabase = createClient();
      // Role dari DB (source of truth), bukan metadata JWT yang bisa
      // diedit user — hindari spoof role di alur sinkron.
      const role = user.role === "admin" || user.role === "qc" ? user.role : "produksi";
      const ctx = syncUserContext({ ...user, role });
      const pushed = await pushOutbox({
        supabase,
        user: ctx,
        onLandProposalInserted: async (proposalId) => {
          await notifyProposalSubmittedAction(proposalId);
        },
      });
      const hydrate = await hydrateOffline({ supabase, user: ctx });
      setState((prev) => ({
        ...prev,
        syncing: false,
        lastSyncAt: Date.now(),
        hydrateVersion: prev.hydrateVersion + 1,
        lastError: pushed.failed > 0 ? `${pushed.failed} perubahan gagal dikirim` : null,
      }));
      return hydrate;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        syncing: false,
        lastError: error instanceof Error ? error.message : String(error),
      }));
      return null;
    } finally {
      void refreshPending();
    }
  }, [user, refreshPending]);

  useEffect(() => {
    if (!user) {
      // User logout: reset guard agar login berikutnya selalu re-hydrate
      // (data server bisa berubah oleh sesi/import lain).
      hydratedFor.current = null;
      return;
    }
    if (!isOfflineDbAvailable()) return;
    // Guard pakai signature scope (id + role + kabupaten), bukan sekadar id.
    // AuthProvider mengisi `user` dari cache session dulu (assigned_kabupaten_ids
    // kosong), lalu menimpanya dengan data DB via refreshUser(). Tanpa scope
    // key, hidrasi otomatis login hanya berjalan dengan scope kosong sehingga
    // user QC melihat data kosong hingga sinkron manual. Dengan scope key,
    // saat user diperbarui (kabupaten terisi) efek ini menjalankan hidrasi
    // ulang otomatis — tidak perlu aksi manual.
    const scopeKey = `${user.id}|${user.role}|${(user.assigned_kabupaten_ids ?? []).join(",")}`;
    if (hydratedFor.current === scopeKey) return;
    hydratedFor.current = scopeKey;
    void refreshPending();
    void syncNow();

    const onOnline = () => {
      setState((prev) => ({ ...prev, online: true, lastError: null }));
      void syncNow();
    };
    const onOffline = () => setState((prev) => ({ ...prev, online: false }));
    const onOutbox = (event: Event) => {
      const detail = (event as CustomEvent<{ count: number }>).detail;
      setState((prev) => ({ ...prev, pending: detail?.count ?? 0 }));
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(OUTBOX_CHANGE_EVENT, onOutbox);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(OUTBOX_CHANGE_EVENT, onOutbox);
    };
  }, [user, refreshPending, syncNow]);

  useEffect(() => {
    if (!user || !isOfflineDbAvailable()) return;
    const db = getOfflineDb();
    void refreshPending();
    const onHook = () => {
      void refreshPending();
      // Beri kesempatan transaksi IDB selesai sebelum menghitung ulang.
      setTimeout(() => void refreshPending(), 50);
    };
    db.outbox.hook("creating", onHook);
    db.outbox.hook("updating", onHook);
    db.outbox.hook("deleting", onHook);
    return () => {
      db.outbox.hook("creating").unsubscribe(onHook);
      db.outbox.hook("updating").unsubscribe(onHook);
      db.outbox.hook("deleting").unsubscribe(onHook);
    };
  }, [user, refreshPending]);

  const value: SyncContextValue = { ...state, syncNow };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSync harus dipakai di dalam SyncProvider");
  }
  return ctx;
}