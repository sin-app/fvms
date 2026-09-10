import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/features/schedules/bloc/schedules_bloc.dart';

class FilterSheet extends StatefulWidget {
  const FilterSheet({super.key});
  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  String? status;
  String? label;
  String? memberName;
  String? blockNo;
  String? noPlot;
  String? nis;
  String? documentNo;
  String? cgr;
  String? varietas;
  String? kabupatenId;
  String? kecamatanId;
  String? desaId;
  String? datePreset;
  DateTime? dateFrom;
  DateTime? dateTo;

  List<Map<String, dynamic>> _kabupatens = [];
  List<Map<String, dynamic>> _kecamatans = [];
  List<Map<String, dynamic>> _desas = [];
  bool _loadingRegions = false;

  static const _statusOptions = [
    ('', 'Semua Status'),
    ('pending', 'Pending'),
    ('in_progress', 'In Progress'),
    ('gagal_partial', 'Gagal Partial'),
    ('completed', 'Completed'),
    ('gagal_total', 'Gagal Total'),
  ];

  static const _labelOptions = [
    ('', 'Semua Label'),
    ('hijau', 'Hijau'),
    ('kuning', 'Kuning'),
    ('merah', 'Merah'),
  ];

  static const _datePresets = [
    ('', 'Semua Tanggal'),
    ('today', 'Hari Ini'),
    ('week', 'Minggu Ini'),
    ('month', 'Bulan Ini'),
    ('custom', 'Kustom'),
  ];

  @override
  void initState() {
    super.initState();
    _loadRegions();
  }

