import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/supabase/client.dart';
import '../../../core/utils/date.dart';
import '../../../core/constants/status.dart';

class DashboardStats {
  final int today, late, completed, pending;
  DashboardStats({required this.today, required this.late, required this.completed, required this.pending});
}

class ScheduleLite {
  final String id, visitDate, status;
  final String? memberName, blockNo;
  ScheduleLite({required this.id, required this.visitDate, required this.status, this.memberName, this.blockNo});
}

class DashboardData {
  final String userName;
  final DashboardStats stats;
  final List<ScheduleLite> todaySchedules;
  final List<ScheduleLite> upcoming;
  DashboardData({required this.userName, required this.stats, required this.todaySchedules, required this.upcoming});
}

abstract class DashboardEvent extends Equatable { @override List<Object?> get props => []; }
class DashboardLoad extends DashboardEvent {}

abstract class DashboardState extends Equatable { @override List<Object?> get props => []; }
class DashboardInitial extends DashboardState {}
class DashboardLoading extends DashboardState {}
class DashboardLoaded extends DashboardState { final DashboardData data; DashboardLoaded(this.data); @override List<Object?> get props => [data]; }
class DashboardError extends DashboardState { final String message; DashboardError(this.message); @override List<Object?> get props => [message]; }

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  DashboardBloc() : super(DashboardInitial()) {
    on<DashboardLoad>((e, emit) async {
      emit(DashboardLoading());
      try {
        final ctx = await getAuthContext();
        final name = supabase.auth.currentUser?.email ?? ctx?.userId.substring(0, 8) ?? 'User';
        final today = todayString();
        // fetch today schedules (simplified, full filter in F2)
        final rows = await supabase.from('schedules').select('id, visit_date, status, member_name, block_no').eq('visit_date', today).limit(10);
        final todayList = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleLite(id: m['id'] as String, visitDate: m['visit_date'] as String, status: m['status'] as String, memberName: m['member_name'] as String?, blockNo: m['block_no'] as String?);
        }).toList();

        // upcoming
        final up = await supabase.from('schedules').select('id, visit_date, status, member_name').gt('visit_date', today).order('visit_date').limit(5);
        final upList = (up as List).map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleLite(id: m['id'] as String, visitDate: m['visit_date'] as String, status: m['status'] as String, memberName: m['member_name'] as String?);
        }).toList();

        // stats simple
        final all = await supabase.from('schedules').select('status, visit_date');
        int late = 0, completed = 0, pending = 0;
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
        )));
      } catch (err) {
        emit(DashboardError(err.toString()));
      }
    });
  }
}
