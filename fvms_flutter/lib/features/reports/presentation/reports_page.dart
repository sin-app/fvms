import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/features/reports/bloc/reports_bloc.dart';
import 'package:fvms_flutter/features/visits/presentation/visit_page.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ReportsBloc()..add(ReportsLoad()),
      child: const ReportsView(),
    );
  }
}

class ReportsView extends StatefulWidget {
  const ReportsView({super.key});
  @override
  State<ReportsView> createState() => _ReportsViewState();
}

class _ReportsViewState extends State<ReportsView> {
  final _varietasCtrl = TextEditingController();
  final _memberNameCtrl = TextEditingController();
  String? _status;
  String? _label;
  String? _datePreset;
  DateTime? _dateFrom;
  DateTime? _dateTo;
  List<String> _blockNo = [];
  String? _cgr;
  String? _documentNo;
  String? _panenStatus;
  String? _noPlot;
  String? _nis;
  String? _userId;
  String? _kabupatenId;
  String? _kecamatanId;
  String? _desaId;
  bool _showTable = false;
  String _prevDistinctHash = '';

  // Region data loaded from DB
  List<Map<String, dynamic>> _kabupatens = [];
  List<Map<String, dynamic>> _kecamatans = [];
  List<Map<String, dynamic>> _desas = [];
  List<Map<String, dynamic>> _petugas = [];

