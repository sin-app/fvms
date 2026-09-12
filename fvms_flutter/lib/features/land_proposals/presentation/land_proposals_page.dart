import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';
import 'package:fvms_flutter/features/land_proposals/bloc/land_proposal_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:geolocator/geolocator.dart';

class LandProposalsPage extends StatelessWidget {
  const LandProposalsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => LandProposalBloc()..add(LandProposalsLoad()),
      child: const _LandProposalsView(),
    );
  }
}

class _LandProposalsView extends StatelessWidget {
  const _LandProposalsView();
  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final isProduksi = authState is AuthAuthenticated && authState.ctx.role == UserRole.produksi;
    final isAdmin = authState is AuthAuthenticated && authState.ctx.role == UserRole.admin;
    final canCreate = isProduksi || isAdmin;
    return Scaffold(
      appBar: AppBar(title: const Text('Pengajuan Lahan')),
      floatingActionButton: canCreate
          ? Builder(
              builder: (fabCtx) => FloatingActionButton.extended(
                icon: const Icon(Icons.add),
                label: const Text('Ajukan'),
                onPressed: () => Navigator.push<LandProposalItem>(fabCtx, MaterialPageRoute<LandProposalItem>(builder: (_) => BlocProvider.value(value: fabCtx.read<LandProposalBloc>(), child: const _CreateProposalPage()))),
              ),
            )
          : null,
      body: BlocBuilder<LandProposalBloc, LandProposalState>(
        builder: (c, s) {
          if (s is LandProposalsInitial || s is LandProposalsLoading) return const LoadingState();
          if (s is LandProposalsError) return ErrorState(message: s.message, onRetry: () => c.read<LandProposalBloc>().add(LandProposalsLoad()));
          if (s is LandProposalsLoaded) {
            if (s.items.isEmpty) return const EmptyState(message: 'Belum ada pengajuan lahan');
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              itemCount: s.items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _ProposalCard(item: s.items[i]),
            );
          }
          return const LoadingState();
        },
      ),
    );
  }
}

class _ProposalCard extends StatelessWidget {
  const _ProposalCard({required this.item});
  final LandProposalItem item;

  Color _statusColor() => switch (item.status) {
    'approved' => const Color(0xFF22C55E),
    'rejected' => Colors.red,
    'cancelled' => Colors.grey,
    _ => const Color(0xFFF59E0B),
  };

  String _statusText() => switch (item.status) {
    'approved' => 'Disetujui',
    'rejected' => 'Ditolak',
    'cancelled' => 'Dibatalkan',
    _ => 'Menunggu',
  };

