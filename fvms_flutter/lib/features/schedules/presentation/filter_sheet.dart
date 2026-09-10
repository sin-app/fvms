import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/schedules/bloc/schedules_bloc.dart';

class FilterSheet extends StatefulWidget {
  const FilterSheet({super.key});
  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  String? status;

  static const _statusOptions = [
    ('', 'Semua Status'),
    ('pending', 'Pending'),
    ('in_progress', 'In Progress'),
    ('gagal_partial', 'Gagal Partial'),
    ('completed', 'Completed'),
    ('gagal_total', 'Gagal Total'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              const Expanded(child: Text('Filter Jadwal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: status ?? '',
            decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
            items: _statusOptions.map((o) => DropdownMenuItem(value: o.$1, child: Text(o.$2))).toList(),
            onChanged: (v) => setState(() => status = v),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    setState(() => status = null);
                  },
                  child: const Text('Reset'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    context.read<SchedulesBloc>().add(SchedulesFilterChanged(status));
                    Navigator.pop(context);
                  },
                  child: const Text('Terapkan'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

void showFilterSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (_) => BlocProvider.value(
      value: context.read<SchedulesBloc>(),
      child: const FilterSheet(),
    ),
  );
}
