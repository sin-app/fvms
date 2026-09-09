import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/offline/db.dart';
import 'package:fvms_flutter/core/offline/engine.dart';
import 'package:fvms_flutter/core/supabase/client.dart';

enum SyncStatus { online, offline, syncing }

class SyncState extends Equatable {
  const SyncState({required this.status, this.pending = 0, this.lastSyncAt, this.lastError});
  final SyncStatus status;
  final int pending;
  final String? lastSyncAt;
  final String? lastError;
  bool get online => status != SyncStatus.offline;
  @override List<Object?> get props => [status, pending, lastSyncAt, lastError];
}

abstract class SyncEvent extends Equatable { @override List<Object?> get props => []; }
class SyncStarted extends SyncEvent {}
class SyncConnectivityChanged extends SyncEvent { SyncConnectivityChanged(this.online); final bool online; @override List<Object?> get props => [online]; }
class SyncRequested extends SyncEvent {}

class SyncBloc extends Bloc<SyncEvent, SyncState> {
  SyncBloc({required this.db}) : super(const SyncState(status: SyncStatus.online)) {
    if (isSupabaseInitialized) {
      try {
        _engine = OfflineEngine(db: db, supabase: supabase);
      } catch (_) {
        _engine = null;
      }
    }
    on<SyncStarted>(_onStarted);
    on<SyncConnectivityChanged>(_onConn);
    on<SyncRequested>(_onSync);
    add(SyncStarted());
  }
  final AppDatabase db;
  OfflineEngine? _engine;

  bool _isOnline(List<ConnectivityResult> results) => !results.contains(ConnectivityResult.none);

  Future<void> _onStarted(SyncStarted e, Emitter<SyncState> emit) async {
    try {
      final conn = await Connectivity().checkConnectivity();
      final online = _isOnline(conn);
      emit(SyncState(status: online ? SyncStatus.online : SyncStatus.offline, pending: state.pending));
      if (online) add(SyncRequested());
      Connectivity().onConnectivityChanged.listen((r) => add(SyncConnectivityChanged(_isOnline(r))));
    } catch (_) {
      emit(const SyncState(status: SyncStatus.online));
    }
  }

  Future<void> _onConn(SyncConnectivityChanged e, Emitter<SyncState> emit) async {
    emit(SyncState(status: e.online ? SyncStatus.online : SyncStatus.offline, pending: state.pending, lastSyncAt: state.lastSyncAt));
    if (e.online) add(SyncRequested());
  }

  Future<void> _onSync(SyncRequested e, Emitter<SyncState> emit) async {
    if (state.status == SyncStatus.offline) return;
    emit(SyncState(status: SyncStatus.syncing, pending: state.pending, lastSyncAt: state.lastSyncAt));
    try {
      _engine ??= isSupabaseInitialized ? OfflineEngine(db: db, supabase: supabase) : null;
      if (_engine == null) throw Exception('Supabase belum siap — sync ditunda');
      await _engine!.pushOutbox();
      await _engine!.hydrateOffline();
      final pending = await db.select(db.outbox).get().then((v) => v.length);
      emit(SyncState(status: SyncStatus.online, pending: pending, lastSyncAt: DateTime.now().toIso8601String()));
    } catch (err) {
      emit(SyncState(status: SyncStatus.online, pending: state.pending, lastError: err.toString()));
    }
  }
}
