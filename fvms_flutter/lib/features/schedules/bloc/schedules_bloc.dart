import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/supabase/scope.dart';

class ScheduleItem {
  ScheduleItem({
    required this.id,
    required this.visitDate,
    required this.status,
    this.memberName,
    this.blockNo,
    this.noPlot,
    this.nis,
    this.cgr,
    this.documentNo,
    this.tglTanam,
    this.realTanamHa,
    this.gagalTanam,
    this.sisaDiLahanHa,
    this.label,
    this.detaseling,
    this.kabupatenName,
    this.kecamatanName,
    this.desaName,
    this.petugasName,
    this.tglPanen,
    this.realPanen,
    this.rencanaPanen,
  });
  final String id;
  final String visitDate;
  final String status;
  final String? memberName;
  final String? blockNo;
  final String? noPlot;
  final String? nis;
  final String? cgr;
  final String? documentNo;
  final String? tglTanam;
  final double? realTanamHa;
  final double? gagalTanam;
  final double? sisaDiLahanHa;
  final String? label;
  final String? detaseling;
  final String? kabupatenName;
  final String? kecamatanName;
  final String? desaName;
  final String? petugasName;
  final String? tglPanen;
  final String? realPanen;
  final String? rencanaPanen;

  String get panenStatus {
    final now = DateTime.now();
    final today = '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    if (tglPanen != null && tglPanen!.isNotEmpty) return 'Panen $tglPanen';
    if (rencanaPanen != null && rencanaPanen!.isNotEmpty) {
      if (rencanaPanen!.compareTo(today) < 0) return 'Jatuh Tempo';
      return 'Renc: $rencanaPanen';
    }
    return '—';
  }
}

const _selectFields = 'id, visit_date, status, member_name, block_no, no_plot, nis, cgr, document_no, '
    'tgl_tanam, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, label, detaseling, '
    'tgl_panen, real_panen, rencana_panen, '
    'kabupaten:kabupaten_id(name), kecamatan:kecamatan_id(name), desa:desa_id(name), users:user_id(name)';

class SchedulesFilter {
  const SchedulesFilter({
    this.status,
    this.label,
    this.memberName,
    this.blockNo,
    this.noPlot,
    this.nis,
    this.documentNo,
    this.cgr,
    this.varietas,
    this.kabupatenId,
    this.kecamatanId,
    this.desaId,
    this.dateFrom,
    this.dateTo,
  });
  final String? status;
  final String? label;
  final String? memberName;
  final String? blockNo;
  final String? noPlot;
  final String? nis;
  final String? documentNo;
  final String? cgr;
  final String? varietas;
  final String? kabupatenId;
  final String? kecamatanId;
  final String? desaId;
  final String? dateFrom;
  final String? dateTo;

  bool get isEmpty =>
      status == null &&
      label == null &&
      memberName == null &&
      blockNo == null &&
      noPlot == null &&
      nis == null &&
      documentNo == null &&
      cgr == null &&
      varietas == null &&
      kabupatenId == null &&
      kecamatanId == null &&
      desaId == null &&
      dateFrom == null &&
      dateTo == null;
}

abstract class SchedulesEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class SchedulesLoad extends SchedulesEvent {}

class SchedulesFilterChanged extends SchedulesEvent {
  SchedulesFilterChanged(this.filter);
  final SchedulesFilter filter;
  @override
  List<Object?> get props => [filter];
}

abstract class SchedulesState extends Equatable {
  @override
  List<Object?> get props => [];
}

class SchedulesInitial extends SchedulesState {}

class SchedulesLoading extends SchedulesState {}

class SchedulesLoaded extends SchedulesState {
  SchedulesLoaded(this.items, {this.filter});
  final List<ScheduleItem> items;
  final SchedulesFilter? filter;
  @override
  List<Object?> get props => [items, filter];
}

class SchedulesError extends SchedulesState {
  SchedulesError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

class SchedulesBloc extends Bloc<SchedulesEvent, SchedulesState> {
  SchedulesBloc() : super(SchedulesInitial()) {
    on<SchedulesLoad>((e, emit) async {
      await _load(emit, const SchedulesFilter());
    });
    on<SchedulesFilterChanged>((e, emit) async {
      await _load(emit, e.filter);
    });
  }

