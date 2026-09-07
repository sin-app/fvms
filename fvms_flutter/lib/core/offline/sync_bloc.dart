import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'db.dart';
import 'engine.dart';
import '../supabase/client.dart';

enum SyncStatus { online, offline, syncing }

class SyncState extends Equatable {
  final SyncStatus status;
  final int pending;
  final String? lastSyncAt;
  final String? lastError;
  const SyncState({required this.status, this.pending = 0, this.lastSyncAt, this.lastError});
  bool get online => status != SyncStatus.offline;
  @override List<Object?> get props => [status, pending, lastSyncAt, lastError];
}

abstract class SyncEvent extends Equatable { @override List<Object?> get props => []; }
class SyncStarted extends SyncEvent {}
class SyncConnectivityChanged extends SyncEvent { final bool online; SyncConnectivityChanged(this.online); @override List<Object?> get props => [online]; }
class SyncRequested extends SyncEvent {}

class SyncBloc extends Bloc<SyncEvent, SyncState> {
  final AppDatabase db;
  late final OfflineEngine _engine;
  SyncBloc({required this.db}) : super(const SyncState(status: SyncStatus.online)) {
    _engine = OfflineEngine(db: db, supabase: supabase);
    on<SyncStarted>(_onStarted);
    on<SyncConnectivityChanged>(_onConn);
    on<SyncRequested>(_onSync);
    add(SyncStarted());
  }

  Future<void> _onStarted(SyncStarted e, Emitter<SyncState> emit) async {
    final conn = await Connectivity().checkConnectivity();
    final online = !conn.contains(ConnectivityResult.none);
    emit(SyncState(status: online ? SyncStatus.online : SyncStatus.offline, pending: state.pending));
    if (online) add(SyncRequested());
    Connectivity().onConnectivityChanged.listen((r) => add(SyncConnectivityChanged(!r.contains(ConnectivityResult.none))));
  }

  Future<void> _onConn(SyncConnectivityChanged e, Emitter<SyncState> emit) async {
    emit(SyncState(status: e.online ? SyncStatus.online : SyncStatus.offline, pending: state.pending, lastSyncAt: state.lastSyncAt));
    if (e.online) add(SyncRequested());
  }

  Future<void> _onSync(SyncRequested e, Emitter<SyncState> emit) async {
    if (state.status == SyncStatus.offline) return;
    emit(SyncState(status: SyncStatus.syncing, pending: state.pending, lastSyncAt: state.lastSyncAt));
    try {
      await _engine.pushOutbox();
      await _engine.hydrateOffline();
      final pending = await db.select(db.outbox).get().then((v) => v.length);
      emit(SyncState(status: SyncStatus.online, pending: pending, lastSyncAt: DateTime.now().toIso8601String()));
    } catch (err) {
      emit(SyncState(status: SyncStatus.online, pending: state.pending, lastError: err.toString()));
    }
  }
}
