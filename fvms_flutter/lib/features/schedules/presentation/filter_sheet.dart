import 'package:flutter/material.dart';

/// Mirror web ReportFiltersView + ScheduleFilters cascading
/// Compact bottom sheet for mobile, uses Dropdown + MultiSelect
class FilterSheet extends StatefulWidget {
  const FilterSheet({super.key});
  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  String? status;
  String? cgr;
  String? kabupaten;
  List<String> blocks = [];
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Filter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          TextField(decoration: const InputDecoration(labelText: 'Kode Varietas', border: OutlineInputBorder()), onChanged: (v) {}),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(decoration: const InputDecoration(labelText: 'CGR', border: OutlineInputBorder()), items: const [DropdownMenuItem(value: '', child: Text('Semua CGR'))], onChanged: (v) => setState(() => cgr = v)),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()), items: const [DropdownMenuItem(value: 'pending', child: Text('Pending')), DropdownMenuItem(value: 'completed', child: Text('Completed'))], onChanged: (v) => setState(() => status = v)),
          const SizedBox(height: 16),
          FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Terapkan')),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Reset')),
        ],
      ),
    );
  }
}

void showFilterSheet(BuildContext context) => showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => const FilterSheet());
