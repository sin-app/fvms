import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';

class ScheduleItem {
  ScheduleItem({required this.id, required this.visitDate, required this.status, this.memberName, this.blockNo, this.nis, this.cgr});
  final String id;
  final String visitDate;
  final String status;
  final String? memberName;
  final String? blockNo;
  final String? nis;
  final String? cgr;
}

abstract class SchedulesEvent extends Equatable { @override List<Object?> get props => []; }
class SchedulesLoad extends SchedulesEvent {}
class SchedulesFilterChanged extends SchedulesEvent { SchedulesFilterChanged(this.status); final String? status; @override List<Object?> get props => [status]; }

abstract class SchedulesState extends Equatable { @override List<Object?> get props => []; }
class SchedulesInitial extends SchedulesState {}
class SchedulesLoading extends SchedulesState {}
class SchedulesLoaded extends SchedulesState { SchedulesLoaded(this.items); final List<ScheduleItem> items; @override List<Object?> get props => [items]; }
class SchedulesError extends SchedulesState { SchedulesError(this.message); final String message; @override List<Object?> get props => [message]; }

class SchedulesBloc extends Bloc<SchedulesEvent, SchedulesState> {
  SchedulesBloc() : super(SchedulesInitial()) {
    on<SchedulesLoad>((e, emit) async {
      emit(SchedulesLoading());
      if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
        emit(SchedulesError('Supabase belum siap'));
        return;
      }
      try {
        // Offline fallback: if supabase fails, try drift (simplified)
        final rows = await supabase.from('schedules').select('id, visit_date, status, member_name, block_no, nis, cgr').order('visit_date').limit(100).timeout(const Duration(seconds: 10));
        final items = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleItem(id: m['id'] as String, visitDate: m['visit_date'] as String, status: m['status'] as String, memberName: m['member_name'] as String?, blockNo: m['block_no'] as String?, nis: m['nis'] as String?, cgr: m['cgr'] as String?);
        }).toList();
        emit(SchedulesLoaded(items));
      } catch (err) {
        // TODO: loadOffline
        emit(SchedulesError(err.toString()));
      }
    });
  }
}
