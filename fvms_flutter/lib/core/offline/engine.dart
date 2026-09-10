import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:fvms_flutter/core/offline/db.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/supabase/scope.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const finalStatuses = {'completed', 'gagal_total'};
const scheduleWhitelist = {
  'status',
  'label',
  'latitude',
  'longitude',
  'accuracy',
  'visit_time',
};

class OfflineEngine {
  OfflineEngine({required this.db, required this.supabase});
  final AppDatabase db;
  final SupabaseClient supabase;

  Future<void> hydrateOffline() async {
    final user = supabase.auth.currentUser;
    if (user == null) return;

    final ctx = await getAuthContext();
    dynamic query = supabase.from('schedules').select().isFilter('deleted_at', null);
    query = applyScope(query, ctx);
    final rows = await query.order('visit_date');

    await db.batch((b) {
      b.deleteAll(db.schedules);
      for (final r in (rows as List)) {
        final m = r as Map<String, dynamic>;
        b.insert(
          db.schedules,
          SchedulesCompanion(
            id: Value(m['id'] as String),
            visitDate: Value(m['visit_date'] as String),
            status: Value(m['status'] as String),
            userId: Value(m['user_id'] as String?),
            kabupatenId: Value(m['kabupaten_id'] as String?),
            kecamatanId: Value(m['kecamatan_id'] as String?),
            desaId: Value(m['desa_id'] as String?),
            label: Value(m['label'] as String?),
            blockNo: Value(m['block_no'] as String?),
            noPlot: Value(m['no_plot'] as String?),
            memberName: Value(m['member_name'] as String?),
            documentNo: Value(m['document_no'] as String?),
            nis: Value(m['nis'] as String?),
            cgr: Value(m['cgr'] as String?),
            phTanah: Value(m['ph_tanah']?.toString()),
            tglTanam: Value(m['tgl_tanam'] as String?),
            realTanamHa: Value(m['real_tanam_ha']?.toString()),
            gagalTanam: Value(m['gagal_tanam']?.toString()),
            sisaDiLahanHa: Value(m['sisa_di_lahan_ha']?.toString()),
            tglPanen: Value(m['tgl_panen'] as String?),
            realPanen: Value(m['real_panen'] as String?),
            rencanaPanen: Value(m['rencana_panen'] as String?),
            varietas: Value(m['document_no'] != null ? (m['document_no'] as String).split('/').length > 1 ? (m['document_no'] as String).split('/')[1] : null : null),
            latitude: Value((m['latitude'] as num?)?.toDouble()),
            longitude: Value((m['longitude'] as num?)?.toDouble()),
            kabupatenName: Value(m['kabupaten'] is Map ? (m['kabupaten'] as Map<String, dynamic>)['name'] as String? : m['kabupaten_name'] as String?),
            kecamatanName: Value(m['kecamatan'] is Map ? (m['kecamatan'] as Map<String, dynamic>)['name'] as String? : m['kecamatan_name'] as String?),
            desaName: Value(m['desa'] is Map ? (m['desa'] as Map<String, dynamic>)['name'] as String? : m['desa_name'] as String?),
            userName: Value(m['users'] is Map ? (m['users'] as Map<String, dynamic>)['name'] as String? : m['user_name'] as String?),
            updatedAt: Value(m['updated_at'] as String? ?? DateTime.now().toIso8601String()),
          ),
          mode: InsertMode.insertOrReplace,
        );
      }
    });

    await db.into(db.meta).insertOnConflictUpdate(
          MetaCompanion(key: const Value('last_sync_at'), value: Value(DateTime.now().toIso8601String())),
        );
  }

  Future<void> pushOutbox() async {
    final entries = await (db.select(db.outbox)..orderBy([(t) => OrderingTerm.asc(t.createdAt)])).get();
    for (final e in entries) {
      try {
        await _applyOutboxEntry(e);
        await (db.delete(db.outbox)..where((t) => t.id.equals(e.id))).go();
      } catch (err) {
        await (db.update(db.outbox)..where((t) => t.id.equals(e.id))).write(
          OutboxCompanion(
            attempts: Value(e.attempts + 1),
            lastError: Value(err.toString()),
          ),
        );
      }
    }
  }

  Future<void> _applyOutboxEntry(OutboxData e) async {
    final payload = jsonDecode(e.payload) as Map<String, dynamic>;
    if (e.tblName == 'schedules') {
      if (finalStatuses.contains(payload['status'])) {
        throw Exception('Status final hanya bisa online');
      }
      final filtered = {for (final k in scheduleWhitelist) if (payload.containsKey(k)) k: payload[k]};
      await supabase.from('schedules').update(filtered).eq('id', e.entityId);
    } else if (e.tblName == 'visit_notes') {
      await supabase.from('visit_notes').upsert({...payload, 'schedule_id': e.entityId});
    } else if (e.tblName == 'visit_photos') {
      if (e.action == 'delete') {
        await supabase.from('visit_photos').delete().eq('id', e.entityId);
      } else {
        await supabase.from('visit_photos').upsert(payload);
      }
    }
  }

  Future<void> queueScheduleUpdate(String scheduleId, Map<String, dynamic> patch) async {
    if (finalStatuses.contains(patch['status'])) {
      throw Exception('Status final tidak bisa diubah saat luring');
    }
    final filtered = {for (final k in scheduleWhitelist) if (patch.containsKey(k)) k: patch[k]};
    await (db.update(db.schedules)..where((t) => t.id.equals(scheduleId))).write(
      SchedulesCompanion(
        status: filtered.containsKey('status') ? Value(filtered['status'] as String) : const Value.absent(),
        label: filtered.containsKey('label') ? Value(filtered['label'] as String?) : const Value.absent(),
      ),
    );
    await db.into(db.outbox).insert(
          OutboxCompanion(
            id: Value(DateTime.now().millisecondsSinceEpoch.toString()),
            tblName: const Value('schedules'),
            action: const Value('upsert'),
            entityId: Value(scheduleId),
            payload: Value(jsonEncode(filtered)),
            createdAt: Value(DateTime.now().millisecondsSinceEpoch),
          ),
        );
  }
}
