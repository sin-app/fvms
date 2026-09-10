import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/offline/sync_bloc.dart';
import 'package:fvms_flutter/features/schedules/bloc/schedules_bloc.dart';
import 'package:fvms_flutter/features/schedules/presentation/filter_sheet.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:go_router/go_router.dart';

class SchedulesPage extends StatelessWidget {
  const SchedulesPage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => SchedulesBloc()..add(SchedulesLoad()),
      child: Builder(
        builder: (ctx) => Scaffold(
          appBar: AppBar(
            title: const Text('Jadwal'),
            actions: [
              IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: () => showFilterSheet(ctx),
                tooltip: 'Filter',
              ),
            ],
          ),
          body: BlocBuilder<SchedulesBloc, SchedulesState>(
            builder: (c, s) {
              if (s is SchedulesInitial || s is SchedulesLoading) return const LoadingState();
              if (s is SchedulesError) return ErrorState(message: s.message, onRetry: () => c.read<SchedulesBloc>().add(SchedulesLoad()));
              if (s is SchedulesLoaded) {
                if (s.items.isEmpty) return const EmptyState(message: 'Belum ada jadwal');
                final grouped = <String, List<ScheduleItem>>{};
                for (final it in s.items) {
                  grouped.putIfAbsent(it.visitDate, () => []).add(it);
                }
                return RefreshIndicator(
                  onRefresh: () async => c.read<SchedulesBloc>().add(SchedulesLoad()),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                    children: [
                      BlocBuilder<SyncBloc, SyncState>(
                        builder: (_, sync) {
                          if (sync.status != SyncStatus.offline) return const SizedBox.shrink();
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.orange.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.cloud_off, color: Colors.orange, size: 20),
                                SizedBox(width: 10),
                                Expanded(child: Text('Mode luring: data dari cache lokal', style: TextStyle(color: Colors.orange, fontSize: 13))),
                              ],
                            ),
                          );
                        },
                      ),
                      if (s.filter != null && !s.filter!.isEmpty)
                        _ActiveFilters(filter: s.filter!),
                      ...grouped.entries.map((e) {
                        final dateLabel = _formatDate(e.key);
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Row(
                                children: [
                                  Text(dateLabel, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                    child: Text('${e.value.length}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  ),
                                ],
                              ),
                            ),
                            ...e.value.map((it) => _ScheduleCard(item: it)),
                          ],
                        );
                      }),
                    ],
                  ),
                );
              }
              return const LoadingState();
            },
          ),
        ),
      ),
    );
  }

  static String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final target = DateTime(d.year, d.month, d.day);
      if (target == today) return 'Hari Ini';
      if (target == today.add(const Duration(days: 1))) return 'Besok';
      if (target == today.subtract(const Duration(days: 1))) return 'Kemarin';
      const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${d.day} ${months[d.month]} ${d.year}';
    } catch (_) {
      return iso;
    }
  }
}

class _ActiveFilters extends StatelessWidget {
  const _ActiveFilters({required this.filter});
  final SchedulesFilter filter;
  @override
  Widget build(BuildContext context) {
    final chips = <String>[];
    if (filter.status != null) chips.add('Status: ${filter.status}');
    if (filter.label != null) chips.add('Label: ${filter.label}');
    if (filter.memberName != null) chips.add('Member: ${filter.memberName}');
    if (filter.blockNo != null) chips.add('Block: ${filter.blockNo}');
    if (filter.noPlot != null) chips.add('Plot: ${filter.noPlot}');
    if (filter.nis != null) chips.add('NIS: ${filter.nis}');
    if (filter.documentNo != null) chips.add('Doc: ${filter.documentNo}');
    if (filter.cgr != null) chips.add('CGR: ${filter.cgr}');
    if (filter.varietas != null) chips.add('Varietas: ${filter.varietas}');
    if (filter.kabupatenId != null) chips.add('Kab: ${filter.kabupatenId}');
    if (filter.dateFrom != null) chips.add('Dari: ${filter.dateFrom}');
    if (filter.dateTo != null) chips.add('Sampai: ${filter.dateTo}');
    if (chips.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        children: chips.map((c) => Chip(
          label: Text(c, style: const TextStyle(fontSize: 11)),
          visualDensity: VisualDensity.compact,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        )).toList(),
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({required this.item});
  final ScheduleItem item;

  Color _statusColor() => switch (item.status) {
    'completed' => const Color(0xFF22C55E),
    'gagal_total' => Colors.red,
    'gagal_partial' => Colors.orange,
    'in_progress' => const Color(0xFF8B5CF6),
    _ => const Color(0xFFF59E0B),
  };

  String _statusLabel() => switch (item.status) {
    'completed' => 'Selesai',
    'gagal_total' => 'Gagal Total',
    'gagal_partial' => 'Gagal Partial',
    'in_progress' => 'Dikerjakan',
    'pending' => 'Pending',
    _ => item.status,
  };

  Color? _labelColor() => switch (item.label) {
    'hijau' => Colors.green,
    'kuning' => Colors.amber,
    'merah' => Colors.red,
    _ => null,
  };

  @override
  Widget build(BuildContext context) {
    final color = _statusColor();
    final labelColor = _labelColor();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.go('/visit/${item.id}'),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(width: 4, height: 40, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        if (item.petugasName != null && item.petugasName!.isNotEmpty)
                          Text(item.petugasName!, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                      ],
                    ),
                  ),
                  if (labelColor != null)
                    Container(
                      margin: const EdgeInsets.only(right: 6),
                      width: 10, height: 10,
                      decoration: BoxDecoration(color: labelColor, shape: BoxShape.circle),
                    ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_statusLabel(), style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  if (item.blockNo != null) _tag(Icons.grid_view, 'Block ${item.blockNo}'),
                  if (item.noPlot != null) _tag(Icons.crop_free, 'Plot ${item.noPlot}'),
                  if (item.cgr != null && item.cgr!.isNotEmpty) _tag(Icons.eco, 'CGR ${item.cgr}'),
                  if (item.nis != null && item.nis!.isNotEmpty) _tag(Icons.tag, 'NIS ${item.nis}'),
                  if (item.documentNo != null && item.documentNo!.isNotEmpty) _tag(Icons.description, item.documentNo!),
                ],
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  if (item.kabupatenName != null) _tag(Icons.location_city, item.kabupatenName!),
                  if (item.kecamatanName != null) _tag(Icons.map, item.kecamatanName!),
                  if (item.desaName != null) _tag(Icons.home, item.desaName!),
                ],
              ),
              if (item.tglTanam != null || item.realTanamHa != null || item.gagalTanam != null || item.sisaDiLahanHa != null) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    if (item.tglTanam != null) _metric('Tanam', item.tglTanam!),
                    if (item.realTanamHa != null) _metric('Luas', '${item.realTanamHa} ha'),
                    if (item.gagalTanam != null && item.gagalTanam! > 0) _metric('Gagal', '${item.gagalTanam} ha'),
                    if (item.sisaDiLahanHa != null) _metric('Sisa', '${item.sisaDiLahanHa} ha'),
                  ],
                ),
              ],
              if (item.panenStatus != '—') ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.agriculture_outlined, size: 13, color: Colors.grey.shade500),
                    const SizedBox(width: 4),
                    Text(item.panenStatus, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.grey.shade600),
          const SizedBox(width: 3),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
        ],
      ),
    );
  }

  Widget _metric(String label, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label: ', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
        Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
      ],
    );
  }
}