  Future<void> _loadRegions() async {
    if (!isSupabaseInitialized) return;
    setState(() => _loadingRegions = true);
    try {
      final data = await supabase.from('kabupaten').select('id, name').order('name').timeout(const Duration(seconds: 8));
      if (!mounted) return;
      setState(() {
        _kabupatens = (data as List).cast<Map<String, dynamic>>();
        _loadingRegions = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingRegions = false);
    }
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

  void _applyDatePreset(String? preset) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    switch (preset) {
      case 'today':
        dateFrom = today;
        dateTo = today;
      case 'week':
        final weekday = now.weekday;
        dateFrom = today.subtract(Duration(days: weekday - 1));
        dateTo = today;
      case 'month':
        dateFrom = DateTime(now.year, now.month);
        dateTo = today;
      case 'custom':
        dateFrom = null;
        dateTo = null;
      default:
        dateFrom = null;
        dateTo = null;
    }
  }

  String? _formatDate(DateTime? d) {
    if (d == null) return null;
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollCtrl) => ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                const Expanded(child: Text('Filter Jadwal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 8),
            _input('Member', Icons.person_outline, (v) => memberName = v.isEmpty ? null : v),
            _input('Block', Icons.grid_view, (v) => blockNo = v.isEmpty ? null : v),
            _input('No Plot', Icons.crop_free, (v) => noPlot = v.isEmpty ? null : v),
            _input('NIS', Icons.tag, (v) => nis = v.isEmpty ? null : v),
            _input('Doc No', Icons.description_outlined, (v) => documentNo = v.isEmpty ? null : v),
            _input('CGR', Icons.eco_outlined, (v) => cgr = v.isEmpty ? null : v),
            _input('Varietas (dari Doc No)', Icons.spa_outlined, (v) => varietas = v.isEmpty ? null : v),
            const SizedBox(height: 8),
            _dropdown('Status', Icons.flag_outlined, _statusOptions, status, (v) => status = v),
            _dropdown('Label', Icons.label_outline, _labelOptions, label, (v) => label = v),
            const SizedBox(height: 8),
            _dropdown('Date Preset', Icons.date_range, _datePresets, datePreset, (v) {
              datePreset = v;
              _applyDatePreset(v);
              setState(() {});
            }),
            if (datePreset == 'custom') ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: _datePicker('Dari', dateFrom, (d) => setState(() => dateFrom = d))),
                  const SizedBox(width: 12),
                  Expanded(child: _datePicker('Sampai', dateTo, (d) => setState(() => dateTo = d))),
                ],
              ),
            ],
            const SizedBox(height: 8),
            if (_loadingRegions)
              const Padding(padding: EdgeInsets.all(8), child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))))
            else ...[
              _regionDropdown('Kabupaten', Icons.location_city, _kabupatens, kabupatenId, (v) {
                setState(() {
                  kabupatenId = v;
                  kecamatanId = null;
                  desaId = null;
                  _kecamatans = [];
                  _desas = [];
                });
                if (v != null && v.isNotEmpty) _loadKecamatan(v);
              }),
              if (kecamatanId != null || _kecamatans.isNotEmpty)
                _regionDropdown('Kecamatan', Icons.map, _kecamatans, kecamatanId, (v) {
                  setState(() {
                    kecamatanId = v;
                    desaId = null;
                    _desas = [];
                  });
                  if (v != null && v.isNotEmpty) _loadDesa(v);
                }),
              if (desaId != null || _desas.isNotEmpty)
                _regionDropdown('Desa', Icons.home, _desas, desaId, (v) => setState(() => desaId = v)),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        status = null;
                        label = null;
                        memberName = null;
                        blockNo = null;
                        noPlot = null;
                        nis = null;
                        documentNo = null;
                        cgr = null;
                        varietas = null;
                        kabupatenId = null;
                        kecamatanId = null;
                        desaId = null;
                        datePreset = null;
                        dateFrom = null;
                        dateTo = null;
                      });
                    },
                    child: const Text('Reset'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      final filter = SchedulesFilter(
                        status: status,
                        label: label,
                        memberName: memberName,
                        blockNo: blockNo,
                        noPlot: noPlot,
                        nis: nis,
                        documentNo: documentNo,
                        cgr: cgr,
                        varietas: varietas,
                        kabupatenId: kabupatenId,
                        kecamatanId: kecamatanId,
                        desaId: desaId,
                        dateFrom: _formatDate(dateFrom),
                        dateTo: _formatDate(dateTo),
                      );
                      context.read<SchedulesBloc>().add(SchedulesFilterChanged(filter));
                      Navigator.pop(context);
                    },
                    child: const Text('Terapkan'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _input(String label, IconData icon, ValueChanged<String> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextFormField(
        decoration: InputDecoration(
          hintText: label,
          prefixIcon: Icon(icon, size: 20),
          isDense: true,
          border: const OutlineInputBorder(),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        onChanged: onChanged,
      ),
    );
  }

  Widget _dropdown(String label, IconData icon, List<(String, String)> options, String? value, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: DropdownButtonFormField<String>(
        value: value ?? '',
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, size: 20),
          isDense: true,
          border: const OutlineInputBorder(),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        items: options.map((o) => DropdownMenuItem(value: o.$1, child: Text(o.$2))).toList(),
        onChanged: (v) => onChanged((v?.isEmpty ?? false) ? null : v),
      ),
    );
  }

  Widget _regionDropdown(String label, IconData icon, List<Map<String, dynamic>> items, String? value, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: DropdownButtonFormField<String>(
        value: value ?? '',
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, size: 20),
          isDense: true,
          border: const OutlineInputBorder(),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        items: [
          const DropdownMenuItem(value: '', child: Text('Semua')),
          ...items.map((r) => DropdownMenuItem(value: r['id'] as String, child: Text(r['name'] as String))),
        ],
        onChanged: (v) => onChanged((v?.isEmpty ?? false) ? null : v),
      ),
    );
  }

  Widget _datePicker(String label, DateTime? date, ValueChanged<DateTime> onPicked) {
    return OutlinedButton.icon(
      icon: const Icon(Icons.calendar_today, size: 16),
      label: Text(date != null ? '$label: ${_formatDate(date)}' : '$label: Pilih'),
      onPressed: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (picked != null) onPicked(picked);
      },
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
