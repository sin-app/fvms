-- Enable Realtime untuk tabel notifications agar notifikasi (termasuk untuk
-- admin & QC saat ada pengajuan lahan) muncul secara live di klien melalui
-- postgres_changes (lihat useRealtimeNotifications).
-- Idempoten: aman dijalankan berkali-kali.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