  Future<void> _load(Emitter<SchedulesState> emit, SchedulesFilter filter) async {
    emit(SchedulesLoading());
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(SchedulesError('Supabase belum siap'));
      return;
    }
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (isClosed) return;
      dynamic query = applyScope(supabase.from('schedules').select(_selectFields), ctx);
      query = _applyFilter(query, filter);
      final rows = await query.order('visit_date').limit(200).timeout(const Duration(seconds: 15));
      if (isClosed) return;
      final items = _parseRows(rows as List);
      emit(SchedulesLoaded(items, filter: filter));
    } on TimeoutException {
      if (!isClosed) emit(SchedulesError('Timeout memuat jadwal: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(SchedulesError(sanitizeError(err)));
    }
  }

  static dynamic _applyFilter(dynamic query, SchedulesFilter f) {
    var q = query;
    if (f.status != null && f.status!.isNotEmpty) q = q.eq('status', f.status!);
    if (f.label != null && f.label!.isNotEmpty) q = q.eq('label', f.label!);
    if (f.memberName != null && f.memberName!.isNotEmpty) q = q.ilike('member_name', '%${f.memberName}%');
    if (f.blockNo != null && f.blockNo!.isNotEmpty) q = q.ilike('block_no', '%${f.blockNo}%');
    if (f.noPlot != null && f.noPlot!.isNotEmpty) q = q.ilike('no_plot', '%${f.noPlot}%');
    if (f.nis != null && f.nis!.isNotEmpty) q = q.ilike('nis', '%${f.nis}%');
    if (f.documentNo != null && f.documentNo!.isNotEmpty) q = q.ilike('document_no', '%${f.documentNo}%');
    if (f.cgr != null && f.cgr!.isNotEmpty) q = q.ilike('cgr', '%${f.cgr}%');
    if (f.varietas != null && f.varietas!.isNotEmpty) q = q.ilike('document_no', '%${f.varietas}%');
    if (f.kabupatenId != null && f.kabupatenId!.isNotEmpty) q = q.eq('kabupaten_id', f.kabupatenId!);
    if (f.kecamatanId != null && f.kecamatanId!.isNotEmpty) q = q.eq('kecamatan_id', f.kecamatanId!);
    if (f.desaId != null && f.desaId!.isNotEmpty) q = q.eq('desa_id', f.desaId!);
    if (f.dateFrom != null && f.dateFrom!.isNotEmpty) q = q.gte('visit_date', f.dateFrom!);
    if (f.dateTo != null && f.dateTo!.isNotEmpty) q = q.lte('visit_date', f.dateTo!);
    return q;
  }

  static List<ScheduleItem> _parseRows(List rows) {
    return rows.map((r) {
      final m = r as Map<String, dynamic>;
      final kab = m['kabupaten'];
      final kec = m['kecamatan'];
      final des = m['desa'];
      final usr = m['users'];
      return ScheduleItem(
        id: m['id'] as String,
        visitDate: m['visit_date'] as String,
        status: (m['status'] as String?) ?? 'pending',
        memberName: m['member_name'] as String?,
        blockNo: m['block_no'] as String?,
        noPlot: m['no_plot'] as String?,
        nis: m['nis'] as String?,
        cgr: m['cgr'] as String?,
        documentNo: m['document_no'] as String?,
        tglTanam: m['tgl_tanam'] as String?,
        realTanamHa: (m['real_tanam_ha'] as num?)?.toDouble(),
        gagalTanam: (m['gagal_tanam'] as num?)?.toDouble(),
        sisaDiLahanHa: (m['sisa_di_lahan_ha'] as num?)?.toDouble(),
        label: m['label'] as String?,
        detaseling: m['detaseling'] as String?,
        kabupatenName: kab is Map<String, dynamic> ? kab['name'] as String? : null,
        kecamatanName: kec is Map<String, dynamic> ? kec['name'] as String? : null,
        desaName: des is Map<String, dynamic> ? des['name'] as String? : null,
        petugasName: usr is Map<String, dynamic> ? usr['name'] as String? : null,
        tglPanen: m['tgl_panen'] as String?,
        realPanen: m['real_panen'] as String?,
        rencanaPanen: m['rencana_panen'] as String?,
      );
    }).toList();
  }
}
