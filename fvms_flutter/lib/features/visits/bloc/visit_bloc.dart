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
    try {
      final row = await supabase.from('schedules').select('id, visit_date, status, member_name, block_no, nis, cgr, latitude, longitude, visit_photos(id, url, caption), visit_notes(observation, problem, recommend)').eq('id', scheduleId).maybeSingle();
      if (row == null) throw Exception('Jadwal tidak ditemukan');
      final rowMap = row;
      final photosRaw = rowMap['visit_photos'] as List? ?? [];
      final photos = photosRaw.map((p) {
        final m = p as Map<String, dynamic>;
        return VisitPhotoLite(id: m['id'] as String, url: (m['url'] as String?) ?? '', caption: m['caption'] as String?);
      }).toList();
      final notesRaw = rowMap['visit_notes'] as List? ?? [];
      final vn = notesRaw.isNotEmpty ? notesRaw.first as Map<String, dynamic> : null;
      emit(VisitLoaded(VisitDetail(
        id: rowMap['id'] as String, visitDate: rowMap['visit_date'] as String, status: rowMap['status'] as String,
        memberName: rowMap['member_name'] as String?, blockNo: rowMap['block_no'] as String?, nis: rowMap['nis'] as String?, cgr: rowMap['cgr'] as String?,
        latitude: (rowMap['latitude'] as num?)?.toDouble(), longitude: (rowMap['longitude'] as num?)?.toDouble(),
        photos: photos,
        notesField: {'observation': vn?['observation'] as String?, 'problem': vn?['problem'] as String?, 'recommend': vn?['recommend'] as String?},
      ),),);
    } catch (err) { emit(VisitError(err.toString())); }
  }

  Future<void> _saveNotes(VisitNotesSaved e, Emitter<VisitState> emit) async {
    try {
      await supabase.from('visit_notes').upsert({'schedule_id': scheduleId, ...e.payload});
      add(VisitLoad());
    } catch (err) { emit(VisitError(err.toString())); }
  }

  Future<void> _gps(VisitGpsCaptured e, Emitter<VisitState> emit) async {
    try {
      await supabase.from('schedules').update({'latitude': e.lat, 'longitude': e.lng, 'accuracy': e.acc}).eq('id', scheduleId);
      add(VisitLoad());
    } catch (err) { emit(VisitError(err.toString())); }
  }

  Future<void> _status(VisitStatusChanged e, Emitter<VisitState> emit) async {
    try {
      await supabase.from('schedules').update({'status': e.status}).eq('id', scheduleId);
      add(VisitLoad());
    } catch (err) { emit(VisitError(err.toString())); }
  }
}
