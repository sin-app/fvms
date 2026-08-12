-- ============================================================
-- 033_restrict_produksi_updates.sql
-- Batasi kolom yang boleh diubah role produksi langsung via REST
-- (defense-in-depth: kontrol server action bisa dilewati PATCH).
-- Dilarang untuk produksi:
--   - memindahkan kepemilikan/lokasi jadwal (user_id, kabupaten_id,
--     kecamatan_id, desa_id, created_by)
--   - menetapkan status terminal (completed, gagal_total, gagal_partial)
--     — verifikasi hanya QC/admin
-- Trigger tidak memengaruhi service-role (auth.jwt() kosong) atau
-- admin/QC: perubahan lewat server action tetap berjalan normal.
-- ============================================================

CREATE OR REPLACE FUNCTION restrict_produksi_schedule_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  kolom text;
  dilarang text[] := ARRAY['user_id','kabupaten_id','kecamatan_id','desa_id','created_by'];
  status_terminal text[] := ARRAY['completed','gagal_total','gagal_partial'];
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'produksi' THEN
    FOREACH kolom IN ARRAY dilarang LOOP
      IF (to_jsonb(NEW) ->> kolom) IS DISTINCT FROM (to_jsonb(OLD) ->> kolom) THEN
        RAISE EXCEPTION 'Produksi tidak dapat mengubah kolom %', kolom;
      END IF;
    END LOOP;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status::text = ANY (status_terminal) THEN
      RAISE EXCEPTION 'Status terminal hanya dapat ditetapkan oleh QC/admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_produksi_updates ON schedules;
CREATE TRIGGER trg_restrict_produksi_updates
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION restrict_produksi_schedule_updates();