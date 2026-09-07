import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/supabase/client.dart';
import '../../../core/utils/date.dart';

class ReportDataLite {
  final int total, completed, pending, late;
  final Map<String,int> daily;
  final List<OfficerLite> byOfficer;
  ReportDataLite({required this.total, required this.completed, required this.pending, required this.late, required this.daily, required this.byOfficer});
}
class OfficerLite { final String name; final int total, completed; OfficerLite(this.name, this.total, this.completed); }

abstract class ReportsEvent extends Equatable { @override List<Object?> get props => []; }
class ReportsLoad extends ReportsEvent {}
class ReportsFilterChanged extends ReportsEvent { final String? member; ReportsFilterChanged({this.member}); @override List<Object?> get props => [member]; }

abstract class ReportsState extends Equatable { @override List<Object?> get props => []; }
class ReportsInitial extends ReportsState {}
class ReportsLoading extends ReportsState {}
class ReportsLoaded extends ReportsState { final ReportDataLite data; ReportsLoaded(this.data); @override List<Object?> get props => [data]; }
class ReportsError extends ReportsState { final String message; ReportsError(this.message); @override List<Object?> get props => [message]; }

class ReportsBloc extends Bloc<ReportsEvent, ReportsState> {
  ReportsBloc() : super(ReportsInitial()) {
    on<ReportsLoad>((e, emit) async {
      emit(ReportsLoading());
      try {
        final rows = await supabase.from('schedules').select('status, visit_date, users!inner(name)').limit(200);
        int total = 0, completed = 0, pending = 0, late = 0;
        final today = todayString();
        final Map<String,int> daily = {};
        final Map<String, OfficerLite> off = {};
        for (final r in (rows as List)) {
          total++;
          if (r['status'] == 'completed') completed++;
          if (r['status'] == 'pending') pending++;
          if (r['visit_date'] < today && !['completed','gagal_total'].contains(r['status'])) late++;
          daily[r['visit_date']] = (daily[r['visit_date']] ?? 0) + 1;
          final name = r['users']?['name'] ?? 'Unknown';
          final ex = off[name] ?? OfficerLite(name,0,0);
          off[name] = OfficerLite(name, ex.total+1, ex.completed + (r['status']=='completed'?1:0));
        }
        emit(ReportsLoaded(ReportDataLite(total: total, completed: completed, pending: pending, late: late, daily: daily, byOfficer: off.values.toList())));
      } catch (err) { emit(ReportsError(err.toString())); }
    });
  }
}
