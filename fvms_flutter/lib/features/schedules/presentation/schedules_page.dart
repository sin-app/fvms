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
        appBar: AppBar(title: const Text('Jadwal'), actions: [IconButton(icon: const Icon(Icons.filter_list), onPressed: () => showFilterSheet(context))]),
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
                      Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text(e.key, style: const TextStyle(fontWeight: FontWeight.bold))),
                      ...e.value.map((it) => Card(
                            child: ListTile(
                              leading: Container(width: 10, height: 10, decoration: BoxDecoration(color: _dot(it.status), shape: BoxShape.circle)),
                              title: Text(it.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('${it.blockNo ?? '-'} • ${it.nis ?? '-'} • ${it.status}'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => GoRouter.of(c).go('/visit/${it.id}'),
                            ),
                          ),),
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

  Color _dot(String s) {
    switch (s) {
      case 'completed':
        return const Color(0xFF22C55E);
      case 'gagal_total':
        return Colors.red;
      case 'gagal_partial':
        return Colors.orange;
      case 'in_progress':
        return Colors.purple;
      default:
        return Colors.amber;
    }
  }
}
