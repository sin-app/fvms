import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/schedules/bloc/schedules_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});
  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  late DateTime _focused;
  DateTime? _selected;
  late SchedulesBloc _bloc;

  @override
  void initState() {
    super.initState();
    _focused = DateTime.now();
    _selected = DateTime.now();
    _bloc = SchedulesBloc()..add(SchedulesLoad());
  }

  @override
  void dispose() {
    _bloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _bloc,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Kalender'),
          actions: [
            IconButton(
              icon: const Icon(Icons.today),
              tooltip: 'Hari Ini',
              onPressed: () {
                final now = DateTime.now();
                setState(() {
                  _focused = now;
                  _selected = now;
                });
              },
            ),
          ],
        ),
        body: BlocBuilder<SchedulesBloc, SchedulesState>(
          builder: (c, s) {
            if (s is SchedulesInitial || s is SchedulesLoading) return const LoadingState();
            if (s is SchedulesError) {
              return ErrorState(message: s.message, onRetry: () => _bloc.add(SchedulesLoad()));
            }
            if (s is SchedulesLoaded) {
              final events = s.items;
              final eventMap = <String, List<ScheduleItem>>{};
              for (final e in events) {
                final key = _normalizeDate(e.visitDate);
                if (key != null) {
                  eventMap.putIfAbsent(key, () => []).add(e);
                }
              }
              return Column(children: [
                TableCalendar(
                  firstDay: DateTime.utc(2020),
                  lastDay: DateTime.utc(2030, 12, 31),
                  focusedDay: _focused,
                  locale: 'id_ID',
                  selectedDayPredicate: (d) => isSameDay(_selected, d),
                  onDaySelected: (sel, foc) => setState(() {
                    _selected = sel;
                    _focused = foc;
                  }),
                  onDayLongPressed: (sel, foc) => setState(() {
                    _selected = sel;
                    _focused = foc;
                  }),
                  onPageChanged: (foc) => setState(() => _focused = foc),
                  eventLoader: (d) {
                    final key = _normalizeDateFromDt(d);
                    return key.isNotEmpty ? (eventMap[key] ?? <ScheduleItem>[]) : <ScheduleItem>[];
                  },
                  calendarStyle: CalendarStyle(
                    markerDecoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                    markerSize: 8,
                    markersMaxCount: 3,
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
                      : _buildDayList(eventMap),
                ),
              ]);
            }
            return const LoadingState();
          },
        ),
      ),
    );
  }

  Widget _buildDayList(Map<String, List<ScheduleItem>> eventMap) {
    final key = _normalizeDateFromDt(_selected!);
    final day = eventMap[key] ?? <ScheduleItem>[];
    if (day.isEmpty) {
      return RefreshIndicator(
        onRefresh: () async => _bloc.add(SchedulesLoad()),
        child: ListView(
          children: const [
            SizedBox(height: 80),
            Center(child: EmptyState(message: 'Tidak ada jadwal')),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async => _bloc.add(SchedulesLoad()),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: day.length,
        separatorBuilder: (_, __) => const SizedBox(height: 6),
        itemBuilder: (_, i) {
          final item = day[i];
          final c = _statusColor(item.status);
          final luasan = item.realTanamHa != null ? '${item.realTanamHa} ha' : null;
          final sisa = item.sisaDiLahanHa != null ? '${item.sisaDiLahanHa} ha' : null;
          return Card(
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
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: c.withValues(alpha: 0.12),
                          child: Icon(_statusIcon(item.status), size: 16, color: c),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: c.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(_statusText(item.status), style: TextStyle(fontSize: 10, color: c, fontWeight: FontWeight.w600)),
                                  ),
                                  if (item.blockNo != null) ...[
                                    const SizedBox(width: 6),
                                    Text('Block ${item.blockNo}', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                                  ],
                                  if (item.noPlot != null) ...[
                                    const SizedBox(width: 6),
                                    Text('Plot ${item.noPlot}', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 20),
                      ],
                    ),
                    if (luasan != null || sisa != null || item.cgr != null || item.detaseling != null || item.panenStatus != '—') ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          if (luasan != null) _infoChip(Icons.landscape_outlined, 'Luasan', luasan),
                          if (sisa != null) _infoChip(Icons.grass_outlined, 'Sisa', sisa),
                          if (item.cgr != null) _infoChip(Icons.agriculture_outlined, 'CGR', item.cgr!),
                          if (item.detaseling != null && item.detaseling!.isNotEmpty) _infoChip(Icons.swap_horiz, 'Detaseling', item.detaseling!),
                          if (item.panenStatus != '—') _infoChip(
                            Icons.eco_outlined, 'Panen', item.panenStatus,
                            color: item.panenStatus == 'Panen' ? Colors.green : item.panenStatus == 'Jatuh Tempo' ? Colors.red : null,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _infoChip(IconData icon, String label, String value, {Color? color}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color ?? Colors.grey.shade500),
        const SizedBox(width: 2),
        Text('$label: ', style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
        Text(value, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color ?? Colors.grey.shade700)),
      ],
    );
  }

  static String? _normalizeDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return null;
    try {
      final d = DateTime.parse(dateStr);
      return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    } catch (_) {
      if (dateStr.length >= 10) return dateStr.substring(0, 10);
      return dateStr;
    }
  }

  static String _normalizeDateFromDt(DateTime d) {
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

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
