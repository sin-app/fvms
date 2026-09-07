// ignore_for_file: avoid_print
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:path_provider/path_provider.dart';

part 'db.g.dart';

// Mirror src/lib/offline/db.ts Dexie v3

class Schedules extends Table {
  TextColumn get id => text()();
  TextColumn get visitDate => text()();
  TextColumn get userId => text().nullable()();
  TextColumn get kabupatenId => text().nullable()();
  TextColumn get kecamatanId => text().nullable()();
  TextColumn get desaId => text().nullable()();
  TextColumn get status => text()();
  TextColumn get label => text().nullable()();
  TextColumn get blockNo => text().nullable()();
  TextColumn get noPlot => text().nullable()();
  TextColumn get memberName => text().nullable()();
  TextColumn get documentNo => text().nullable()();
  TextColumn get nis => text().nullable()();
  TextColumn get cgr => text().nullable()();
  TextColumn get phTanah => text().nullable()();
  TextColumn get tglTanam => text().nullable()();
  TextColumn get realTanamHa => text().nullable()();
  TextColumn get gagalTanam => text().nullable()();
  TextColumn get sisaDiLahanHa => text().nullable()();
  TextColumn get detaseling => text().nullable()();
  TextColumn get tglPanen => text().nullable()();
  TextColumn get realPanen => text().nullable()();
  TextColumn get rencanaPanen => text().nullable()();
  TextColumn get varietas => text().nullable()();
  RealColumn get latitude => real().nullable()();
  RealColumn get longitude => real().nullable()();
  RealColumn get accuracy => real().nullable()();
  TextColumn get visitTime => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get deletedAt => text().nullable()();
  TextColumn get updatedAt => text()();
  TextColumn get kabupatenName => text().nullable()();
  TextColumn get kecamatanName => text().nullable()();
  TextColumn get desaName => text().nullable()();
  TextColumn get userName => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class VisitNotes extends Table {
  TextColumn get scheduleId => text()();
  TextColumn get observation => text().nullable()();
  TextColumn get problem => text().nullable()();
  TextColumn get recommend => text().nullable()();
  TextColumn get additional => text().nullable()();
  TextColumn get updatedAt => text()();

  @override
  Set<Column> get primaryKey => {scheduleId};
}

class VisitPhotos extends Table {
  TextColumn get id => text()();
  TextColumn get scheduleId => text()();
  TextColumn get url => text()();
  TextColumn get caption => text().nullable()();
  IntColumn get fileSize => integer().nullable()();
  TextColumn get mimeType => text().nullable()();
  TextColumn get createdAt => text()();
  BlobColumn get blobData => blob().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class Regions extends Table {
  TextColumn get key => text()();
  TextColumn get entity => text()(); // kabupaten|kecamatan|desa
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get parentId => text().nullable()();

  @override
  Set<Column> get primaryKey => {key};
}

class Outbox extends Table {
  TextColumn get id => text()();
  TextColumn get tblName => text()();
  TextColumn get action => text()(); // upsert|delete|insert|shift
  TextColumn get entityId => text()();
  TextColumn get payload => text()(); // json
  IntColumn get createdAt => integer()();
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class Meta extends Table {
  TextColumn get key => text()();
  TextColumn get value => text().nullable()();

  @override
  Set<Column> get primaryKey => {key};
}

@DriftDatabase(tables: [Schedules, VisitNotes, VisitPhotos, Regions, Outbox, Meta])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'fvms-offline'));

  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            // v2 added activityLogs equivalent - handled via createAll in drift
          }
          if (from < 3) {
            // v3 added land_proposals etc - simplified for Flutter F0
          }
        },
      );

  // Helpers
  Future<void> clearAll() async {
    await batch((b) {
      b.deleteAll(schedules);
      b.deleteAll(visitNotes);
      b.deleteAll(visitPhotos);
      b.deleteAll(regions);
      b.deleteAll(outbox);
      b.deleteAll(meta);
    });
  }
}

String regionKey(String entity, String id) => '$entity:$id';

const outboxChangeEvent = 'fvms:outbox';
