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
      try {
        final rows = await supabase.from('schedules').select('status, visit_date, users!inner(name)').limit(200);
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
          final users = r['users'] as Map<String, dynamic>?;
          final name = (users?['name'] as String?) ?? 'Unknown';
          final ex = off[name] ?? OfficerLite(name,0,0);
          off[name] = OfficerLite(name, ex.total+1, ex.completed + ((r['status'] as String)=='completed'?1:0));
        }
        emit(ReportsLoaded(ReportDataLite(total: total, completed: completed, pending: pending, late: late, daily: daily, byOfficer: off.values.toList())));
      } catch (err) { emit(ReportsError(err.toString())); }
    });
  }
}
