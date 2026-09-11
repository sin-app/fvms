import 'dart:async';
import 'dart:io';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/constants/app_constants.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/supabase/scope.dart';
import 'package:path/path.dart' as p;

const _selectFields = 'id, status, member_name, block_no, no_plot, document_no, cgr, nis, '
    'ph_tanah, real_tanam_ha, detaseling, tgl_tanam, rencana_panen, notes, '
    'latitude, longitude, accuracy, review_note, created_schedule_id, '
    'kabupaten:kabupaten_id(name), kecamatan:kecamatan_id(name), desa:desa_id(name), '
    'proposed_by_user:proposed_by(name), reviewed_by_user:reviewed_by(name), '
    'land_proposal_photos(id, url, caption, mime_type, file_size)';

class LandProposalItem {
  LandProposalItem({
    required this.id,
    required this.status,
    this.memberName,
    this.blockNo,
    this.noPlot,
    this.documentNo,
    this.cgr,
    this.nis,
    this.phTanam,
    this.realTanamHa,
    this.detaseling,
    this.tglTanam,
    this.rencanaPanen,
    this.notes,
    this.latitude,
    this.longitude,
    this.accuracy,
    this.reviewNote,
    this.createdScheduleId,
    this.kabupatenName,
    this.kecamatanName,
    this.desaName,
    this.proposedByName,
    this.reviewedByName,
    this.photos = const [],
  });

  final String id;
  final String status;
  final String? memberName;
  final String? blockNo;
  final String? noPlot;
  final String? documentNo;
  final String? cgr;
  final String? nis;
  final double? phTanam;
  final double? realTanamHa;
  final String? detaseling;
  final String? tglTanam;
  final String? rencanaPanen;
  final String? notes;
  final double? latitude;
  final double? longitude;
  final double? accuracy;
  final String? reviewNote;
  final String? createdScheduleId;
  final String? kabupatenName;
  final String? kecamatanName;
  final String? desaName;
  final String? proposedByName;
  final String? reviewedByName;
  final List<LandProposalPhoto> photos;
}

class LandProposalPhoto {
  LandProposalPhoto({required this.id, required this.url, this.caption, this.mimeType, this.fileSize});
  final String id;
  final String url;
  final String? caption;
  final String? mimeType;
  final int? fileSize;
}

abstract class LandProposalEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LandProposalsLoad extends LandProposalEvent {}

class LandProposalCreate extends LandProposalEvent {
  LandProposalCreate(this.payload);
  final Map<String, dynamic> payload;
  @override
  List<Object?> get props => [payload];
}

class LandProposalCancel extends LandProposalEvent {
  LandProposalCancel(this.id);
  final String id;
  @override
  List<Object?> get props => [id];
}

class LandProposalApprove extends LandProposalEvent {
  LandProposalApprove(this.id);
  final String id;
  @override
  List<Object?> get props => [id];
}

class LandProposalReject extends LandProposalEvent {
  LandProposalReject(this.id, this.reviewNote);
  final String id;
  final String reviewNote;
  @override
  List<Object?> get props => [id, reviewNote];
}

class LandProposalPhotoUpload extends LandProposalEvent {
  LandProposalPhotoUpload({required this.proposalId, required this.filePath});
  final String proposalId;
  final String filePath;
  @override
  List<Object?> get props => [proposalId, filePath];
}

class LandProposalPhotoDelete extends LandProposalEvent {
  LandProposalPhotoDelete({required this.photoId, required this.proposalId});
  final String photoId;
  final String proposalId;
  @override
  List<Object?> get props => [photoId, proposalId];
}

abstract class LandProposalState extends Equatable {
  @override
  List<Object?> get props => [];
}

class LandProposalsInitial extends LandProposalState {}
class LandProposalsLoading extends LandProposalState {}

class LandProposalsLoaded extends LandProposalState {
  LandProposalsLoaded(this.items);
  final List<LandProposalItem> items;
  @override
  List<Object?> get props => [items];
}