  @override
  Widget build(BuildContext context) {
    final c = _statusColor();
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push<LandProposalItem>(context, MaterialPageRoute<LandProposalItem>(
          builder: (_) => BlocProvider.value(
            value: context.read<LandProposalBloc>(),
            child: _ProposalDetailPage(item: item),
          ),
        )),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(item.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12), border: Border.all(color: c.withValues(alpha: 0.3))),
                  child: Text(_statusText(), style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ]),
              const SizedBox(height: 8),
              Wrap(spacing: 12, runSpacing: 4, children: [
                _tag(Icons.map, item.blockNo ?? '-'),
                if (item.noPlot != null) _tag(Icons.numbers, 'Plot: ${item.noPlot}'),
                if (item.cgr != null) _tag(Icons.agriculture, 'CGR: ${item.cgr}'),
                if (item.nis != null) _tag(Icons.badge, 'NIS: ${item.nis}'),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                Icon(Icons.location_on, size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Expanded(child: Text(
                  [item.desaName, item.kecamatanName, item.kabupatenName].whereType<String>().where((e) => e.isNotEmpty).join(', ').isEmpty ? '-' : [item.desaName, item.kecamatanName, item.kabupatenName].whereType<String>().where((e) => e.isNotEmpty).join(', '),
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                )),
              ]),
              if (item.photos.isNotEmpty) ...[
                const SizedBox(height: 6),
                Row(children: [
                  Icon(Icons.photo, size: 14, color: Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Text('${item.photos.length} foto', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                ]),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag(IconData icon, String text) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [Icon(icon, size: 13, color: Colors.grey.shade500), const SizedBox(width: 3), Text(text, style: TextStyle(fontSize: 11, color: Colors.grey.shade700))],
  );
}

class _CreateProposalPage extends StatefulWidget {
  const _CreateProposalPage();
  @override
  State<_CreateProposalPage> createState() => _CreateProposalPageState();
}

class _CreateProposalPageState extends State<_CreateProposalPage> {
  final _formKey = GlobalKey<FormState>();
  final _memberCtrl = TextEditingController();
  final _blockCtrl = TextEditingController();
  final _noPlotCtrl = TextEditingController();
  final _docNoCtrl = TextEditingController();
  final _cgrCtrl = TextEditingController();
  final _nisCtrl = TextEditingController();
  final _phTanamCtrl = TextEditingController();
  final _realTanamCtrl = TextEditingController();
  final _detaselingCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String? _kabupatenId, _kecamatanId, _desaId;
  DateTime? _tglTanam, _rencanaPanen;
  double? _latitude, _longitude, _accuracy;
  bool _gpsLoading = false;
  List<Map<String, dynamic>> _kabupatens = [], _kecamatans = [], _desas = [];

  @override
  void initState() {
    super.initState();
    _loadRegions();
  }

  Future<void> _loadRegions() async {
    try {
      final kabs = await supabase.from('kabupaten').select('id, name').order('name') as List;
      if (mounted) setState(() => _kabupatens = kabs.cast<Map<String, dynamic>>());
    } catch (_) {}
  }

  Future<void> _loadKecamatan(String kabId) async {
    try {
      final kecs = await supabase.from('kecamatan').select('id, name').eq('kabupaten_id', kabId).order('name') as List;
      if (mounted) setState(() { _kecamatans = kecs.cast<Map<String, dynamic>>(); _kecamatanId = null; _desaId = null; _desas = []; });
    } catch (_) {}
  }

  Future<void> _loadDesa(String kecId) async {
    try {
      final ds = await supabase.from('desa').select('id, name').eq('kecamatan_id', kecId).order('name') as List;
      if (mounted) setState(() { _desas = ds.cast<Map<String, dynamic>>(); _desaId = null; });
    } catch (_) {}
  }

  Future<void> _captureGps() async {
    setState(() => _gpsLoading = true);
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) return;
      }
      if (perm == LocationPermission.deniedForever) return;
      if (!await Geolocator.isLocationServiceEnabled()) return;
      final pos = await Geolocator.getCurrentPosition(timeLimit: const Duration(seconds: 15));
      if (mounted) setState(() { _latitude = pos.latitude; _longitude = pos.longitude; _accuracy = pos.accuracy; });
    } catch (_) {} finally {
      if (mounted) setState(() => _gpsLoading = false);
    }
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_kabupatenId == null || _kecamatanId == null || _desaId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Wilayah wajib diisi')));
      return;
    }
    final payload = <String, dynamic>{
      'kabupaten_id': _kabupatenId,
      'kecamatan_id': _kecamatanId,
      'desa_id': _desaId,
      'member_name': _memberCtrl.text.isEmpty ? null : _memberCtrl.text,
      'block_no': _blockCtrl.text.isEmpty ? null : _blockCtrl.text,
      'no_plot': _noPlotCtrl.text.isEmpty ? null : _noPlotCtrl.text,
      'document_no': _docNoCtrl.text.isEmpty ? null : _docNoCtrl.text,
      'cgr': _cgrCtrl.text.isEmpty ? null : _cgrCtrl.text,
      'nis': _nisCtrl.text.isEmpty ? null : _nisCtrl.text,
      'ph_tanah': double.tryParse(_phTanamCtrl.text),
      'real_tanam_ha': double.tryParse(_realTanamCtrl.text),
      'detaseling': _detaselingCtrl.text.isEmpty ? null : _detaselingCtrl.text,
      'tgl_tanam': _tglTanam?.toIso8601String().split('T').first,
      'rencana_panen': _rencanaPanen?.toIso8601String().split('T').first,
      'notes': _notesCtrl.text.isEmpty ? null : _notesCtrl.text,
      'latitude': _latitude,
      'longitude': _longitude,
      'accuracy': _accuracy,
    };
    context.read<LandProposalBloc>().add(LandProposalCreate(payload));
    Navigator.pop(context);
  }

  @override
  void dispose() {
    for (final c in [_memberCtrl, _blockCtrl, _noPlotCtrl, _docNoCtrl, _cgrCtrl, _nisCtrl, _phTanamCtrl, _realTanamCtrl, _detaselingCtrl, _notesCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pengajuan Lahan Baru')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Wilayah *', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _kabupatenId,
              decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12), isDense: true),
              hint: const Text('Kabupaten'),
              items: _kabupatens.map((k) => DropdownMenuItem(value: k['id'] as String, child: Text(k['name'] as String))).toList(),
              onChanged: (v) { setState(() => _kabupatenId = v); if (v != null) _loadKecamatan(v); },
              validator: (v) => v == null ? 'Wajib' : null,
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _kecamatanId,
              decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12), isDense: true),
              hint: const Text('Kecamatan'),
              items: _kecamatans.map((k) => DropdownMenuItem(value: k['id'] as String, child: Text(k['name'] as String))).toList(),
              onChanged: (v) { setState(() => _kecamatanId = v); if (v != null) _loadDesa(v); },
              validator: (v) => v == null ? 'Wajib' : null,
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _desaId,
              decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12), isDense: true),
              hint: const Text('Desa'),
              items: _desas.map((k) => DropdownMenuItem(value: k['id'] as String, child: Text(k['name'] as String))).toList(),
              onChanged: (v) => setState(() => _desaId = v),
              validator: (v) => v == null ? 'Wajib' : null,
            ),
            const SizedBox(height: 16),
            const Text('Data Plot', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _field('Nama Member', _memberCtrl),
            _field('Block No', _blockCtrl),
            _field('No Plot', _noPlotCtrl),
            _field('Document No', _docNoCtrl),
            _field('CGR', _cgrCtrl),
            _field('NIS', _nisCtrl),
            _field('PH Tanah (ha)', _phTanamCtrl, keyboard: TextInputType.number),
            _field('Real Tanam (ha)', _realTanamCtrl, keyboard: TextInputType.number),
            _field('Detaseling', _detaselingCtrl),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: OutlinedButton.icon(
                icon: const Icon(Icons.calendar_today, size: 16),
                label: Text(_tglTanam != null ? 'Tanam: ${_tglTanam!.toIso8601String().split('T').first}' : 'Tgl Tanam'),
                onPressed: () async { final d = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2030)); if (d != null) setState(() => _tglTanam = d); },
              )),
              const SizedBox(width: 8),
              Expanded(child: OutlinedButton.icon(
                icon: const Icon(Icons.calendar_today, size: 16),
                label: Text(_rencanaPanen != null ? 'Panen: ${_rencanaPanen!.toIso8601String().split('T').first}' : 'Renc. Panen'),
                onPressed: () async { final d = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2030)); if (d != null) setState(() => _rencanaPanen = d); },
              )),
            ]),
            const SizedBox(height: 12),
            _field('Catatan', _notesCtrl, maxLines: 3),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Lokasi GPS', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (_latitude != null)
                    Text('Lat: ${_latitude!.toStringAsFixed(6)}, Lng: ${_longitude!.toStringAsFixed(6)} (±${_accuracy?.toStringAsFixed(0)}m)', style: const TextStyle(fontSize: 13))
                  else
                    const Text('Belum ada lokasi', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 8),
                  SizedBox(width: double.infinity, child: FilledButton.icon(
                    icon: _gpsLoading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.my_location, size: 18),
                    label: const Text('Ambil Lokasi'),
                    onPressed: _gpsLoading ? null : _captureGps,
                  )),
                ]),
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              icon: const Icon(Icons.send, size: 18),
              label: const Text('Kirim Pengajuan'),
              onPressed: _submit,
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {TextInputType? keyboard, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextFormField(
        controller: ctrl,
        keyboardType: keyboard,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder(), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12), isDense: true),
      ),
    );
  }
}

