require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function timed(label, fn) {
  const t0 = Date.now();
  try {
    const r = await fn();
    console.log(`${label}: ${Date.now() - t0}ms`);
    return r;
  } catch (e) {
    console.log(`${label}: ERROR ${e.message}`);
    return null;
  }
}

(async () => {
  const { data: cnt } = await sb.from("schedules").select("id", { count: "exact", head: true });
  console.log("total schedules:", cnt?.length ?? cnt);

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";

  await timed("list 1 page (no filter) exact-count", async () => {
    const r = await sb.from("schedules")
      .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email)", { count: "exact" })
      .is("deleted_at", null)
      .order("visit_date", { ascending: true })
      .range(0, 19);
    return r.count;
  });

  await timed("list 1 page (no filter) no-count", async () => {
    const r = await sb.from("schedules")
      .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email)")
      .is("deleted_at", null)
      .order("visit_date", { ascending: true })
      .range(0, 19);
    return r.data.length;
  });

  await timed("list exact-count with ilike member", async () => {
    const r = await sb.from("schedules")
      .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email)", { count: "exact" })
      .is("deleted_at", null)
      .ilike("member_name", "%a%")
      .order("visit_date", { ascending: true })
      .range(0, 19);
    return r.count;
  });

  await timed("list estimated-count with ilike member", async () => {
    const r = await sb.from("schedules")
      .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email)", { count: "estimated" })
      .is("deleted_at", null)
      .ilike("member_name", "%a%")
      .order("visit_date", { ascending: true })
      .range(0, 19);
    return r.count;
  });

  await timed("report data (month) exact-count", async () => {
    const r = await sb.from("schedules")
      .select("id, status, visit_date, user_id, kabupaten_id, kecamatan_id, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, tgl_panen, real_panen, rencana_panen, tgl_tanam, cgr, users!schedules_user_id_fkey(name), kabupaten(name), kecamatan(name), visit_time, notes, latitude", { count: "exact" })
      .is("deleted_at", null)
      .gte("visit_date", firstOfMonth)
      .lte("visit_date", today);
    return r.data.length;
  });

  await timed("report rows (month) limit 10000", async () => {
    const r = await sb.from("schedules")
      .select("id, visit_date, status, visit_time, label, rencana_panen, real_panen, tgl_panen, member_name, block_no, no_plot, nis, cgr, document_no, tgl_tanam, ph_tanah, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, detaseling, notes, latitude, users!schedules_user_id_fkey(name), kabupaten(name), kecamatan(name), desa(name)")
      .is("deleted_at", null)
      .gte("visit_date", firstOfMonth)
      .lte("visit_date", today)
      .order("visit_date", { ascending: true })
      .limit(10000);
    return r.data.length;
  });
})();