class LandProposalsError extends LandProposalState {
  LandProposalsError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

class LandProposalActionSuccess extends LandProposalState {
  LandProposalActionSuccess(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

class LandProposalBloc extends Bloc<LandProposalEvent, LandProposalState> {
  LandProposalBloc() : super(LandProposalsInitial()) {
    on<LandProposalsLoad>(_load);
    on<LandProposalCreate>(_create);
    on<LandProposalCancel>(_cancel);
    on<LandProposalApprove>(_approve);
    on<LandProposalReject>(_reject);
    on<LandProposalPhotoUpload>(_uploadPhoto);
    on<LandProposalPhotoDelete>(_deletePhoto);
  }

  Future<void> _load(LandProposalsLoad e, Emitter<LandProposalState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(LandProposalsError('Supabase belum siap'));
      return;
    }
    emit(LandProposalsLoading());
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (isClosed) return;
      final query = applyScope(
        supabase.from('land_proposals').select(_selectFields),
        ctx,
      );
      final rows = await (query as dynamic)
          .eq('deleted_at', null)
          .order('created_at', ascending: false)
          .limit(50)
          .timeout(const Duration(seconds: 10)) as List;
      if (isClosed) return;

      final items = rows.map((r) {
        final m = r as Map<String, dynamic>;
        final kn = m['kabupaten'];
        final kc = m['kecamatan'];
        final ds = m['desa'];
        final pb = m['proposed_by_user'];
        final rb = m['reviewed_by_user'];
        final rawPhotos = m['land_proposal_photos'] as List? ?? [];
        return LandProposalItem(
          id: m['id'] as String,
          status: (m['status'] as String?) ?? 'pending',
          memberName: m['member_name'] as String?,
          blockNo: m['block_no'] as String?,
          noPlot: m['no_plot'] as String?,
          documentNo: m['document_no'] as String?,
          cgr: m['cgr'] as String?,
          nis: m['nis'] as String?,
          phTanam: (m['ph_tanam'] as num?)?.toDouble(),
          realTanamHa: (m['real_tanam_ha'] as num?)?.toDouble(),
          detaseling: m['detaseling'] as String?,
          tglTanam: m['tgl_tanam'] as String?,
          rencanaPanen: m['rencana_panen'] as String?,
          notes: m['notes'] as String?,
          latitude: (m['latitude'] as num?)?.toDouble(),
          longitude: (m['longitude'] as num?)?.toDouble(),
          accuracy: (m['accuracy'] as num?)?.toDouble(),
          reviewNote: m['review_note'] as String?,
          createdScheduleId: m['created_schedule_id'] as String?,
          kabupatenName: kn is Map ? kn['name'] as String? : null,
          kecamatanName: kc is Map ? kc['name'] as String? : null,
          desaName: ds is Map ? ds['name'] as String? : null,
          proposedByName: pb is Map ? pb['name'] as String? : null,
          reviewedByName: rb is Map ? rb['name'] as String? : null,
          photos: rawPhotos.map((p) {
            final pm = p as Map<String, dynamic>;
            return LandProposalPhoto(
              id: pm['id'] as String,
              url: (pm['url'] as String?) ?? '',
              caption: pm['caption'] as String?,
              mimeType: pm['mime_type'] as String?,
              fileSize: pm['file_size'] as int?,
            );
          }).toList(),
        );
      }).toList();
      emit(LandProposalsLoaded(items));
    } on TimeoutException {
      if (!isClosed) emit(LandProposalsError('Timeout: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(LandProposalsError(sanitizeError(err)));
    }
  }

  Future<void> _create(LandProposalCreate e, Emitter<LandProposalState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(LandProposalsError('Supabase belum siap'));
      return;
    }
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (ctx == null) {
        emit(LandProposalsError('User tidak terautentikasi'));
        return;
      }
      final payload = Map<String, dynamic>.from(e.payload);
      payload['proposed_by'] = ctx.userId;
      payload['status'] = 'pending';
      await supabase.from('land_proposals').insert(payload).timeout(const Duration(seconds: 10));
      if (isClosed) return;
      add(LandProposalsLoad());
    } on TimeoutException {
      if (!isClosed) emit(LandProposalsError('Timeout: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(LandProposalsError(sanitizeError(err)));
    }
  }

  Future<void> _cancel(LandProposalCancel e, Emitter<LandProposalState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) return;
    try {
      await supabase.from('land_proposals').update({'status': 'cancelled'}).eq('id', e.id).timeout(const Duration(seconds: 10));
      if (isClosed) return;
      add(LandProposalsLoad());
    } catch (err) {
      if (!isClosed) emit(LandProposalsError(sanitizeError(err)));
    }
  }

  Future<void> _approve(LandProposalApprove e, Emitter<LandProposalState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) return;
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (ctx == null || (ctx.role != UserRole.admin && ctx.role != UserRole.qc)) {
        emit(LandProposalsError('Tidak memiliki akses review'));
        return;
      }
      await supabase.from('land_proposals').update({
        'status': 'approved',
        'reviewed_by': ctx.userId,
      }).eq('id', e.id).timeout(const Duration(seconds: 10));
      if (isClosed) return;
      add(LandProposalsLoad());
    } catch (err) {
      if (!isClosed) emit(LandProposalsError(sanitizeError(err)));
    }
  }