class _ProposalDetailPage extends StatelessWidget {
  const _ProposalDetailPage({required this.item});
  final LandProposalItem item;

  Color _statusColor() => switch (item.status) {
    'approved' => const Color(0xFF22C55E),
    'rejected' => Colors.red,
    'cancelled' => Colors.grey,
    _ => const Color(0xFFF59E0B),
  };

  String _statusText() => switch (item.status) {
    'approved' => 'Disetujui',
    'rejected' => 'Ditolak',
    'cancelled' => 'Dibatalkan',
    _ => 'Menunggu',
  };

  @override
  Widget build(BuildContext context) {
    final c = _statusColor();
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Pengajuan')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(item.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12), border: Border.all(color: c.withValues(alpha: 0.3))),
                    child: Text(_statusText(), style: TextStyle(color: c, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ]),
                const Divider(height: 20),
                _info('Wilayah', [item.desaName, item.kecamatanName, item.kabupatenName].whereType<String>().where((e) => e.isNotEmpty).join(', ').isEmpty ? null : [item.desaName, item.kecamatanName, item.kabupatenName].whereType<String>().where((e) => e.isNotEmpty).join(', ')),
                _info('Block', item.blockNo),
                _info('No Plot', item.noPlot),
                _info('Document No', item.documentNo),
                _info('CGR', item.cgr),
                _info('NIS', item.nis),
                _info('PH Tanam', item.phTanam != null ? '${item.phTanam} ha' : null),
                _info('Real Tanam', item.realTanamHa != null ? '${item.realTanamHa} ha' : null),
                _info('Detaseling', item.detaseling),
                _info('Tgl Tanam', item.tglTanam),
                _info('Renc. Panen', item.rencanaPanen),
                _info('Pengaju', item.proposedByName),
                _info('Reviewer', item.reviewedByName),
                if (item.latitude != null) _info('GPS', 'Lat: ${item.latitude!.toStringAsFixed(6)}, Lng: ${item.longitude!.toStringAsFixed(6)}'),
                if (item.reviewNote != null) ...[
                  const Divider(height: 20),
                  const Text('Catatan Review', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                  const SizedBox(height: 4),
                  Text(item.reviewNote!, style: const TextStyle(fontSize: 13)),
                ],
                if (item.notes != null && item.notes!.isNotEmpty) ...[
                  const Divider(height: 20),
                  const Text('Catatan', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(item.notes!, style: const TextStyle(fontSize: 13)),
                ],
              ]),
            ),
          ),
          if (item.photos.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('Foto', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            SizedBox(
              height: 120,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: item.photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final ph = item.photos[i];
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(ph.url, width: 120, height: 120, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(width: 120, height: 120, color: Colors.grey.shade200, child: const Icon(Icons.broken_image, color: Colors.grey)),
                    ),
                  );
                },
              ),
            ),
          ],
          const SizedBox(height: 16),
          BlocBuilder<LandProposalBloc, LandProposalState>(
            builder: (ctx, state) {
              return FutureBuilder<AuthContext?>(
                future: getAuthContextAsync(),
                builder: (_, snap) {
                  final auth = snap.data;
                  final canReview = auth != null && (auth.role == UserRole.admin || auth.role == UserRole.qc);
                  final canCancel = item.status == 'pending' && auth != null;

                  return Column(children: [
                    if (canReview && item.status == 'pending') ...[
                      Row(children: [
                        Expanded(child: OutlinedButton.icon(
                          icon: const Icon(Icons.check, size: 18),
                          label: const Text('Setujui'),
                          style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF22C55E), side: const BorderSide(color: Color(0xFF22C55E))),
                          onPressed: () => _confirmAction(ctx, 'Setujui?', () => ctx.read<LandProposalBloc>().add(LandProposalApprove(item.id))),
                        )),
                        const SizedBox(width: 8),
                        Expanded(child: OutlinedButton.icon(
                          icon: const Icon(Icons.close, size: 18),
                          label: const Text('Tolak'),
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
                          onPressed: () => _showRejectDialog(ctx),
                        )),
                      ]),
                      const SizedBox(height: 8),
                    ],
                    if (canCancel) ...[
                      SizedBox(width: double.infinity, child: OutlinedButton.icon(
                        icon: const Icon(Icons.cancel_outlined, size: 18),
                        label: const Text('Batalkan Pengajuan'),
                        style: OutlinedButton.styleFrom(foregroundColor: Colors.grey),
                        onPressed: () => _confirmAction(ctx, 'Batalkan pengajuan ini?', () => ctx.read<LandProposalBloc>().add(LandProposalCancel(item.id))),
                      )),
                    ],
                  ]);
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _info(String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(width: 100, child: Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade500))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
      ]),
    );
  }

  void _confirmAction(BuildContext ctx, String message, VoidCallback onConfirm) {
    showDialog(context: ctx, builder: (c) => AlertDialog(
      title: const Text('Konfirmasi'),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c), child: const Text('Batal')),
        FilledButton(onPressed: () { Navigator.pop(c); onConfirm(); Navigator.pop(ctx); }, child: const Text('Ya')),
      ],
    ));
  }

  void _showRejectDialog(BuildContext ctx) {
    final ctrl = TextEditingController();
    showDialog(context: ctx, builder: (c) => AlertDialog(
      title: const Text('Tolak Pengajuan'),
      content: TextField(controller: ctrl, maxLines: 3, decoration: const InputDecoration(hintText: 'Alasan penolakan *', border: OutlineInputBorder())),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c), child: const Text('Batal')),
        FilledButton(
          onPressed: () {
            if (ctrl.text.trim().isEmpty) return;
            Navigator.pop(c);
            ctx.read<LandProposalBloc>().add(LandProposalReject(item.id, ctrl.text.trim()));
            Navigator.pop(ctx);
          },
          child: const Text('Tolak'),
        ),
      ],
    ));
  }
}

Future<AuthContext?> getAuthContextAsync() async {
  try {
    return await getAuthContext().timeout(const Duration(seconds: 5));
  } catch (_) {
    return null;
  }
}
