import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/core/supabase/scope.dart';
import 'package:fvms_flutter/features/panen/panen_logic.dart';

class ReportDataLite {
  ReportDataLite({
    required this.total,
    required this.completed,
    required this.pending,
    required this.inProgress,
    required this.gagalPartial,
    required this.gagalTotal,
    required this.late,
    required this.daily,
    required this.byOfficer,
    required this.byKabupaten,
  });
  final int total;
  final int completed;
  final int pending;
  final int inProgress;
  final int gagalPartial;
  final int gagalTotal;
  final int late;
  final Map<String, int> daily;
  final List<OfficerLite> byOfficer;
  final List<RegionCount> byKabupaten;
}

class OfficerLite {
  OfficerLite({required this.name, required this.total, required this.completed, this.inProgress = 0, this.gagalPartial = 0, this.gagalTotal = 0, this.pending = 0});
  final String name;
  final int total;
  final int completed;
  final int inProgress;
  final int gagalPartial;
  final int gagalTotal;
  final int pending;
}

class RegionCount {
  RegionCount({required this.name, required this.total, required this.completed});
  final String name;
  final int total;
  final int completed;
}

class ReportRow {
  ReportRow({
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
  final String? kabupatenName;
  final String? kecamatanName;
  final String? desaName;
  final String? petugasName;
  final String? tglPanen;
  final String? realPanen;
  final String? rencanaPanen;

  String get panenStatus => computePanenStatusString(
    tglPanen: tglPanen,
    realPanen: realPanen,
    rencanaPanen: rencanaPanen,
  );
}

const _selectFields = 'id, visit_date, status, member_name, block_no, no_plot, nis, cgr, document_no, '
    'tgl_tanam, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, label, '
    'tgl_panen, real_panen, rencana_panen, '
    'kabupaten:kabupaten_id(name), kecamatan:kecamatan_id(name), desa:desa_id(name), users:user_id(name)';

abstract class ReportsEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class ReportsLoad extends ReportsEvent {}

class ReportsFilterChanged extends ReportsEvent {
  ReportsFilterChanged({
    this.status,
    this.label,
    this.dateFrom,
    this.dateTo,
    this.blockNo,
    this.cgr,
    this.documentNo,
    this.varietas,
    this.panenStatus,
    this.noPlot,
    this.memberName,
    this.nis,
    this.userId,
    this.kabupatenId,
    this.kecamatanId,
    this.desaId,
  });
  final String? status;
  final String? label;
  final String? dateFrom;
  final String? dateTo;
  final List<String>? blockNo;
  final String? cgr;
  final String? documentNo;
  final String? varietas;
  final String? panenStatus;
  final String? noPlot;
  final String? memberName;
  final String? nis;
  final String? userId;
  final String? kabupatenId;
  final String? kecamatanId;
  final String? desaId;
  @override
  List<Object?> get props => [status, label, dateFrom, dateTo, blockNo, cgr, documentNo, varietas, panenStatus, noPlot, memberName, nis, userId, kabupatenId, kecamatanId, desaId];
}

abstract class ReportsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ReportsInitial extends ReportsState {}

class ReportsLoading extends ReportsState {}

class ReportsLoaded extends ReportsState {
  ReportsLoaded(this.data, {
    this.rows,
    this.distinctCgr = const [],
    this.distinctDocNo = const [],
    this.distinctBlockNo = const [],
    this.distinctNoPlot = const [],
    this.distinctNis = const [],
    this.kabupatens = const [],
    this.kecamatans = const [],
    this.desas = const [],
    this.petugas = const [],
    this.userRole,
  });
  final ReportDataLite data;
  final List<ReportRow>? rows;
  final List<String> distinctCgr;
  final List<String> distinctDocNo;
  final List<String> distinctBlockNo;
  final List<String> distinctNoPlot;
  final List<String> distinctNis;
  final List<Map<String, dynamic>> kabupatens;
  final List<Map<String, dynamic>> kecamatans;
  final List<Map<String, dynamic>> desas;
  final List<Map<String, dynamic>> petugas;
  final UserRole? userRole;
  bool get isPrivileged => userRole == UserRole.admin || userRole == UserRole.qc;
  @override
  List<Object?> get props => [data, rows, distinctCgr, distinctDocNo, distinctBlockNo, distinctNoPlot, distinctNis, kabupatens, kecamatans, desas, petugas, userRole];
}

class ReportsError extends ReportsState {
  ReportsError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

class ReportsBloc extends Bloc<ReportsEvent, ReportsState> {
  ReportsBloc() : super(ReportsInitial()) {
    on<ReportsLoad>((e, emit) async {
      await _load(emit, ReportsFilterChanged());
    });
    on<ReportsFilterChanged>((e, emit) async {
      await _load(emit, e);
    });
  }

  Future<void> _load(Emitter<ReportsState> emit, ReportsFilterChanged filter) async {
    emit(ReportsLoading());
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(ReportsError('Supabase belum siap'));
      return;
    }
    try {
      final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
      if (isClosed) return;

      // Build main query
      dynamic query = applyScope(supabase.from('schedules').select(_selectFields), ctx);
      if (filter.status != null && filter.status!.isNotEmpty) query = query.eq('status', filter.status!);
      if (filter.label != null && filter.label!.isNotEmpty) query = query.eq('label', filter.label!);
      if (filter.dateFrom != null && filter.dateFrom!.isNotEmpty) query = query.gte('visit_date', filter.dateFrom!);
      if (filter.dateTo != null && filter.dateTo!.isNotEmpty) query = query.lte('visit_date', filter.dateTo!);
      if (filter.blockNo != null && filter.blockNo!.isNotEmpty) {
        query = query.inFilter('block_no', filter.blockNo!);
      }
      if (filter.cgr != null && filter.cgr!.isNotEmpty) query = query.eq('cgr', filter.cgr!);
      if (filter.documentNo != null && filter.documentNo!.isNotEmpty) query = query.eq('document_no', filter.documentNo!);
      if (filter.noPlot != null && filter.noPlot!.isNotEmpty) query = query.eq('no_plot', filter.noPlot!);
      if (filter.nis != null && filter.nis!.isNotEmpty) query = query.eq('nis', filter.nis!);
      if (filter.userId != null && filter.userId!.isNotEmpty) query = query.eq('user_id', filter.userId!);
      if (filter.kabupatenId != null && filter.kabupatenId!.isNotEmpty) query = query.eq('kabupaten_id', filter.kabupatenId!);
      if (filter.kecamatanId != null && filter.kecamatanId!.isNotEmpty) query = query.eq('kecamatan_id', filter.kecamatanId!);
      if (filter.desaId != null && filter.desaId!.isNotEmpty) query = query.eq('desa_id', filter.desaId!);
      if (filter.varietas != null && filter.varietas!.isNotEmpty) query = query.ilike('document_no', '%${filter.varietas}%');
      if (filter.memberName != null && filter.memberName!.isNotEmpty) query = query.ilike('member_name', '%${filter.memberName}%');
      if (filter.panenStatus != null && filter.panenStatus!.isNotEmpty) {
        final now = DateTime.now();
        final today = _fmtDate(now);
        switch (filter.panenStatus) {
          case 'sudah_panen':
            query = query.or('tgl_panen.not.is.null,real_panen.not.is.null');
          case 'jatuh_tempo':
            query = query.lt('rencana_panen', today);
            query = query.or('tgl_panen.is.null,real_panen.is.null');
          case 'belum_panen':
            query = query.or('tgl_panen.is.null,real_panen.is.null');
            query = query.or('rencana_panen.is.null,rencana_panen.gte,$today');
        }
      }
      final rows = await query.order('visit_date').limit(500).timeout(const Duration(seconds: 15));
      if (isClosed) return;

      // Fetch distinct values in parallel
      final distinctFuture = _fetchDistinctValues(ctx);
      final regionsFuture = _fetchRegions(ctx);
      final results = await Future.wait([distinctFuture, regionsFuture]);
      if (isClosed) return;

      final distinct = results[0] as _DistinctValues;
      final regions = results[1] as _RegionData;

      final parsedRows = _parseRows(rows as List);
      final data = _computeStats(parsedRows);
      emit(ReportsLoaded(data,
        rows: parsedRows,
        distinctCgr: distinct.cgr,
        distinctDocNo: distinct.docNo,
        distinctBlockNo: distinct.blockNo,
        distinctNoPlot: distinct.noPlot,
        distinctNis: distinct.nis,
        kabupatens: regions.kabupatens,
        kecamatans: regions.kecamatans,
        desas: regions.desas,
        petugas: regions.petugas,
        userRole: ctx?.role,
      ));
    } on TimeoutException {
      if (!isClosed) emit(ReportsError('Timeout laporan: cek koneksi'));
    } catch (err) {
      if (!isClosed) emit(ReportsError(sanitizeError(err)));
    }
  }

  static Future<_DistinctValues> _fetchDistinctValues(AuthContext? ctx) async {
    try {
      final query = applyScope(supabase.from('schedules').select('cgr, document_no, block_no, no_plot, nis'), ctx);
      final rows = await (query as dynamic).limit(1000).timeout(const Duration(seconds: 10)) as List;
      final cgrSet = <String>{};
      final docSet = <String>{};
      final blockSet = <String>{};
      final noPlotSet = <String>{};
      final nisSet = <String>{};
      for (final r in rows) {
        final m = r as Map<String, dynamic>;
        final cgr = m['cgr'] as String?;
        final doc = m['document_no'] as String?;
        final block = m['block_no'] as String?;
        final noPlot = m['no_plot'] as String?;
        final nis = m['nis'] as String?;
        if (cgr != null && cgr.isNotEmpty) cgrSet.add(cgr);
        if (doc != null && doc.isNotEmpty) docSet.add(doc);
        if (block != null && block.isNotEmpty) blockSet.add(block);
        if (noPlot != null && noPlot.isNotEmpty) noPlotSet.add(noPlot);
        if (nis != null && nis.isNotEmpty) nisSet.add(nis);
      }
      return _DistinctValues(
        cgr: cgrSet.toList()..sort(),
        docNo: docSet.toList()..sort(),
        blockNo: blockSet.toList()..sort(),
        noPlot: noPlotSet.toList()..sort(),
        nis: nisSet.toList()..sort(),
      );
    } catch (_) {
      return _DistinctValues(cgr: [], docNo: [], blockNo: [], noPlot: [], nis: []);
    }
  }

  static Future<_RegionData> _fetchRegions(AuthContext? ctx) async {
    try {
      final futures = await Future.wait([
        supabase.from('kabupaten').select('id, name').order('name').timeout(const Duration(seconds: 8)),
        _fetchUsers(ctx),
      ]);
      final kabupatens = (futures[0] as List).cast<Map<String, dynamic>>();
      final petugas = futures[1];
      return _RegionData(kabupatens: kabupatens, kecamatans: [], desas: [], petugas: petugas);
    } catch (_) {
      return _RegionData(kabupatens: [], kecamatans: [], desas: [], petugas: []);
    }
  }

  static Future<List<Map<String, dynamic>>> _fetchUsers(AuthContext? ctx) async {
    try {
      dynamic query = supabase.from('users').select('id, name, role').eq('role', 'produksi').order('name');
      if (ctx != null && ctx.role == UserRole.qc && ctx.assignedKabupatenIds.isNotEmpty) {
        query = query.inFilter('kabupaten_id', ctx.assignedKabupatenIds);
      }
      final rows = await query.timeout(const Duration(seconds: 8));
      return (rows as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static String _fmtDate(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  static ReportDataLite _computeStats(List<ReportRow> rows) {
    var total = 0;
    var completed = 0;
    var pending = 0;
    var inProgress = 0;
    var gagalPartial = 0;
    var gagalTotal = 0;
    var late = 0;
    final now = DateTime.now();
    final today = '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final daily = <String, int>{};
    final offMap = <String, OfficerLite>{};
    final kabMap = <String, RegionCount>{};
    for (final r in rows) {
      total++;
      switch (r.status) {
        case 'completed':
          completed++;
        case 'pending':
          pending++;
        case 'in_progress':
          inProgress++;
        case 'gagal_partial':
          gagalPartial++;
        case 'gagal_total':
          gagalTotal++;
      }
      if (r.visitDate.compareTo(today) < 0 && !['completed', 'gagal_total'].contains(r.status)) late++;
      daily[r.visitDate] = (daily[r.visitDate] ?? 0) + 1;
      final officerName = r.petugasName ?? 'Unknown';
      final ex = offMap[officerName];
      offMap[officerName] = OfficerLite(
        name: officerName,
        total: (ex?.total ?? 0) + 1,
        completed: (ex?.completed ?? 0) + (r.status == 'completed' ? 1 : 0),
        inProgress: (ex?.inProgress ?? 0) + (r.status == 'in_progress' ? 1 : 0),
        gagalPartial: (ex?.gagalPartial ?? 0) + (r.status == 'gagal_partial' ? 1 : 0),
        gagalTotal: (ex?.gagalTotal ?? 0) + (r.status == 'gagal_total' ? 1 : 0),
        pending: (ex?.pending ?? 0) + (r.status == 'pending' ? 1 : 0),
      );
      final kabName = r.kabupatenName ?? 'Unknown';
      final kEx = kabMap[kabName];
      kabMap[kabName] = RegionCount(
        name: kabName,
        total: (kEx?.total ?? 0) + 1,
        completed: (kEx?.completed ?? 0) + (r.status == 'completed' ? 1 : 0),
      );
    }
    return ReportDataLite(
      total: total,
      completed: completed,
      pending: pending,
      inProgress: inProgress,
      gagalPartial: gagalPartial,
      gagalTotal: gagalTotal,
      late: late,
      daily: daily,
      byOfficer: offMap.values.toList()..sort((a, b) => b.total.compareTo(a.total)),
      byKabupaten: kabMap.values.toList()..sort((a, b) => b.total.compareTo(a.total)),
    );
  }

  static List<ReportRow> _parseRows(List rows) {
    return rows.map((r) {
      final m = r as Map<String, dynamic>;
      final kab = m['kabupaten'];
      final kec = m['kecamatan'];
      final des = m['desa'];
      final usr = m['users'];
      return ReportRow(
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

class _DistinctValues {
  _DistinctValues({required this.cgr, required this.docNo, required this.blockNo, required this.noPlot, required this.nis});
  final List<String> cgr;
  final List<String> docNo;
  final List<String> blockNo;
  final List<String> noPlot;
  final List<String> nis;
}

class _RegionData {
  _RegionData({required this.kabupatens, required this.kecamatans, required this.desas, required this.petugas});
  final List<Map<String, dynamic>> kabupatens;
  final List<Map<String, dynamic>> kecamatans;
  final List<Map<String, dynamic>> desas;
  final List<Map<String, dynamic>> petugas;
}
