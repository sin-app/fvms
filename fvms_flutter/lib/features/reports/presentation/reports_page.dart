import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/features/reports/bloc/reports_bloc.dart';
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
  final _memberCtrl = TextEditingController();
  String? _status;
  String? _label;
  String? _datePreset;
  DateTime? _dateFrom;
  DateTime? _dateTo;
  bool _showTable = false;

  @override
  void dispose() {
    _memberCtrl.dispose();
    super.dispose();
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
        from = _fmt(DateTime(now.year, now.month, 1));
        to = _fmt(today);
      case 'custom':
        from = _dateFrom != null ? _fmt(_dateFrom!) : null;
        to = _dateTo != null ? _fmt(_dateTo!) : null;
      default:
        from = null;
        to = null;
    }
    context.read<ReportsBloc>().add(ReportsFilterChanged(
      member: _memberCtrl.text.isEmpty ? null : _memberCtrl.text,
      status: _status,
      label: _label,
      dateFrom: from,
      dateTo: to,
    ));
  }

  String? _fmt(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

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
            return RefreshIndicator(
              onRefresh: () async => c.read<ReportsBloc>().add(ReportsLoad()),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                children: [
                  _buildFilterCard(c),
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
                  _sectionTitle('Per Kabupaten'),
                  const SizedBox(height: 8),
                  _kabupatenList(d),
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

  Widget _buildFilterCard(BuildContext c) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _memberCtrl,
                    decoration: const InputDecoration(hintText: 'Nama Member', prefixIcon: Icon(Icons.person_outline, size: 20), isDense: true, border: OutlineInputBorder()),
                    onSubmitted: (_) => _applyFilter(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: _applyFilter,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _smallDropdown('Status', ['Semua', 'Pending', 'In Progress', 'Gagal Partial', 'Completed', 'Gagal Total'], (v) {
                  _status = v == 'Semua' ? null : v?.toLowerCase().replaceAll(' ', '_');
                })),
                const SizedBox(width: 8),
                Expanded(child: _smallDropdown('Label', ['Semua', 'Hijau', 'Kuning', 'Merah'], (v) {
                  _label = v == 'Semua' ? null : v?.toLowerCase();
                })),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _smallDropdown('Tanggal', ['Semua', 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Kustom'], (v) {
                  _datePreset = v == 'Semua' ? null : v?.toLowerCase().replaceAll(' ', '');
                })),
                if (_datePreset == 'custom') ...[
                  const SizedBox(width: 8),
                  Expanded(child: _dateBtn('Dari', _dateFrom, (d) => setState(() => _dateFrom = d))),
                  const SizedBox(width: 8),
                  Expanded(child: _dateBtn('Sampai', _dateTo, (d) => setState(() => _dateTo = d))),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _smallDropdown(String label, List<String> options, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      value: options.first,
      isDense: true,
      decoration: const InputDecoration(isDense: true, border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(fontSize: 12)))).toList(),
      onChanged: onChanged,
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
                  final date = last7[group.x.toInt()].key;
                  return BarTooltipItem('${rod.toY.toInt()}\n$date', const TextStyle(color: Colors.white, fontSize: 10));
                },
              ),
            ),
            titlesData: FlTitlesData(
              leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
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
          return ListTile(
            dense: true,
            title: Text(o.name, style: const TextStyle(fontSize: 13)),
            subtitle: LinearProgressIndicator(
              value: o.total > 0 ? o.completed / o.total : 0,
              backgroundColor: Colors.grey.shade200,
              color: rate >= 80 ? Colors.green : rate >= 50 ? Colors.amber : Colors.red,
              minHeight: 4,
            ),
            trailing: Text('${o.completed}/${o.total} ($rate%)', style: const TextStyle(fontSize: 12)),
          );
        }).toList(),
      ),
    );
  }

  Widget _kabupatenList(ReportDataLite d) {
    if (d.byKabupaten.isEmpty) return const Padding(padding: EdgeInsets.all(12), child: Text('Belum ada data kabupaten', style: TextStyle(color: Colors.grey)));
    return Card(
      child: Column(
        children: d.byKabupaten.map((k) {
          final rate = k.total > 0 ? (k.completed * 100 / k.total).round() : 0;
          return ListTile(
            dense: true,
            title: Text(k.name, style: const TextStyle(fontSize: 13)),
            subtitle: LinearProgressIndicator(
              value: k.total > 0 ? k.completed / k.total : 0,
              backgroundColor: Colors.grey.shade200,
              color: rate >= 80 ? Colors.green : rate >= 50 ? Colors.amber : Colors.red,
              minHeight: 4,
            ),
            trailing: Text('${k.completed}/${k.total} ($rate%)', style: const TextStyle(fontSize: 12)),
          );
        }).toList(),
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
            DataColumn(label: Text('Kabupaten')),
            DataColumn(label: Text('Member')),
            DataColumn(label: Text('Block')),
            DataColumn(label: Text('Status')),
            DataColumn(label: Text('Label')),
            DataColumn(label: Text('Panen')),
          ],
          rows: rows.take(100).map((r) => DataRow(cells: [
            DataCell(Text(r.visitDate)),
            DataCell(Text(r.kabupatenName ?? '—')),
            DataCell(Text(r.memberName ?? '—')),
            DataCell(Text(r.blockNo ?? '—')),
            DataCell(_statusBadge(r.status)),
            DataCell(_labelDot(r.label)),
            DataCell(Text(r.panenStatus, style: TextStyle(fontSize: 11, color: r.panenStatus == 'Panen' ? Colors.green : r.panenStatus == 'Jatuh Tempo' ? Colors.red : Colors.grey))),
          ])).toList(),
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
