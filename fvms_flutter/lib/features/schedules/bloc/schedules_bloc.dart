import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/supabase/client.dart';

class ScheduleItem {
  final String id, visitDate, status;
  final String? memberName, blockNo, nis, cgr;
  ScheduleItem({required this.id, required this.visitDate, required this.status, this.memberName, this.blockNo, this.nis, this.cgr});
}

abstract class SchedulesEvent extends Equatable { @override List<Object?> get props => []; }
class SchedulesLoad extends SchedulesEvent {}
class SchedulesFilterChanged extends SchedulesEvent { final String? status; SchedulesFilterChanged(this.status); @override List<Object?> get props => [status]; }

abstract class SchedulesState extends Equatable { @override List<Object?> get props => []; }
class SchedulesInitial extends SchedulesState {}
class SchedulesLoading extends SchedulesState {}
class SchedulesLoaded extends SchedulesState { final List<ScheduleItem> items; SchedulesLoaded(this.items); @override List<Object?> get props => [items]; }
class SchedulesError extends SchedulesState { final String message; SchedulesError(this.message); @override List<Object?> get props => [message]; }

class SchedulesBloc extends Bloc<SchedulesEvent, SchedulesState> {
  SchedulesBloc() : super(SchedulesInitial()) {
    on<SchedulesLoad>((e, emit) async {
      emit(SchedulesLoading());
      try {
        // Offline fallback: if supabase fails, try drift (simplified)
        final rows = await supabase.from('schedules').select('id, visit_date, status, member_name, block_no, nis, cgr').order('visit_date').limit(100);
        final items = (rows as List).map((r) => ScheduleItem(id: r['id'], visitDate: r['visit_date'], status: r['status'], memberName: r['member_name'], blockNo: r['block_no'], nis: r['nis'], cgr: r['cgr'])).toList();
        emit(SchedulesLoaded(items));
      } catch (err) {
        // TODO: loadOffline
        emit(SchedulesError(err.toString()));
      }
    });
  }
}
