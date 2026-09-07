import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'db.dart';

/// Mirror src/lib/offline/engine.ts
/// hydrateOffline scoped by role, pushOutbox with whitelist + guard final status.

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
  final AppDatabase db;
  final SupabaseClient supabase;
  OfflineEngine({required this.db, required this.supabase});

  Future<void> hydrateOffline() async {
    // Simplified F0: pull schedules, regions. Full watermark logic in F2/F3.
    final user = supabase.auth.currentUser;
    if (user == null) return;

    // Example: pull schedules (role scope applied server-side via RLS)
    final rows = await supabase
        .from('schedules')
        .select()
        .isFilter('deleted_at', null)
        .order('visit_date');

    await db.batch((b) {
      b.deleteAll(db.schedules);
      for (final r in (rows as List)) {
        b.insert(
          db.schedules,
          SchedulesCompanion(
            id: Value(r['id'] as String),
            visitDate: Value(r['visit_date'] as String),
            status: Value(r['status'] as String),
            userId: Value(r['user_id'] as String?),
            kabupatenId: Value(r['kabupaten_id'] as String?),
            blockNo: Value(r['block_no'] as String?),
            noPlot: Value(r['no_plot'] as String?),
            memberName: Value(r['member_name'] as String?),
            documentNo: Value(r['document_no'] as String?),
            nis: Value(r['nis'] as String?),
            cgr: Value(r['cgr'] as String?),
            updatedAt: Value(r['updated_at'] as String? ?? DateTime.now().toIso8601String()),
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
    if (e.tableName == 'schedules') {
      // Guard final status offline-only = reject
      if (finalStatuses.contains(payload['status'])) {
        throw Exception('Status final hanya bisa online');
      }
      // whitelist
      final filtered = {for (final k in scheduleWhitelist) if (payload.containsKey(k)) k: payload[k]};
      await supabase.from('schedules').update(filtered).eq('id', e.entityId);
    } else if (e.tableName == 'visit_notes') {
      await supabase.from('visit_notes').upsert({...payload, 'schedule_id': e.entityId});
    } else if (e.tableName == 'visit_photos') {
      // Simplified: payload contains url etc; blob upload handled before queue in real F3
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
    // patch local
    await (db.update(db.schedules)..where((t) => t.id.equals(scheduleId))).write(
      SchedulesCompanion(
        status: filtered.containsKey('status') ? Value(filtered['status'] as String) : const Value.absent(),
        label: filtered.containsKey('label') ? Value(filtered['label'] as String?) : const Value.absent(),
      ),
    );
    await db.into(db.outbox).insert(
          OutboxCompanion(
            id: Value(DateTime.now().millisecondsSinceEpoch.toString()),
            tableName: const Value('schedules'),
            action: const Value('upsert'),
            entityId: Value(scheduleId),
            payload: Value(jsonEncode(filtered)),
            createdAt: Value(DateTime.now().millisecondsSinceEpoch),
          ),
        );
  }
}
