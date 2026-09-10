import 'dart:async';
import 'dart:io';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/constants/app_constants.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/supabase/scope.dart';
import 'package:path/path.dart' as p;

class VisitPhotoLite {
  VisitPhotoLite({required this.id, required this.url, this.caption});
  final String id;
  final String url;
  final String? caption;
}

class VisitDetail {
  VisitDetail({
    required this.id,
    required this.status,
    required this.visitDate,
    required this.photos,
    required this.notesField,
    this.memberName,
    this.blockNo,
    this.nis,
    this.cgr,
    this.latitude,
    this.longitude,
    this.label,
  });
  final String id;
  final String status;
  final String visitDate;
  final String? memberName;
  final String? blockNo;
  final String? nis;
  final String? cgr;
  final double? latitude;
  final double? longitude;
  final String? label;
  final List<VisitPhotoLite> photos;
  final Map<String, String?> notesField;
}

abstract class VisitEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class VisitLoad extends VisitEvent {}

class VisitNotesSaved extends VisitEvent {
  VisitNotesSaved(this.payload);
  final Map<String, String> payload;
  @override
  List<Object?> get props => [payload];
}

class VisitGpsCaptured extends VisitEvent {
  VisitGpsCaptured(this.lat, this.lng, this.acc);
  final double lat;
  final double lng;
  final double acc;
  @override
  List<Object?> get props => [lat, lng, acc];
}

class VisitStatusChanged extends VisitEvent {
  VisitStatusChanged(this.status);
  final String status;
  @override
  List<Object?> get props => [status];
}

class VisitPhotoUploaded extends VisitEvent {
  VisitPhotoUploaded(this.filePath);
  final String filePath;
  @override
  List<Object?> get props => [filePath];
}

class VisitLabelChanged extends VisitEvent {
  VisitLabelChanged(this.label);
  final String? label;
  @override
  List<Object?> get props => [label];
}

abstract class VisitState extends Equatable {
  @override
  List<Object?> get props => [];
}

class VisitInitial extends VisitState {}

class VisitLoading extends VisitState {}

class VisitLoaded extends VisitState {
  VisitLoaded(this.data);
  final VisitDetail data;
  @override
  List<Object?> get props => [data];
}

class VisitUploading extends VisitState {
  VisitUploading(this.data);
  final VisitDetail data;
  @override
  List<Object?> get props => [data];
}

class VisitError extends VisitState {
  VisitError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

class VisitBloc extends Bloc<VisitEvent, VisitState> {
  VisitBloc({required this.scheduleId}) : super(VisitInitial()) {
    on<VisitLoad>(_load);
    on<VisitNotesSaved>(_saveNotes);
    on<VisitGpsCaptured>(_gps);
    on<VisitStatusChanged>(_status);
    on<VisitPhotoUploaded>(_uploadPhoto);
    on<VisitLabelChanged>(_label);
  }
  final String scheduleId;

  Future<void> _load(VisitLoad e, Emitter<VisitState> emit) async {
    emit(VisitLoading());
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(VisitError('Supabase belum siap'));
      return;
    }
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (isClosed) return;
      final row = await supabase
          .from('schedules')
          .select('id, visit_date, status, member_name, block_no, nis, cgr, latitude, longitude, user_id, kabupaten_id, label')
          .eq('id', scheduleId)
          .maybeSingle()
          .timeout(const Duration(seconds: 10));
      if (isClosed) return;
      if (row == null) throw Exception('Jadwal tidak ditemukan');
      if (ctx != null) {
        final rowUserId = row['user_id'] as String?;
        final rowKabId = row['kabupaten_id'] as String?;
        if (ctx.role == UserRole.produksi && rowUserId != ctx.userId) {
          throw Exception('Tidak memiliki akses');
        }
        if (ctx.role == UserRole.qc) {
          final scope = qcKabupatenScope(ctx);
          if (scope != null && (rowKabId == null || !scope.contains(rowKabId))) {
            throw Exception('Tidak memiliki akses');
          }
        }
      }

