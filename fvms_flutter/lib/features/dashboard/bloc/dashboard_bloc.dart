import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/constants/status.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/utils/date.dart';

class DashboardStats {
  DashboardStats({required this.today, required this.late, required this.completed, required this.pending});
  final int today;
  final int late;
  final int completed;
  final int pending;
}

class ScheduleLite {
  ScheduleLite({required this.id, required this.visitDate, required this.status, this.memberName, this.blockNo});
  final String id;
  final String visitDate;
  final String status;
  final String? memberName;
  final String? blockNo;
}

class DashboardData {
  DashboardData({required this.userName, required this.stats, required this.todaySchedules, required this.upcoming});
  final String userName;
  final DashboardStats stats;
  final List<ScheduleLite> todaySchedules;
  final List<ScheduleLite> upcoming;
}

abstract class DashboardEvent extends Equatable { @override List<Object?> get props => []; }
class DashboardLoad extends DashboardEvent {}

abstract class DashboardState extends Equatable { @override List<Object?> get props => []; }
class DashboardInitial extends DashboardState {}
class DashboardLoading extends DashboardState {}
class DashboardLoaded extends DashboardState { DashboardLoaded(this.data); final DashboardData data; @override List<Object?> get props => [data]; }
class DashboardError extends DashboardState { DashboardError(this.message); final String message; @override List<Object?> get props => [message]; }

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  DashboardBloc() : super(DashboardInitial()) {
    on<DashboardLoad>((e, emit) async {
      emit(DashboardLoading());
      if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
        emit(DashboardError('Supabase belum siap'));
        return;
      }
      try {
        final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
        final name = supabase.auth.currentUser?.email ?? ctx?.userId.substring(0, 8) ?? 'User';
        final today = todayString();

        // today schedules - select() dulu baru filter/eq
        final todayQuery = _applyScope(
          supabase.from('schedules').select('id, visit_date, status, member_name, block_no'),
          ctx,
        ).eq('visit_date', today);
        final rows = await todayQuery.limit(10).timeout(const Duration(seconds: 10));
        final todayList = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleLite(id: m['id'] as String, visitDate: m['visit_date'] as String, status: m['status'] as String, memberName: m['member_name'] as String?, blockNo: m['block_no'] as String?);
        }).toList();

        // upcoming
        final upQuery = _applyScope(
          supabase.from('schedules').select('id, visit_date, status, member_name'),
          ctx,
        ).gt('visit_date', today).order('visit_date');
        final up = await upQuery.limit(5).timeout(const Duration(seconds: 10));
        final upList = (up as List).map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleLite(id: m['id'] as String, visitDate: m['visit_date'] as String, status: m['status'] as String, memberName: m['member_name'] as String?);
        }).toList();

        // stats
        final allQuery = _applyScope(
          supabase.from('schedules').select('status, visit_date'),
          ctx,
        );
        final all = await allQuery.limit(200).timeout(const Duration(seconds: 10));
        var late = 0;
        var completed = 0;
        var pending = 0;
        for (final rm in (all as List)) {
          final r = rm as Map<String, dynamic>;
          if (r['status'] as String == VisitStatus.completed.value) completed++;
          if (r['status'] as String == VisitStatus.pending.value) pending++;
          if ((r['visit_date'] as String).compareTo(today) < 0 && ![VisitStatus.completed.value, VisitStatus.gagalTotal.value].contains(r['status'] as String)) late++;
        }

        emit(DashboardLoaded(DashboardData(
          userName: name,
          stats: DashboardStats(today: todayList.length, late: late, completed: completed, pending: pending),
          todaySchedules: todayList,
          upcoming: upList,
        ),),);
      } on TimeoutException {
        emit(DashboardError('Timeout dashboard: cek koneksi internet'));
      } catch (err) {
        final m = err.toString();
        if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
          emit(DashboardError('Supabase belum siap (LateInit): restart app'));
        } else {
          emit(DashboardError(m.replaceFirst('Exception: ', '')));
        }
      }
    });
  }

  /// Apply role scope to PostgrestSelectQueryBuilder (sudah select, punya .filter/.eq)
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
