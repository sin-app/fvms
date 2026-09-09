import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:fvms_flutter/core/constants/status.dart';
import 'package:fvms_flutter/features/visits/bloc/visit_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

class VisitPage extends StatelessWidget {
  const VisitPage({required this.id, super.key});
  final String id;
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => VisitBloc(scheduleId: id)..add(VisitLoad()),
      child: Scaffold(
        appBar: AppBar(title: Text('Visit $id')),
        body: BlocBuilder<VisitBloc, VisitState>(
          builder: (c, s) {
            if (s is VisitInitial || s is VisitLoading) return const LoadingState();
            if (s is VisitError) return ErrorState(message: s.message, onRetry: () => c.read<VisitBloc>().add(VisitLoad()));
            if (s is VisitLoaded) {
              final d = s.data;
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                children: [
                  Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(d.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)), Text('${d.blockNo ?? '-'} • ${d.nis ?? '-'}'), const SizedBox(height: 8), _StatusChip(status: d.status)]))),
                  const SizedBox(height: 12),
                  _NotesCard(visitBloc: c.read<VisitBloc>(), notes: d.notesField),
                  const SizedBox(height: 12),
                  _GpsCard(visitBloc: c.read<VisitBloc>(), lat: d.latitude, lng: d.longitude, status: d.status),
                  const SizedBox(height: 12),
                  _PhotosCard(photos: d.photos),
                  const SizedBox(height: 12),
                  _StatusSelector(current: d.status, onChanged: (ns) => c.read<VisitBloc>().add(VisitStatusChanged(ns))),
                ],
              );
            }
            return const LoadingState();
          },
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;
  @override
  Widget build(BuildContext context) {
    Color c;
    switch (status) { case 'completed': c = Colors.green; case 'gagal_total': c = Colors.red; case 'gagal_partial': c = Colors.orange; case 'in_progress': c = Colors.purple; default: c = Colors.amber; }
    return Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: c.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: c)), child: Text(status, style: TextStyle(color: c, fontWeight: FontWeight.w600, fontSize: 12)));
  }
}

class _NotesCard extends StatefulWidget {
  const _NotesCard({required this.visitBloc, required this.notes});
  final VisitBloc visitBloc; final Map<String, String?> notes;
  @override
  State<_NotesCard> createState() => _NotesCardState();
}
class _NotesCardState extends State<_NotesCard> {
  late final obs = TextEditingController(text: widget.notes['observation'] ?? '');
  late final prob = TextEditingController(text: widget.notes['problem'] ?? '');
  late final rec = TextEditingController(text: widget.notes['recommend'] ?? '');
  @override
  Widget build(BuildContext context) {
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Catatan Kunjungan', style: TextStyle(fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      TextField(controller: obs, maxLines: 3, decoration: const InputDecoration(labelText: 'Observasi', border: OutlineInputBorder())),
      const SizedBox(height: 8),
      TextField(controller: prob, maxLines: 2, decoration: const InputDecoration(labelText: 'Masalah', border: OutlineInputBorder())),
      const SizedBox(height: 8),
      TextField(controller: rec, maxLines: 2, decoration: const InputDecoration(labelText: 'Rekomendasi', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      SizedBox(width: double.infinity, child: FilledButton(onPressed: () => widget.visitBloc.add(VisitNotesSaved({'observation': obs.text, 'problem': prob.text, 'recommend': rec.text})), child: const Text('Simpan Catatan'))),
    ],),),);
  }
}

class _GpsCard extends StatelessWidget {
  const _GpsCard({required this.visitBloc, required this.status, this.lat, this.lng});
  final VisitBloc visitBloc; final double? lat;
  final double? lng; final String status;
  @override
  Widget build(BuildContext context) {
    final has = lat != null && lng != null;
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('GPS', style: TextStyle(fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      SizedBox(height: 180, child: FlutterMap(options: MapOptions(initialCenter: has ? LatLng(lat!, lng!) : const LatLng(-6.2, 106.8), initialZoom: has ? 16 : 5), children: [TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'), if (has) MarkerLayer(markers: [Marker(point: LatLng(lat!, lng!), child: const Icon(Icons.location_on, color: Colors.red, size: 32))])])),
      const SizedBox(height: 8),
      Text(has ? 'Lat: $lat, Lng: $lng' : 'Belum ada GPS'),
      const SizedBox(height: 8),
      FilledButton.icon(icon: const Icon(Icons.my_location), label: const Text('Ambil GPS'), onPressed: () async {
        try {
          final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
          visitBloc.add(VisitGpsCaptured(pos.latitude, pos.longitude, pos.accuracy));
        } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('GPS gagal: $e'))); }
      },),
    ],),),);
  }
}

class _PhotosCard extends StatelessWidget {
  const _PhotosCard({required this.photos});
  final List<VisitPhotoLite> photos;
  @override
  Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Foto', style: TextStyle(fontWeight: FontWeight.bold)), const SizedBox(height: 8), if (photos.isEmpty) const Text('Belum ada foto', style: TextStyle(color: Colors.grey)) else GridView.count(crossAxisCount: 3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), children: photos.map((p) => Card(child: p.url.isEmpty ? const Icon(Icons.image) : Image.network(p.url, fit: BoxFit.cover, errorBuilder: (_,__,___)=> const Icon(Icons.broken_image)))).toList()), const SizedBox(height: 8), OutlinedButton.icon(icon: const Icon(Icons.camera_alt), label: const Text('Ambil Foto'), onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload foto via image_picker - F3 implementasi storage'))))])));

}

class _StatusSelector extends StatelessWidget {
  const _StatusSelector({required this.current, required this.onChanged});
  final String current; final ValueChanged<String> onChanged;
  @override
  Widget build(BuildContext context) {
    final opts = statusTransitions[VisitStatusX.fromString(current)] ?? [];
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Status', style: TextStyle(fontWeight: FontWeight.bold)), const SizedBox(height: 8), Wrap(spacing: 8, children: opts.map((o) => ActionChip(label: Text(o.label), onPressed: () => onChanged(o.value))).toList()), if (opts.isEmpty) const Text('Tidak ada transisi', style: TextStyle(color: Colors.grey))])) );
  }
}
