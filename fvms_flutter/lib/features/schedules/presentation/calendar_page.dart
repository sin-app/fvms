import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/schedules/bloc/schedules_bloc.dart';
import 'package:table_calendar/table_calendar.dart';

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});
  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  DateTime _focused = DateTime.now();
  DateTime? _selected;
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => SchedulesBloc()..add(SchedulesLoad()),
      child: Scaffold(
        appBar: AppBar(title: const Text('Kalender')),
        body: BlocBuilder<SchedulesBloc, SchedulesState>(
          builder: (c, s) {
            final events = s is SchedulesLoaded ? s.items : <ScheduleItem>[];
            return Column(children: [
              TableCalendar(
                firstDay: DateTime.utc(2020),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focused,
                selectedDayPredicate: (d) => isSameDay(_selected, d),
                onDaySelected: (sel, foc) => setState(() {_selected = sel; _focused = foc;}),
                eventLoader: (d) {
                  final key = d.toIso8601String().substring(0,10);
                  return events.where((e) => e.visitDate == key).toList();
                },
                calendarStyle: const CalendarStyle(markerDecoration: BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle)),
              ),
              const Divider(),
              Expanded(
                child: Builder(builder: (_) {
                  if (_selected == null) return const Center(child: Text('Pilih tanggal'));
                  final key = _selected!.toIso8601String().substring(0,10);
                  final day = events.where((e) => e.visitDate == key).toList();
                  if (day.isEmpty) return const Center(child: Text('Tidak ada jadwal'));
                  return ListView(children: day.map((e) => ListTile(title: Text(e.memberName ?? '-'), subtitle: Text(e.status))).toList());
                },),
              ),
            ],);
          },
        ),
      ),
    );
  }
}