  Future<void> _reject(LandProposalReject e, Emitter<LandProposalState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) return;
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (ctx == null || (ctx.role != UserRole.admin && ctx.role != UserRole.qc)) {
        emit(LandProposalsError('Tidak memiliki akses review'));
        return;
      }
      await supabase.from('land_proposals').update({
        'status': 'rejected',
        'reviewed_by': ctx.userId,
        'review_note': e.reviewNote,
      }).eq('id', e.id).timeout(const Duration(seconds: 10));
      if (isClosed) return;
      add(LandProposalsLoad());
    } catch (err) {
      if (!isClosed) emit(LandProposalsError(sanitizeError(err)));
    }
  }

  Future<void> _uploadPhoto(LandProposalPhotoUpload e, Emitter<LandProposalState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) return;
    try {
      final file = File(e.filePath);
      if (!file.existsSync()) {
        emit(LandProposalsError('File foto tidak ditemukan'));
        return;
      }
      final bytes = await file.length();
      if (bytes > AppConstants.maxPhotoSizeMb * 1024 * 1024) {
        emit(LandProposalsError('Ukuran foto maks ${AppConstants.maxPhotoSizeMb}MB'));
        return;
      }
      final ext = p.extension(e.filePath).replaceFirst('.', '').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].contains(ext)) {
        emit(LandProposalsError('Format foto harus JPG/PNG/WebP'));
        return;
      }
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        emit(LandProposalsError('User tidak terautentikasi'));
        return;
      }
      final fileName = '${DateTime.now().millisecondsSinceEpoch}.$ext';
      final storagePath = '$userId/proposals/${e.proposalId}/$fileName';
      await supabase.storage.from('land-proposal-photos').upload(storagePath, file);
      await supabase.from('land_proposal_photos').insert({
        'proposal_id': e.proposalId,
        'url': storagePath,
        'mime_type': 'image/$ext',
        'file_size': bytes,
      }).timeout(const Duration(seconds: 10));
      if (isClosed) return;
      add(LandProposalsLoad());
    } catch (err) {
      if (!isClosed) emit(LandProposalsError(sanitizeError(err)));
    }
  }

  Future<void> _deletePhoto(LandProposalPhotoDelete e, Emitter<LandProposalState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) return;
    try {
      final row = await supabase.from('land_proposal_photos').select('url').eq('id', e.photoId).maybeSingle();
      if (row != null && row['url'] != null) {
        await supabase.storage.from('land-proposal-photos').remove([row['url'] as String]);
      }
      await supabase.from('land_proposal_photos').delete().eq('id', e.photoId).timeout(const Duration(seconds: 10));
      if (isClosed) return;
      add(LandProposalsLoad());
    } catch (err) {
      if (!isClosed) emit(LandProposalsError(sanitizeError(err)));
    }
  }
}
