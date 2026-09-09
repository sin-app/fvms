import 'dart:async';

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
        final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
        dynamic query = supabase.from('schedules');
        if (ctx != null) {
          if (ctx.role == UserRole.produksi) {
            query = query.eq('user_id', ctx.userId);
          } else if (ctx.role == UserRole.qc) {
            final scope = qcKabupatenScope(ctx);
            if (scope != null) {
              if (scope.isEmpty) {
                query = query.eq('kabupaten_id', '__none__');
              } else {
                query = query.filter('kabupaten_id', 'in', '(${scope.map((e) => '"$e"').join(',')})');
              }
            }
          }
        }
        final rows = await query.select('id, visit_date, status, member_name, block_no, nis, cgr').order('visit_date').limit(100).timeout(const Duration(seconds: 10));
        final items = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleItem(id: m['id'] as String, visitDate: m['visit_date'] as String, status: m['status'] as String, memberName: m['member_name'] as String?, blockNo: m['block_no'] as String?, nis: m['nis'] as String?, cgr: m['cgr'] as String?);
        }).toList();
        emit(SchedulesLoaded(items));
      } on TimeoutException {
        emit(SchedulesError('Timeout memuat jadwal: cek koneksi (10s)'));
      } catch (err) {
        final m = err.toString();
        if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
          emit(SchedulesError('Supabase belum siap (LateInit): restart app'));
        } else {
          emit(SchedulesError(m.replaceFirst('Exception: ', '')));
        }
      }
    });
    on<SchedulesFilterChanged>((e, emit) async {
      emit(SchedulesLoading());
      if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
        emit(SchedulesError('Supabase belum siap'));
        return;
      }
      try {
        final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
        dynamic query = supabase.from('schedules');
        if (e.status != null && e.status!.isNotEmpty) {
          query = query.eq('status', e.status!);
        }
        if (ctx != null) {
          if (ctx.role == UserRole.produksi) {
            query = query.eq('user_id', ctx.userId);
          } else if (ctx.role == UserRole.qc) {
            final scope = qcKabupatenScope(ctx);
            if (scope != null) {
              if (scope.isEmpty) {
                query = query.eq('kabupaten_id', '__none__');
              } else {
                query = query.filter('kabupaten_id', 'in', '(${scope.map((e) => '"$e"').join(',')})');
              }
            }
          }
        }
        final rows = await query.select('id, visit_date, status, member_name, block_no, nis, cgr').order('visit_date').limit(100).timeout(const Duration(seconds: 10));
        final items = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return ScheduleItem(id: m['id'] as String, visitDate: m['visit_date'] as String, status: m['status'] as String, memberName: m['member_name'] as String?, blockNo: m['block_no'] as String?, nis: m['nis'] as String?, cgr: m['cgr'] as String?);
        }).toList();
        emit(SchedulesLoaded(items));
      } on TimeoutException {
        emit(SchedulesError('Timeout filter jadwal: cek koneksi (10s)'));
      } catch (err) {
        final m = err.toString();
        if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
          emit(SchedulesError('Supabase belum siap (LateInit): restart app'));
        } else {
          emit(SchedulesError(m.replaceFirst('Exception: ', '')));
        }
      }
    });
  }
}
