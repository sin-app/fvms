import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/utils/date.dart';

class ReportDataLite {
  ReportDataLite({required this.total, required this.completed, required this.pending, required this.late, required this.daily, required this.byOfficer});
  final int total;
  final int completed;
  final int pending;
  final int late;
  final Map<String,int> daily;
  final List<OfficerLite> byOfficer;
}
class OfficerLite { OfficerLite(this.name, this.total, this.completed); final String name; final int total;
final int completed; }

abstract class ReportsEvent extends Equatable { @override List<Object?> get props => []; }
class ReportsLoad extends ReportsEvent {}
class ReportsFilterChanged extends ReportsEvent { ReportsFilterChanged({this.member}); final String? member; @override List<Object?> get props => [member]; }

abstract class ReportsState extends Equatable { @override List<Object?> get props => []; }
class ReportsInitial extends ReportsState {}
class ReportsLoading extends ReportsState {}
class ReportsLoaded extends ReportsState { ReportsLoaded(this.data); final ReportDataLite data; @override List<Object?> get props => [data]; }
class ReportsError extends ReportsState { ReportsError(this.message); final String message; @override List<Object?> get props => [message]; }

class ReportsBloc extends Bloc<ReportsEvent, ReportsState> {
  ReportsBloc() : super(ReportsInitial()) {
    on<ReportsLoad>((e, emit) async {
      emit(ReportsLoading());
      if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
        emit(ReportsError('Supabase belum siap'));
        return;
      }
      try {
        final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
        final query = _applyScope(supabase.from('schedules').select('status, visit_date, user_id'), ctx);
        final rows = await query.limit(200).timeout(const Duration(seconds: 10));
        var total = 0;
        var completed = 0;
        var pending = 0;
        var late = 0;
        final today = todayString();
        final daily = <String,int>{};
        final off = <String, OfficerLite>{};
        for (final rm in (rows as List)) {
          final r = rm as Map<String, dynamic>;
          total++;
          if (r['status'] as String == 'completed') completed++;
          if (r['status'] as String == 'pending') pending++;
          if ((r['visit_date'] as String).compareTo(today) < 0 && !['completed','gagal_total'].contains(r['status'] as String)) late++;
          final visitDate = r['visit_date'] as String;
          daily[visitDate] = (daily[visitDate] ?? 0) + 1;
          final name = (r['user_id'] as String?) ?? 'Unknown';
          final ex = off[name] ?? OfficerLite(name,0,0);
          off[name] = OfficerLite(name, ex.total+1, ex.completed + ((r['status'] as String)=='completed'?1:0));
        }
        emit(ReportsLoaded(ReportDataLite(total: total, completed: completed, pending: pending, late: late, daily: daily, byOfficer: off.values.toList())));
      } on TimeoutException {
        emit(ReportsError('Timeout laporan: cek koneksi (10s)'));
      } catch (err) {
        final m = err.toString();
        if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
          emit(ReportsError('Supabase belum siap (LateInit): restart app'));
        } else {
          emit(ReportsError(m.replaceFirst('Exception: ', '')));
        }
      }
    });
    on<ReportsFilterChanged>((e, emit) async {
      emit(ReportsLoading());
      if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
        emit(ReportsError('Supabase belum siap'));
        return;
      }
      try {
        final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
        var query = _applyScope(supabase.from('schedules').select('status, visit_date, member_name, user_id'), ctx);
        if (e.member != null && e.member!.trim().isNotEmpty) {
          query = query.ilike('member_name', '%${e.member!.trim()}%');
        }
        final rows = await query.limit(200).timeout(const Duration(seconds: 10));
        var total = 0;
        var completed = 0;
        var pending = 0;
        var late = 0;
        final today = todayString();
        final daily = <String, int>{};
        final off = <String, OfficerLite>{};
        for (final rm in (rows as List)) {
          final r = rm as Map<String, dynamic>;
          total++;
          if (r['status'] as String == 'completed') completed++;
          if (r['status'] as String == 'pending') pending++;
          if ((r['visit_date'] as String).compareTo(today) < 0 && !['completed', 'gagal_total'].contains(r['status'] as String)) late++;
          final visitDate = r['visit_date'] as String;
          daily[visitDate] = (daily[visitDate] ?? 0) + 1;
          final name = (r['user_id'] as String?) ?? 'Unknown';
          final ex = off[name] ?? OfficerLite(name, 0, 0);
          off[name] = OfficerLite(name, ex.total + 1, ex.completed + ((r['status'] as String) == 'completed' ? 1 : 0));
        }
        emit(ReportsLoaded(ReportDataLite(total: total, completed: completed, pending: pending, late: late, daily: daily, byOfficer: off.values.toList())));
      } on TimeoutException {
        emit(ReportsError('Timeout filter laporan: cek koneksi (10s)'));
      } catch (err) {
        final m = err.toString();
        if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
          emit(ReportsError('Supabase belum siap (LateInit): restart app'));
        } else {
          emit(ReportsError(m.replaceFirst('Exception: ', '')));
        }
      }
    });
  }

  static dynamic _applyScope(dynamic query, AuthContext? ctx) {
    if (ctx == null) return query;
    if (ctx.role == UserRole.produksi) return query.eq('user_id', ctx.userId);
    if (ctx.role == UserRole.qc) {
      final scope = qcKabupatenScope(ctx);
      if (scope != null) {
        if (scope.isEmpty) return query.eq('kabupaten_id', '__none__');
        return query.filter('kabupaten_id', 'in', '(${scope.map((e) => '"$e"').join(',')})');
      }
    }
    return query;
  }
}
