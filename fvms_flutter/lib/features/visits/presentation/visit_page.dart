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
        appBar: AppBar(title: const Text('Detail Kunjungan')),
        body: BlocBuilder<VisitBloc, VisitState>(
          builder: (c, s) {
            if (s is VisitInitial || s is VisitLoading) return const LoadingState();
            if (s is VisitError) return ErrorState(message: s.message, onRetry: () => c.read<VisitBloc>().add(VisitLoad()));
            if (s is VisitLoaded) {
              final d = s.data;
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                children: [
                  _InfoCard(data: d),
                  const SizedBox(height: 12),
                  _StatusCard(current: d.status, onChanged: (ns) => c.read<VisitBloc>().add(VisitStatusChanged(ns))),
                  const SizedBox(height: 12),
                  _NotesCard(visitBloc: c.read<VisitBloc>(), notes: d.notesField),
                  const SizedBox(height: 12),
                  _GpsCard(visitBloc: c.read<VisitBloc>(), lat: d.latitude, lng: d.longitude),
                  const SizedBox(height: 12),
                  _PhotosCard(photos: d.photos),
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

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.data});
  final VisitDetail data;

  Color _statusColor() {
    switch (data.status) {
      case 'completed': return const Color(0xFF22C55E);
      case 'gagal_total': return Colors.red;
      case 'gagal_partial': return Colors.orange;
      case 'in_progress': return const Color(0xFF8B5CF6);
      default: return const Color(0xFFF59E0B);
    }
  }

  String _statusLabel() {
    switch (data.status) {
      case 'completed': return 'Selesai';
      case 'gagal_total': return 'Gagal Total';
      case 'gagal_partial': return 'Gagal Partial';
      case 'in_progress': return 'Dikerjakan';
      case 'pending': return 'Pending';
      default: return data.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColor();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(data.memberName ?? '-', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: color.withValues(alpha: 0.3)),
                  ),
                  child: Text(_statusLabel(), style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _infoRow(Icons.category_outlined, 'Block', data.blockNo),
            _infoRow(Icons.numbers, 'NIS', data.nis),
            _infoRow(Icons.agriculture_outlined, 'CGR', data.cgr),
            _infoRow(Icons.calendar_today, 'Tanggal', data.visitDate),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(fontSize: 13, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.current, required this.onChanged});
  final String current;
  final ValueChanged<String> onChanged;
  @override
  Widget build(BuildContext context) {
    final opts = statusTransitions[VisitStatusX.fromString(current)] ?? [];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ubah Status', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            if (opts.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: opts.map((o) {
                  final c = _statusColor(o.value);
                  return ActionChip(
                    label: Text(o.label, style: TextStyle(color: c, fontWeight: FontWeight.w600)),
                    side: BorderSide(color: c.withValues(alpha: 0.4)),
                    backgroundColor: c.withValues(alpha: 0.06),
                    onPressed: () => onChanged(o.value),
                  );
                }).toList(),
              )
            else
              const Text('Tidak ada transisi tersedia', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'completed': return const Color(0xFF22C55E);
      case 'gagal_total': return Colors.red;
      case 'gagal_partial': return Colors.orange;
      case 'in_progress': return const Color(0xFF8B5CF6);
      default: return const Color(0xFFF59E0B);
    }
  }
}

class _NotesCard extends StatefulWidget {
  const _NotesCard({required this.visitBloc, required this.notes});
  final VisitBloc visitBloc;
  final Map<String, String?> notes;
  @override
  State<_NotesCard> createState() => _NotesCardState();
}
class _NotesCardState extends State<_NotesCard> {
  late final obs = TextEditingController(text: widget.notes['observation'] ?? '');
  late final prob = TextEditingController(text: widget.notes['problem'] ?? '');
  late final rec = TextEditingController(text: widget.notes['recommend'] ?? '');

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Catatan Kunjungan', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            TextField(controller: obs, maxLines: 3, decoration: const InputDecoration(labelText: 'Observasi', border: OutlineInputBorder(), alignLabelWithHint: true)),
            const SizedBox(height: 10),
            TextField(controller: prob, maxLines: 2, decoration: const InputDecoration(labelText: 'Masalah', border: OutlineInputBorder(), alignLabelWithHint: true)),
            const SizedBox(height: 10),
            TextField(controller: rec, maxLines: 2, decoration: const InputDecoration(labelText: 'Rekomendasi', border: OutlineInputBorder(), alignLabelWithHint: true)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                icon: const Icon(Icons.save, size: 18),
                label: const Text('Simpan Catatan'),
                onPressed: () => widget.visitBloc.add(VisitNotesSaved({
                  'observation': obs.text,
                  'problem': prob.text,
                  'recommend': rec.text,
                })),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GpsCard extends StatelessWidget {
  const _GpsCard({required this.visitBloc, this.lat, this.lng});
  final VisitBloc visitBloc;
  final double? lat;
  final double? lng;
  @override
  Widget build(BuildContext context) {
    final has = lat != null && lng != null;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Lokasi GPS', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                height: 200,
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: has ? LatLng(lat!, lng!) : const LatLng(-6.2, 106.8),
                    initialZoom: has ? 16 : 5,
                  ),
                  children: [
                    TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
                    if (has) MarkerLayer(markers: [
                      Marker(point: LatLng(lat!, lng!), child: const Icon(Icons.location_on, color: Colors.red, size: 36)),
                    ]),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(has ? 'Lat: ${lat!.toStringAsFixed(6)}, Lng: ${lng!.toStringAsFixed(6)}' : 'Belum ada lokasi GPS', style: TextStyle(color: has ? Colors.black87 : Colors.grey)),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                icon: const Icon(Icons.my_location, size: 18),
                label: const Text('Ambil Lokasi Sekarang'),
                onPressed: () async {
                  try {
                    final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
                    visitBloc.add(VisitGpsCaptured(pos.latitude, pos.longitude, pos.accuracy));
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('GPS gagal: $e')));
                    }
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhotosCard extends StatelessWidget {
  const _PhotosCard({required this.photos});
  final List<VisitPhotoLite> photos;
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(child: Text('Foto', style: TextStyle(fontWeight: FontWeight.bold))),
                Text('${photos.length} foto', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 10),
            if (photos.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(Icons.photo_camera_outlined, size: 40, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('Belum ada foto', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              )
            else
              GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 6,
                crossAxisSpacing: 6,
                children: photos.map((p) => ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: p.url.isEmpty
                      ? ColoredBox(color: Colors.grey.shade200, child: const Icon(Icons.image, color: Colors.grey))
                      : Image.network(p.url, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => ColoredBox(color: Colors.grey.shade200, child: const Icon(Icons.broken_image, color: Colors.grey)),
                        ),
                )).toList(),
              ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              icon: const Icon(Icons.camera_alt, size: 18),
              label: const Text('Ambil Foto'),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                  content: Text('Fitur foto segera hadir'),
                ));
              },
            ),
          ],
        ),
      ),
    );
  }
}
