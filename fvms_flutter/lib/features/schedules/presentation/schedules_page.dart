import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Jadwal'),
          actions: [
            Builder(builder: (btnCtx) => IconButton(
              icon: const Icon(Icons.filter_list),
              onPressed: () => showFilterSheet(btnCtx),
              tooltip: 'Filter',
            )),
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
                  children: grouped.entries.map((e) {
                    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(e.key, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                      ),
                      ...e.value.map((it) => _ScheduleCard(item: it)),
                    ],);
                  }).toList(),
                ),
              );
            }
            return const LoadingState();
          },
        ),
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({required this.item});
  final ScheduleItem item;

  Color _statusColor() {
    switch (item.status) {
      case 'completed': return const Color(0xFF22C55E);
      case 'gagal_total': return Colors.red;
      case 'gagal_partial': return Colors.orange;
      case 'in_progress': return const Color(0xFF8B5CF6);
      default: return const Color(0xFFF59E0B);
    }
  }

  String _statusLabel() {
    switch (item.status) {
      case 'completed': return 'Selesai';
      case 'gagal_total': return 'Gagal Total';
      case 'gagal_partial': return 'Gagal Partial';
      case 'in_progress': return 'Dikerjakan';
      case 'pending': return 'Pending';
      default: return item.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColor();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.go('/visit/${item.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      item.memberName ?? '-',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: color.withValues(alpha: 0.3)),
                    ),
                    child: Text(_statusLabel(), style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _infoChip(Icons.category_outlined, item.blockNo ?? '-'),
                  const SizedBox(width: 8),
                  if (item.nis != null && item.nis!.isNotEmpty)
                    _infoChip(Icons.numbers, item.nis!),
                  const SizedBox(width: 8),
                  if (item.cgr != null && item.cgr!.isNotEmpty)
                    _infoChip(Icons.agriculture_outlined, 'CGR ${item.cgr}'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: Colors.grey),
        const SizedBox(width: 3),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }
}
