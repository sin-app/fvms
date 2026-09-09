import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';

class VisitPhotoLite { VisitPhotoLite({required this.id, required this.url, this.caption}); final String id;
final String url; final String? caption; }

class VisitDetail {
  VisitDetail({required this.id, required this.status, required this.visitDate, required this.photos, required this.notesField, this.memberName, this.blockNo, this.nis, this.cgr, this.latitude, this.longitude});
  final String id;
  final String status;
  final String visitDate;
  final String? memberName;
  final String? blockNo;
  final String? nis;
  final String? cgr;
  final double? latitude;
  final double? longitude;
  final List<VisitPhotoLite> photos;
  final Map<String,String?> notesField;
}

abstract class VisitEvent extends Equatable { @override List<Object?> get props => []; }
class VisitLoad extends VisitEvent {}
class VisitNotesSaved extends VisitEvent { VisitNotesSaved(this.payload); final Map<String,String> payload; @override List<Object?> get props => [payload]; }
class VisitGpsCaptured extends VisitEvent { VisitGpsCaptured(this.lat, this.lng, this.acc); final double lat;
final double lng;
final double acc; @override List<Object?> get props => [lat,lng,acc]; }
class VisitStatusChanged extends VisitEvent { VisitStatusChanged(this.status); final String status; @override List<Object?> get props => [status]; }

abstract class VisitState extends Equatable { @override List<Object?> get props => []; }
class VisitInitial extends VisitState {}
class VisitLoading extends VisitState {}
class VisitLoaded extends VisitState { VisitLoaded(this.data); final VisitDetail data; @override List<Object?> get props => [data]; }
class VisitError extends VisitState { VisitError(this.message); final String message; @override List<Object?> get props => [message]; }

class VisitBloc extends Bloc<VisitEvent, VisitState> {
  VisitBloc({required this.scheduleId}) : super(VisitInitial()) {
    on<VisitLoad>(_load);
    on<VisitNotesSaved>(_saveNotes);
    on<VisitGpsCaptured>(_gps);
    on<VisitStatusChanged>(_status);
  }
  final String scheduleId;

  Future<void> _load(VisitLoad e, Emitter<VisitState> emit) async {
    emit(VisitLoading());
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(VisitError('Supabase belum siap'));
      return;
    }
    try {
      final row = await supabase.from('schedules').select('id, visit_date, status, member_name, block_no, nis, cgr, latitude, longitude, user_id, kabupaten_id').eq('id', scheduleId).maybeSingle().timeout(const Duration(seconds: 10));
      if (row == null) throw Exception('Jadwal tidak ditemukan');
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (ctx != null) {
        final rowUserId = row['user_id'] as String?;
        final rowKabId = row['kabupaten_id'] as String?;
        if (ctx.role == UserRole.produksi && rowUserId != ctx.userId) {
          throw Exception('Tidak memiliki akses ke jadwal ini');
        }
        if (ctx.role == UserRole.qc) {
          final scope = qcKabupatenScope(ctx);
          if (scope != null && (rowKabId == null || !scope.contains(rowKabId))) {
            throw Exception('Tidak memiliki akses ke jadwal ini (QC scope)');
          }
        }
      }

      // Fetch photos separately (avoid join crash)
      final photosRaw = await supabase.from('visit_photos').select('id, url, caption').eq('schedule_id', scheduleId).timeout(const Duration(seconds: 8));
      final photos = (photosRaw as List).map((p) {
        final m = p as Map<String, dynamic>;
        return VisitPhotoLite(id: m['id'] as String, url: (m['url'] as String?) ?? '', caption: m['caption'] as String?);
      }).toList();

      // Fetch notes separately (avoid join crash)
      final notesRaw = await supabase.from('visit_notes').select('observation, problem, recommend').eq('schedule_id', scheduleId).maybeSingle().timeout(const Duration(seconds: 8));
      final vn = notesRaw;

      emit(VisitLoaded(VisitDetail(
        id: row['id'] as String, visitDate: row['visit_date'] as String, status: row['status'] as String,
        memberName: row['member_name'] as String?, blockNo: row['block_no'] as String?, nis: row['nis'] as String?, cgr: row['cgr'] as String?,
        latitude: (row['latitude'] as num?)?.toDouble(), longitude: (row['longitude'] as num?)?.toDouble(),
        photos: photos,
        notesField: {'observation': vn?['observation'] as String?, 'problem': vn?['problem'] as String?, 'recommend': vn?['recommend'] as String?},
      ),),);
    } on TimeoutException {
      emit(VisitError('Timeout memuat visit: cek koneksi (10s)'));
    } catch (err) {
      final m = err.toString();
      if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
        emit(VisitError('Supabase belum siap (LateInit): restart app'));
      } else {
        emit(VisitError(m.replaceFirst('Exception: ', '')));
      }
    }
  }

  Future<void> _saveNotes(VisitNotesSaved e, Emitter<VisitState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(VisitError('Supabase belum siap'));
      return;
    }
    try {
      await supabase.from('visit_notes').upsert({'schedule_id': scheduleId, ...e.payload}).timeout(const Duration(seconds: 10));
      add(VisitLoad());
    } on TimeoutException {
      emit(VisitError('Timeout simpan catatan: cek koneksi (10s)'));
    } catch (err) {
      final m = err.toString();
      if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
        emit(VisitError('Supabase belum siap (LateInit): restart app'));
      } else {
        emit(VisitError(m.replaceFirst('Exception: ', '')));
      }
    }
  }

  Future<void> _gps(VisitGpsCaptured e, Emitter<VisitState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(VisitError('Supabase belum siap'));
      return;
    }
    try {
      await supabase.from('schedules').update({'latitude': e.lat, 'longitude': e.lng, 'accuracy': e.acc}).eq('id', scheduleId).timeout(const Duration(seconds: 10));
      add(VisitLoad());
    } on TimeoutException {
      emit(VisitError('Timeout simpan GPS: cek koneksi (10s)'));
    } catch (err) {
      final m = err.toString();
      if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
        emit(VisitError('Supabase belum siap (LateInit): restart app'));
      } else {
        emit(VisitError(m.replaceFirst('Exception: ', '')));
      }
    }
  }

  Future<void> _status(VisitStatusChanged e, Emitter<VisitState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(VisitError('Supabase belum siap'));
      return;
    }
    try {
      await supabase.from('schedules').update({'status': e.status}).eq('id', scheduleId).timeout(const Duration(seconds: 10));
      add(VisitLoad());
    } on TimeoutException {
      emit(VisitError('Timeout ubah status: cek koneksi (10s)'));
    } catch (err) {
      final m = err.toString();
      if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
        emit(VisitError('Supabase belum siap (LateInit): restart app'));
      } else {
        emit(VisitError(m.replaceFirst('Exception: ', '')));
      }
    }
  }
}