  @override
  void dispose() {
    _varietasCtrl.dispose();
    _memberNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadKecamatan(String kabId) async {
    if (!isSupabaseInitialized) return;
    try {
      final data = await supabase.from('kecamatan').select('id, name').eq('kabupaten_id', kabId).order('name').timeout(const Duration(seconds: 8));
      if (mounted) setState(() => _kecamatans = (data as List).cast<Map<String, dynamic>>());
    } catch (_) {}
  }

  Future<void> _loadDesa(String kecId) async {
    if (!isSupabaseInitialized) return;
    try {
      final data = await supabase.from('desa').select('id, name').eq('kecamatan_id', kecId).order('name').timeout(const Duration(seconds: 8));
      if (mounted) setState(() => _desas = (data as List).cast<Map<String, dynamic>>());
    } catch (_) {}
  }

  void _applyFilter() {
    String? from;
    String? to;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    switch (_datePreset) {
      case 'today':
        from = _fmt(today);
        to = _fmt(today);
      case 'week':
        from = _fmt(today.subtract(Duration(days: now.weekday - 1)));
        to = _fmt(today);
      case 'month':
        from = _fmt(DateTime(now.year, now.month));
        to = _fmt(today);
      case 'custom':
        from = _dateFrom != null ? _fmt(_dateFrom!) : null;
        to = _dateTo != null ? _fmt(_dateTo!) : null;
      default:
        from = null;
        to = null;
    }
    context.read<ReportsBloc>().add(ReportsFilterChanged(
      status: _status,
      label: _label,
      dateFrom: from,
      dateTo: to,
      blockNo: _blockNo.isEmpty ? null : _blockNo,
      cgr: _cgr,
      documentNo: _documentNo,
      varietas: _varietasCtrl.text.isEmpty ? null : _varietasCtrl.text,
      panenStatus: _panenStatus,
      noPlot: _noPlot,
      memberName: _memberNameCtrl.text.isEmpty ? null : _memberNameCtrl.text,
      nis: _nis,
      userId: _userId,
      kabupatenId: _kabupatenId,
      kecamatanId: _kecamatanId,
      desaId: _desaId,
    ));
  }

  String? _fmt(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  void _showMultiSelectDialog(List<String> options, List<String> selected, String title, ValueChanged<List<String>> onConfirm) {
    final tempSelected = List<String>.from(selected);
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(title, style: const TextStyle(fontSize: 16)),
          content: SizedBox(
            width: double.maxFinite,
            height: 300,
            child: ListView.builder(
              itemCount: options.length,
              itemBuilder: (_, i) {
                final opt = options[i];
                final isSelected = tempSelected.contains(opt);
                return CheckboxListTile(
                  value: isSelected,
                  title: Text(opt, style: const TextStyle(fontSize: 13)),
                  dense: true,
                  onChanged: (v) {
                    setDialogState(() {
                      if (v ?? false) {
                        tempSelected.add(opt);
                      } else {
                        tempSelected.remove(opt);
                      }
                    });
                  },
                );
              },
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                onConfirm(tempSelected);
              },
              child: const Text('OK'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Laporan')),
      body: BlocBuilder<ReportsBloc, ReportsState>(
        builder: (c, s) {
          if (s is ReportsInitial || s is ReportsLoading) return const LoadingState();
          if (s is ReportsError) return ErrorState(message: s.message, onRetry: () => c.read<ReportsBloc>().add(ReportsLoad()));
          if (s is ReportsLoaded) {
            final d = s.data;
            final rows = s.rows ?? [];
            // Update region data from state
            if (s.kabupatens.isNotEmpty && _kabupatens.isEmpty) {
              _kabupatens = s.kabupatens;
            }
            if (s.kecamatans.isNotEmpty && _kecamatans.isEmpty) {
              _kecamatans = s.kecamatans;
            }
            if (s.desas.isNotEmpty && _desas.isEmpty) {
              _desas = s.desas;
            }
            if (s.petugas.isNotEmpty && _petugas.isEmpty) {
              _petugas = s.petugas;
            }
            // Reset dropdown values if distinct options changed
            final hash = '${s.distinctCgr.join(',')}${s.distinctDocNo.join(',')}${s.distinctBlockNo.join(',')}${s.distinctNoPlot.join(',')}${s.distinctNis.join(',')}';
            if (hash != _prevDistinctHash) {
              _prevDistinctHash = hash;
              if (_cgr != null && !s.distinctCgr.contains(_cgr)) _cgr = null;
              if (_documentNo != null && !s.distinctDocNo.contains(_documentNo)) _documentNo = null;
              _blockNo = _blockNo.where((b) => s.distinctBlockNo.contains(b)).toList();
              if (_noPlot != null && !s.distinctNoPlot.contains(_noPlot)) _noPlot = null;
              if (_nis != null && !s.distinctNis.contains(_nis)) _nis = null;
            }
            return RefreshIndicator(
              onRefresh: () async => c.read<ReportsBloc>().add(ReportsLoad()),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                children: [
                  _buildFilterCard(s),
                  const SizedBox(height: 12),
                  _kpiGrid(d),
                  const SizedBox(height: 16),
                  _sectionTitle('Status'),
                  const SizedBox(height: 8),
                  _statusChart(d),
                  const SizedBox(height: 16),
                  _sectionTitle('Per Hari'),
                  const SizedBox(height: 8),
                  _dailyChart(d),
                  const SizedBox(height: 16),
                  _sectionTitle('Per Petugas'),
                  const SizedBox(height: 8),
                  _officerList(d),
                  const SizedBox(height: 16),
                  _sectionTitle('Data Detail (${rows.length})'),
                  const SizedBox(height: 8),
                  _buildToggleButton(),
                  if (_showTable && rows.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    _dataTable(rows),
                  ],
                ],
              ),
            );
          }
          return const LoadingState();
        },
      ),
    );
  }

  Widget _buildFilterCard(ReportsState state) {
    final docNoOptions = state is ReportsLoaded ? state.distinctDocNo : <String>[];
    final cgrOptions = state is ReportsLoaded ? state.distinctCgr : <String>[];
    final blockOptions = state is ReportsLoaded ? state.distinctBlockNo : <String>[];
    final noPlotOptions = state is ReportsLoaded ? state.distinctNoPlot : <String>[];
    final nisOptions = state is ReportsLoaded ? state.distinctNis : <String>[];
    final petugasOptions = state is ReportsLoaded ? state.petugas : <Map<String, dynamic>>[];
    final kabOptions = state is ReportsLoaded ? state.kabupatens : <Map<String, dynamic>>[];
    final kecOptions = state is ReportsLoaded ? _kecamatans : <Map<String, dynamic>>[];
    final desaOptions = state is ReportsLoaded ? _desas : <Map<String, dynamic>>[];

    // Determine if user is admin/qc (show petugas filter)
    final isPrivileged = state is ReportsLoaded && state.isPrivileged;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Row 1: Varietas + Nama Member
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _varietasCtrl,
                    decoration: const InputDecoration(hintText: 'Varietas', prefixIcon: Icon(Icons.spa_outlined, size: 20), isDense: true, border: OutlineInputBorder()),
                    onSubmitted: (_) => _applyFilter(),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _memberNameCtrl,
                    decoration: const InputDecoration(hintText: 'Nama Member', prefixIcon: Icon(Icons.person_outline, size: 20), isDense: true, border: OutlineInputBorder()),
                    onSubmitted: (_) => _applyFilter(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Row 2: CGR + Doc No
            Row(
              children: [
                Expanded(child: _smallDropdown('CGR', ['Semua'] + cgrOptions, (v) {
                  _cgr = v == 'Semua' ? null : v;
                })),
                const SizedBox(width: 8),
                Expanded(child: _smallDropdown('Doc No', ['Semua'] + docNoOptions, (v) {
                  _documentNo = v == 'Semua' ? null : v;
                })),
              ],
            ),
            const SizedBox(height: 8),
            // Row 3: Block (multi) + Plot
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _showMultiSelectDialog(blockOptions, _blockNo, 'Pilih Block', (v) => setState(() => _blockNo = v)),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Block',
                        isDense: true,
                        border: OutlineInputBorder(),
                        suffixIcon: Icon(Icons.arrow_drop_down, size: 20),
                      ),
                      child: Text(
                        _blockNo.isEmpty ? 'Semua' : _blockNo.join(', '),
                        style: const TextStyle(fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(child: _smallDropdown('Plot', ['Semua'] + noPlotOptions, (v) {
                  _noPlot = v == 'Semua' ? null : v;
                })),
              ],
            ),
            const SizedBox(height: 8),
            // Row 4: NIS + Status
            Row(
              children: [
                Expanded(child: _smallDropdown('NIS', ['Semua'] + nisOptions, (v) {
                  _nis = v == 'Semua' ? null : v;
                })),
                const SizedBox(width: 8),
                Expanded(child: _smallDropdown('Status', ['Semua', 'Pending', 'In Progress', 'Gagal Partial', 'Completed', 'Gagal Total'], (v) {
                  _status = v == 'Semua' ? null : v?.toLowerCase().replaceAll(' ', '_');
                })),
              ],
            ),
            const SizedBox(height: 8),
            // Row 5: Label + Panen
            Row(
              children: [
                Expanded(child: _smallDropdown('Label', ['Semua', 'Hijau', 'Kuning', 'Merah'], (v) {
                  _label = v == 'Semua' ? null : v?.toLowerCase();
                })),
                const SizedBox(width: 8),
                Expanded(child: _smallDropdown('Panen', ['Semua', 'Sudah Panen', 'Jatuh Tempo', 'Belum Panen'], (v) {
                  _panenStatus = v == 'Semua' ? null : v?.toLowerCase().replaceAll(' ', '_');
                })),
              ],
            ),
            // Row 6: Petugas (admin/qc only)
            if (isPrivileged) ...[
              const SizedBox(height: 8),
              _smallDropdown('Petugas', ['Semua'] + petugasOptions.map<String>((p) => p['name'] as String).toList(), (v) {
                if (v == 'Semua') {
                  _userId = null;
                } else {
                  final match = petugasOptions.firstWhere((p) => p['name'] == v, orElse: () => {});
                  _userId = match['id'] as String?;
                }
              }),
            ],
            // Row 7: Kabupaten
            const SizedBox(height: 8),
            _regionDropdown('Kabupaten', kabOptions, _kabupatenId, (v) {
              setState(() {
                _kabupatenId = v;
                _kecamatanId = null;
                _desaId = null;
                _kecamatans = [];
                _desas = [];
              });
              if (v != null && v.isNotEmpty) _loadKecamatan(v);
            }),
            // Row 8: Kecamatan (conditional)
            if (_kabupatenId != null || kecOptions.isNotEmpty) ...[
              const SizedBox(height: 8),
              _regionDropdown('Kecamatan', kecOptions, _kecamatanId, (v) {
                setState(() {
                  _kecamatanId = v;
                  _desaId = null;
                  _desas = [];
                });
                if (v != null && v.isNotEmpty) _loadDesa(v);
              }),
            ],
            // Row 9: Desa (conditional)
            if (_kecamatanId != null || desaOptions.isNotEmpty) ...[
              const SizedBox(height: 8),
              _regionDropdown('Desa', desaOptions, _desaId, (v) => setState(() => _desaId = v)),
            ],
            // Row 10: Date range
            const SizedBox(height: 8),
            _smallDropdown('Tanggal', ['Semua', 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Kustom'], (v) {
              _datePreset = v == 'Semua' ? null : v?.toLowerCase().replaceAll(' ', '');
            }),
            if (_datePreset == 'custom') ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: _dateBtn('Dari', _dateFrom, (d) => setState(() => _dateFrom = d))),
                  const SizedBox(width: 8),
                  Expanded(child: _dateBtn('Sampai', _dateTo, (d) => setState(() => _dateTo = d))),
                ],
              ),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                icon: const Icon(Icons.search, size: 18),
                label: const Text('Terapkan Filter'),
                onPressed: _applyFilter,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _smallDropdown(String label, List<String> options, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      value: options.first,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 11, color: Colors.grey),
        isDense: true,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(fontSize: 12)))).toList(),
      onChanged: onChanged,
    );
  }

  Widget _regionDropdown(String label, List<Map<String, dynamic>> items, String? value, ValueChanged<String?> onChanged) {
    final allItems = <Map<String, dynamic>>[{'id': '', 'name': 'Semua $label'}, ...items];
    return DropdownButtonFormField<String>(
      value: value ?? '',
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 11, color: Colors.grey),
        isDense: true,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
      items: allItems.map((r) => DropdownMenuItem(value: r['id'] as String, child: Text(r['name'] as String, style: const TextStyle(fontSize: 12)))).toList(),
      onChanged: (v) => onChanged((v?.isEmpty ?? false) ? null : v),
    );
  }

  Widget _dateBtn(String label, DateTime? date, ValueChanged<DateTime> onPicked) {
    return OutlinedButton(
      onPressed: () async {
        final picked = await showDatePicker(context: context, initialDate: date ?? DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime.now().add(const Duration(days: 365)));
        if (picked != null) onPicked(picked);
      },
      child: Text(date != null ? '$label: ${_fmt(date)}' : label, style: const TextStyle(fontSize: 11)),
    );
  }

  Widget _kpiGrid(ReportDataLite d) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.8,
      children: [
        _Kpi('Total', d.total.toString(), Colors.blue),
        _Kpi('Selesai', d.completed.toString(), Colors.green),
        _Kpi('In Progress', d.inProgress.toString(), Colors.purple),
        _Kpi('Gagal Partial', d.gagalPartial.toString(), Colors.orange),
        _Kpi('Gagal Total', d.gagalTotal.toString(), Colors.red),
        _Kpi('Pending', d.pending.toString(), Colors.amber),
        _Kpi('Terlambat', d.late.toString(), Colors.red.shade700),
        _Kpi('Rate', d.total > 0 ? '${(d.completed * 100 / d.total).round()}%' : '—', BrandColors.brand),
      ],
    );
  }

  Widget _statusChart(ReportDataLite d) {
    final items = [
      _PieData('Selesai', d.completed.toDouble(), const Color(0xFF22C55E)),
      _PieData('In Progress', d.inProgress.toDouble(), const Color(0xFF8B5CF6)),
      _PieData('Pending', d.pending.toDouble(), const Color(0xFFF59E0B)),
      _PieData('Gagal Partial', d.gagalPartial.toDouble(), Colors.orange),
      _PieData('Gagal Total', d.gagalTotal.toDouble(), Colors.red),
    ];
    final total = items.fold<double>(0, (s, e) => s + e.value);
    if (total == 0) return const Padding(padding: EdgeInsets.all(12), child: Text('Belum ada data', style: TextStyle(color: Colors.grey)));
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            SizedBox(
              height: 160,
              child: PieChart(PieChartData(
                sections: items.where((i) => i.value > 0).map((i) => PieChartSectionData(
                  value: i.value,
                  color: i.color,
                  title: '${(i.value / total * 100).round()}%',
                  titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                  radius: 60,
                )).toList(),
                sectionsSpace: 2,
                centerSpaceRadius: 20,
              )),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 4,
              children: items.map((i) => Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 10, height: 10, decoration: BoxDecoration(color: i.color, borderRadius: BorderRadius.circular(2))),
                  const SizedBox(width: 4),
                  Text('${i.label} (${i.value.toInt()})', style: const TextStyle(fontSize: 11)),
                ],
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dailyChart(ReportDataLite d) {
    if (d.daily.isEmpty) return const Padding(padding: EdgeInsets.all(12), child: Text('Belum ada data harian', style: TextStyle(color: Colors.grey)));
    final sorted = d.daily.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
    final last7 = sorted.length > 7 ? sorted.sublist(sorted.length - 7) : sorted;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: SizedBox(
          height: 180,
          child: BarChart(BarChartData(
            alignment: BarChartAlignment.spaceAround,
            maxY: last7.fold<double>(0, (m, e) => e.value > m ? e.value.toDouble() : m) * 1.2,
            barTouchData: BarTouchData(
              touchTooltipData: BarTouchTooltipData(
                getTooltipItem: (group, groupIdx, rod, rodIdx) {
                  final date = last7[group.x].key;
                  return BarTooltipItem('${rod.toY.toInt()}\n$date', const TextStyle(color: Colors.white, fontSize: 10));
                },
              ),
            ),
            titlesData: FlTitlesData(
              leftTitles: const AxisTitles(),
              rightTitles: const AxisTitles(),
              topTitles: const AxisTitles(),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (value, meta) {
                    final idx = value.toInt();
                    if (idx < 0 || idx >= last7.length) return const SizedBox.shrink();
                    final parts = last7[idx].key.split('-');
                    return Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('${parts[2]}/${parts[1]}', style: const TextStyle(fontSize: 9, color: Colors.grey)),
                    );
                  },
                ),
              ),
            ),
            gridData: const FlGridData(show: false),
            borderData: FlBorderData(show: false),
            barGroups: last7.asMap().entries.map((e) => BarChartGroupData(
              x: e.key,
              barRods: [BarChartRodData(toY: e.value.value.toDouble(), color: BrandColors.brand, width: 16, borderRadius: BorderRadius.circular(4))],
            )).toList(),
          )),
        ),
      ),
    );
  }

  Widget _officerList(ReportDataLite d) {
    if (d.byOfficer.isEmpty) return const Padding(padding: EdgeInsets.all(12), child: Text('Belum ada data petugas', style: TextStyle(color: Colors.grey)));
    return Card(
      child: Column(
        children: d.byOfficer.map((o) {
          final rate = o.total > 0 ? (o.completed * 100 / o.total).round() : 0;
          return ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 12),
            childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            title: Text(o.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            subtitle: LinearProgressIndicator(
              value: o.total > 0 ? o.completed / o.total : 0,
              backgroundColor: Colors.grey.shade200,
              color: rate >= 80 ? Colors.green : rate >= 50 ? Colors.amber : Colors.red,
              minHeight: 4,
            ),
            trailing: Text('${o.completed}/${o.total} ($rate%)', style: const TextStyle(fontSize: 12)),
            children: [
              _officerStatRow('Selesai', o.completed, Colors.green),
              _officerStatRow('In Progress', o.inProgress, Colors.purple),
              _officerStatRow('Gagal Partial', o.gagalPartial, Colors.orange),
              _officerStatRow('Gagal Total', o.gagalTotal, Colors.red),
              _officerStatRow('Pending', o.pending, Colors.amber),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _officerStatRow(String label, int count, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 12))),
          Text(count.toString(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Widget _buildToggleButton() {
    return OutlinedButton.icon(
      icon: Icon(_showTable ? Icons.visibility_off : Icons.table_chart, size: 16),
      label: Text(_showTable ? 'Sembunyikan Tabel' : 'Lihat Tabel Data'),
      onPressed: () => setState(() => _showTable = !_showTable),
    );
  }

  Widget _dataTable(List<ReportRow> rows) {
    return Card(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columnSpacing: 12,
          headingTextStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
          dataTextStyle: const TextStyle(fontSize: 11),
          columns: const [
            DataColumn(label: Text('Tanggal')),
            DataColumn(label: Text('Kab')),
            DataColumn(label: Text('Petugas')),
            DataColumn(label: Text('CGR')),
            DataColumn(label: Text('Block')),
            DataColumn(label: Text('Plot')),
            DataColumn(label: Text('Member')),
            DataColumn(label: Text('Doc No')),
            DataColumn(label: Text('Tgl Tanam')),
            DataColumn(label: Text('Real')),
            DataColumn(label: Text('Gagal')),
            DataColumn(label: Text('Sisa')),
            DataColumn(label: Text('Status')),
            DataColumn(label: Text('Label')),
            DataColumn(label: Text('Panen')),
          ],
          rows: rows.take(100).map((r) => DataRow(
            onSelectChanged: (_) => Navigator.push<Null>(context, MaterialPageRoute<Null>(builder: (_) => VisitPage(id: r.id))),
            cells: [
              DataCell(Text(r.visitDate)),
              DataCell(Text(r.kabupatenName ?? '—')),
              DataCell(Text(r.petugasName ?? '—')),
              DataCell(Text(r.cgr ?? '—')),
              DataCell(Text(r.blockNo ?? '—')),
              DataCell(Text(r.noPlot ?? '—')),
              DataCell(Text(r.memberName ?? '—')),
              DataCell(Text(r.documentNo ?? '—')),
              DataCell(Text(r.tglTanam ?? '—')),
              DataCell(Text(r.realTanamHa != null ? '${r.realTanamHa}' : '—')),
              DataCell(Text(r.gagalTanam != null ? '${r.gagalTanam}' : '—')),
              DataCell(Text(r.sisaDiLahanHa != null ? '${r.sisaDiLahanHa}' : '—')),
              DataCell(_statusBadge(r.status)),
              DataCell(_labelDot(r.label)),
              DataCell(Text(r.panenStatus, style: TextStyle(fontSize: 11, color: r.panenStatus == 'Panen' ? Colors.green : r.panenStatus == 'Jatuh Tempo' ? Colors.red : Colors.grey))),
            ],
          )).toList(),
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    final color = switch (status) {
      'completed' => const Color(0xFF22C55E),
      'gagal_total' => Colors.red,
      'gagal_partial' => Colors.orange,
      'in_progress' => const Color(0xFF8B5CF6),
      _ => const Color(0xFFF59E0B),
    };
    final label = switch (status) {
      'completed' => 'Selesai',
      'gagal_total' => 'Gagal Total',
      'gagal_partial' => 'Gagal Partial',
      'in_progress' => 'In Progress',
      'pending' => 'Pending',
      _ => status,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }

  Widget _labelDot(String? label) {
    final color = switch (label) {
      'hijau' => Colors.green,
      'kuning' => Colors.amber,
      'merah' => Colors.red,
      _ => null,
    };
    if (color == null) return const Text('—');
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label!, style: TextStyle(fontSize: 11, color: color)),
      ],
    );
  }
}

Widget _sectionTitle(String text) {
  return Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14));
}

class _Kpi extends StatelessWidget {
  const _Kpi(this.title, this.value, this.color);
  final String title;
  final String value;
  final Color color;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title, style: TextStyle(color: Colors.grey.shade500, fontSize: 10)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    ),
  );
}

class _PieData {
  _PieData(this.label, this.value, this.color);
  final String label;
  final double value;
  final Color color;
}
