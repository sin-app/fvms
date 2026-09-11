import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/schedules/bloc/schedules_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:table_calendar/table_calendar.dart';

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});
  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  late DateTime _focused;
  DateTime? _selected;

  @override
  void initState() {
    super.initState();
    _focused = DateTime.now();
    _selected = DateTime.now();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => SchedulesBloc()..add(SchedulesLoad()),
      child: Scaffold(
        appBar: AppBar(title: const Text('Kalender')),
        body: BlocBuilder<SchedulesBloc, SchedulesState>(
          builder: (c, s) {
            if (s is SchedulesInitial || s is SchedulesLoading) return const LoadingState();
            if (s is SchedulesError) return ErrorState(message: s.message, onRetry: () => c.read<SchedulesBloc>().add(SchedulesLoad()));
            if (s is SchedulesLoaded) {
              final events = s.items;
              return Column(children: [
                TableCalendar(
                  firstDay: DateTime.utc(2020),
                  lastDay: DateTime.utc(2030, 12, 31),
                  focusedDay: _focused,
                  locale: 'id_ID',
                  selectedDayPredicate: (d) => isSameDay(_selected, d),
                  onDaySelected: (sel, foc) => setState(() {_selected = sel; _focused = foc;}),
                  eventLoader: (d) {
                    final key = _dateKey(d);
                    return events.where((e) => e.visitDate == key).toList();
                  },
                  calendarStyle: CalendarStyle(
                    markerDecoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                    todayDecoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    selectedDecoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: _selected == null
                      ? const Center(child: Text('Pilih tanggal'))
                      : Builder(builder: (_) {
                          final key = _dateKey(_selected!);
                          final day = events.where((e) => e.visitDate == key).toList();
                          if (day.isEmpty) return const EmptyState(message: 'Tidak ada jadwal');
                          return RefreshIndicator(
                            onRefresh: () async => c.read<SchedulesBloc>().add(SchedulesLoad()),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: day.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 6),
                              itemBuilder: (_, i) {
                                final item = day[i];
                                final c = _statusColor(item.status);
                                return Card(
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor: c.withValues(alpha: 0.12),
                                      child: Icon(_statusIcon(item.status), size: 18, color: c),
                                    ),
                                    title: Text(item.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
                                    subtitle: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: c.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(_statusText(item.status), style: TextStyle(fontSize: 11, color: c, fontWeight: FontWeight.w600)),
                                        ),
                                        if (item.blockNo != null) ...[
                                          const SizedBox(width: 8),
                                          Text('Block: ${item.blockNo}', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                                        ],
                                        if (item.panenStatus != '—') ...[
                                          const SizedBox(width: 8),
                                          Text(item.panenStatus, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                                        ],
                                      ],
                                    ),
                                    isThreeLine: true,
                                  ),
                                );
                              },
                            ),
                          );
                        }),
                ),
              ]);
            }
            return const LoadingState();
          },
        ),
      ),
    );
  }

  static String _dateKey(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Color _statusColor(String s) => switch (s) {
    'completed' => const Color(0xFF22C55E),
    'gagal_total' => Colors.red,
    'gagal_partial' => Colors.orange,
    'in_progress' => const Color(0xFF8B5CF6),
    _ => const Color(0xFFF59E0B),
  };

  IconData _statusIcon(String s) => switch (s) {
    'completed' => Icons.check_circle_outline,
    'gagal_total' => Icons.cancel_outlined,
    'gagal_partial' => Icons.warning_amber_rounded,
    'in_progress' => Icons.play_circle_outline,
    _ => Icons.schedule,
  };

  String _statusText(String s) => switch (s) {
    'completed' => 'Selesai',
    'gagal_total' => 'Gagal Total',
    'gagal_partial' => 'Gagal Partial',
    'in_progress' => 'Dikerjakan',
    _ => 'Pending',
  };
}