      final results = await Future.wait([
        supabase.from('visit_photos').select('id, url, caption').eq('schedule_id', scheduleId).order('created_at').timeout(const Duration(seconds: 8)),
        supabase.from('visit_notes').select('observation, problem, recommend').eq('schedule_id', scheduleId).maybeSingle().timeout(const Duration(seconds: 8)),
      ]);
      if (isClosed) return;
      final photosRaw = results[0] as List? ?? [];
      final notesRaw = results[1] as Map<String, dynamic>? ?? {};
      final photos = <VisitPhotoLite>[];
      for (final p in photosRaw) {
        final m = p as Map<String, dynamic>;
        final storedUrl = (m['url'] as String?) ?? '';
        var displayUrl = storedUrl;
        if (storedUrl.isNotEmpty && !storedUrl.contains('?')) {
          try {
            final signed = await supabase.storage.from(AppConstants.storageBucketVisitPhotos).createSignedUrl(storedUrl, 3600);
            displayUrl = signed;
          } catch (_) {
            displayUrl = '';
          }
        }
        if (!isClosed) {
          photos.add(VisitPhotoLite(id: m['id'] as String, url: displayUrl, caption: m['caption'] as String?));
        }
      }

      emit(VisitLoaded(VisitDetail(
        id: row['id'] as String,
        visitDate: row['visit_date'] as String,
        status: row['status'] as String,
        memberName: row['member_name'] as String?,
        blockNo: row['block_no'] as String?,
        nis: row['nis'] as String?,
        cgr: row['cgr'] as String?,
        latitude: (row['latitude'] as num?)?.toDouble(),
        longitude: (row['longitude'] as num?)?.toDouble(),
        label: row['label'] as String?,
        photos: photos,
        notesField: {
          'observation': notesRaw['observation'] as String?,
          'problem': notesRaw['problem'] as String?,
          'recommend': notesRaw['recommend'] as String?,
        },
      )));
    } on TimeoutException {
      if (!isClosed) emit(VisitError('Timeout memuat visit: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(VisitError(sanitizeError(err)));
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
      if (!isClosed) emit(VisitError('Timeout simpan catatan: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(VisitError(sanitizeError(err)));
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
      if (!isClosed) emit(VisitError('Timeout simpan GPS: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(VisitError(sanitizeError(err)));
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
      if (!isClosed) emit(VisitError('Timeout ubah status: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(VisitError(sanitizeError(err)));
    }
  }

  Future<void> _uploadPhoto(VisitPhotoUploaded e, Emitter<VisitState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(VisitError('Supabase belum siap'));
      return;
    }
    final currentState = state;
    if (currentState is VisitLoaded) {
      emit(VisitUploading(currentState.data));
    }
    try {
      final file = File(e.filePath);
      if (!file.existsSync()) {
        emit(VisitError('File foto tidak ditemukan'));
        return;
      }
      final bytes = await file.length();
      if (bytes > AppConstants.maxPhotoSizeMb * 1024 * 1024) {
        emit(VisitError('Ukuran foto maks ${AppConstants.maxPhotoSizeMb}MB'));
        return;
      }
      final ext = p.extension(e.filePath).replaceFirst('.', '').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].contains(ext)) {
        emit(VisitError('Format foto harus JPG/PNG/WebP'));
        return;
      }
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        emit(VisitError('User tidak terautentikasi'));
        return;
      }
      final fileName = '${DateTime.now().millisecondsSinceEpoch}.$ext';
      final storagePath = '$userId/visits/$scheduleId/$fileName';
      await supabase.storage.from(AppConstants.storageBucketVisitPhotos).upload(storagePath, file);
      await supabase.from('visit_photos').upsert({
        'schedule_id': scheduleId,
        'url': storagePath,
        'caption': null,
        'file_size': bytes,
        'mime_type': 'image/$ext',
      }).timeout(const Duration(seconds: 10));
      add(VisitLoad());
    } on TimeoutException {
      if (!isClosed) emit(VisitError('Timeout upload foto: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(VisitError(sanitizeError(err)));
    }
  }

  Future<void> _label(VisitLabelChanged e, Emitter<VisitState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(VisitError('Supabase belum siap'));
      return;
    }
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (ctx == null || (ctx.role != UserRole.admin && ctx.role != UserRole.qc)) {
        emit(VisitError('Hanya admin dan QC yang dapat memberi label'));
        return;
      }
      await supabase.from('schedules').update({'label': e.label}).eq('id', scheduleId).timeout(const Duration(seconds: 10));
      add(VisitLoad());
    } on TimeoutException {
      if (!isClosed) emit(VisitError('Timeout ubah label: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(VisitError(sanitizeError(err)));
    }
  }
}
