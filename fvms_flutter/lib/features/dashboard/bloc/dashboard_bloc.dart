import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/constants/status.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/supabase/scope.dart';
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

abstract class DashboardEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class DashboardLoad extends DashboardEvent {}

abstract class DashboardState extends Equatable {
  @override
  List<Object?> get props => [];
}

class DashboardInitial extends DashboardState {}

class DashboardLoading extends DashboardState {}

class DashboardLoaded extends DashboardState {
  DashboardLoaded(this.data);
  final DashboardData data;
  @override
  List<Object?> get props => [data];
}

class DashboardError extends DashboardState {
  DashboardError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

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
        if (isClosed) return;
        final name = (ctx?.name.isNotEmpty ?? false) ? ctx!.name : (supabase.auth.currentUser?.email ?? 'User');
        final today = todayString();

        final todayQuery = applyScope(
          supabase.from('schedules').select('id, visit_date, status, member_name, block_no'),
          ctx,
        );
        final upcomingQuery = applyScope(
          supabase.from('schedules').select('id, visit_date, status, member_name'),
          ctx,
        );
        final allQuery = applyScope(
          supabase.from('schedules').select('status, visit_date'),
          ctx,
        );
        final todaySchedules = await (todayQuery as dynamic).eq('visit_date', today).limit(10).timeout(const Duration(seconds: 10)) as List;
        if (isClosed) return;
        final upcomingSchedules = await (upcomingQuery as dynamic).gt('visit_date', today).order('visit_date').limit(5).timeout(const Duration(seconds: 10)) as List;
        if (isClosed) return;
        final allSchedules = await (allQuery as dynamic).limit(200).timeout(const Duration(seconds: 10)) as List;
        if (isClosed) return;

        final todayList = todaySchedules.map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleLite(
            id: m['id'] as String,
            visitDate: m['visit_date'] as String,
            status: m['status'] as String,
            memberName: m['member_name'] as String?,
            blockNo: m['block_no'] as String?,
          );
        }).toList();

        final upList = upcomingSchedules.map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleLite(
            id: m['id'] as String,
            visitDate: m['visit_date'] as String,
            status: m['status'] as String,
            memberName: m['member_name'] as String?,
          );
        }).toList();

        var late = 0;
        var completed = 0;
        var pending = 0;
        for (final rm in allSchedules) {
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
        )));
      } on TimeoutException {
        if (!isClosed) emit(DashboardError('Timeout dashboard: cek koneksi internet'));
      } catch (err) {
        if (!isClosed) emit(DashboardError(sanitizeError(err)));
      }
    });
  }
}
