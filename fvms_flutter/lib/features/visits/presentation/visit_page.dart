import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:fvms_flutter/core/constants/status.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/features/visits/bloc/visit_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

class VisitPage extends StatelessWidget {
  const VisitPage({required this.id, super.key});
  final String id;
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => VisitBloc(scheduleId: id)..add(VisitLoad()),
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (didPop) return;
          context.go('/jadwal');
        },
        child: Scaffold(
          appBar: AppBar(title: const Text('Detail Kunjungan')),
        body: BlocBuilder<VisitBloc, VisitState>(
          builder: (c, s) {
            if (s is VisitInitial || s is VisitLoading) return const LoadingState();
            if (s is VisitError) return ErrorState(message: s.message, onRetry: () => c.read<VisitBloc>().add(VisitLoad()));
            if (s is VisitLoaded || s is VisitUploading) {
              final d = s is VisitUploading ? s.data : (s as VisitLoaded).data;
              final uploading = s is VisitUploading;
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                children: [
                  _InfoCard(data: d),
                  const SizedBox(height: 12),
                  _StatusCard(current: d.status, label: d.label, onChanged: (ns) => c.read<VisitBloc>().add(VisitStatusChanged(ns)), onLabelChanged: (l) => c.read<VisitBloc>().add(VisitLabelChanged(l))),
                  const SizedBox(height: 12),
                  _NotesCard(visitBloc: c.read<VisitBloc>(), notes: d.notesField),
                  const SizedBox(height: 12),
                  _GpsCard(visitBloc: c.read<VisitBloc>(), lat: d.latitude, lng: d.longitude),
                  const SizedBox(height: 12),
                  _PhotosCard(visitBloc: c.read<VisitBloc>(), photos: d.photos, uploading: uploading),
                ],
              );
            }
            return const LoadingState();
          },
        ),
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
            _infoRow(Icons.numbers, 'Plot', data.noPlot),
            _infoRow(Icons.numbers, 'NIS', data.nis),
            _infoRow(Icons.agriculture_outlined, 'CGR', data.cgr),
            _infoRow(Icons.description_outlined, 'Doc No', data.documentNo),
            _infoRow(Icons.calendar_today, 'Tanggal', data.visitDate),
            if (data.detaseling != null && data.detaseling!.isNotEmpty)
              _infoRow(Icons.swap_horiz, 'Detaseling', data.detaseling),
            const Divider(height: 20),
            _infoRow(Icons.location_city, 'Kabupaten', data.kabupatenName),
            _infoRow(Icons.map_outlined, 'Kecamatan', data.kecamatanName),
            _infoRow(Icons.home_outlined, 'Desa', data.desaName),
            if (data.petugasName != null && data.petugasName!.isNotEmpty)
              _infoRow(Icons.person_outlined, 'Petugas', data.petugasName),
            const Divider(height: 20),
            _infoRow(Icons.spa_outlined, 'Tgl Tanam', data.tglTanam),
            _infoRow(Icons.landscape_outlined, 'Real Tanam', data.realTanamHa != null ? '${data.realTanamHa} ha' : null),
            _infoRow(Icons.warning_amber_outlined, 'Gagal Tanam', data.gagalTanam != null ? '${data.gagalTanam} ha' : null),
            _infoRow(Icons.grass_outlined, 'Sisa Lahan', data.sisaDiLahanHa != null ? '${data.sisaDiLahanHa} ha' : null),
            if (data.panenStatus != '—') ...[
              const Divider(height: 20),
              _infoRow(Icons.eco_outlined, 'Panen', data.panenStatus),
            ],
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
  const _StatusCard({required this.current, this.label, required this.onChanged, required this.onLabelChanged});
  final String current;
  final String? label;
  final ValueChanged<String> onChanged;
  final ValueChanged<String?> onLabelChanged;
  @override
  Widget build(BuildContext context) {
    final opts = statusTransitions[VisitStatusX.fromString(current)] ?? [];
    final canSetLabel = isSupabaseInitialized && supabase.auth.currentUser != null;
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
            if (canSetLabel) ...[
              const Divider(height: 24),
              const Text('Label QC', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _LabelSelector(current: label, onChanged: onLabelChanged),
            ],
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

class _LabelSelector extends StatelessWidget {
  const _LabelSelector({this.current, required this.onChanged});
  final String? current;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _labelChip('Hijau', 'hijau', const Color(0xFF22C55E)),
        _labelChip('Kuning', 'kuning', const Color(0xFFF59E0B)),
        _labelChip('Merah', 'merah', Colors.red),
        _labelChip('Tanpa Label', null, Colors.grey),
      ],
    );
  }

  Widget _labelChip(String text, String? value, Color color) {
    final isActive = current == value;
    return FilterChip(
      label: Text(text, style: TextStyle(
        color: isActive ? Colors.white : color,
        fontWeight: FontWeight.w600,
        fontSize: 12,
      )),
      selected: isActive,
      onSelected: (_) => onChanged(isActive ? null : value),
      backgroundColor: color.withValues(alpha: 0.08),
      selectedColor: color,
      side: BorderSide(color: color.withValues(alpha: 0.4)),
      checkmarkColor: Colors.white,
      visualDensity: VisualDensity.compact,
    );
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
  void dispose() {
    obs.dispose();
    prob.dispose();
    rec.dispose();
    super.dispose();
  }

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
                child: Stack(
                  children: [
                    FlutterMap(
                      options: MapOptions(
                        initialCenter: has ? LatLng(lat!, lng!) : const LatLng(-6.2, 106.8),
                        initialZoom: has ? 16 : 5,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'id.sinapp.fvms',
                          tileProvider: NetworkTileProvider(
                            headers: {
                              'User-Agent': 'id.sinapp.fvms/1.0 (fvms-field-visit-app; https://fvms-eight.vercel.app)',
                            },
                          ),
                        ),
                        if (has) MarkerLayer(markers: [
                          Marker(point: LatLng(lat!, lng!), child: const Icon(Icons.location_on, color: Colors.red, size: 36)),
                        ]),
                      ],
                    ),
                    const Positioned(
                      right: 4,
                      bottom: 4,
                      child: DecoratedBox(
                        decoration: BoxDecoration(color: Colors.white70, borderRadius: BorderRadius.all(Radius.circular(4))),
                        child: Padding(
                          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          child: Text('© OpenStreetMap', style: TextStyle(fontSize: 9, color: Colors.black54)),
                        ),
                      ),
                    ),
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
                    var permission = await Geolocator.checkPermission();
                    if (permission == LocationPermission.denied) {
                      permission = await Geolocator.requestPermission();
                      if (permission == LocationPermission.denied) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Izin lokasi ditolak')));
                        }
                        return;
                      }
                    }
                    if (permission == LocationPermission.deniedForever) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('Izin lokasi permanently ditolak. Buka Pengaturan aplikasi.'),
                          action: SnackBarAction(label: 'Buka', onPressed: Geolocator.openAppSettings),
                        ));
                      }
                      return;
                    }
                    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
                    if (!serviceEnabled) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Layanan lokasi mati. Aktifkan GPS.')));
                      }
                      return;
                    }
                    final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
                    visitBloc.add(VisitGpsCaptured(pos.latitude, pos.longitude, pos.accuracy));
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal mengambil lokasi. Pastikan GPS aktif.')));
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
  const _PhotosCard({required this.visitBloc, required this.photos, this.uploading = false});
  final VisitBloc visitBloc;
  final List<VisitPhotoLite> photos;
  final bool uploading;
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
            if (uploading)
              const Padding(
                padding: EdgeInsets.all(8),
                child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
              )
            else
              Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.camera_alt, size: 18),
                    label: const Text('Kamera'),
                    onPressed: () async {
                      final picker = ImagePicker();
                      final photo = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
                      if (photo != null && context.mounted) {
                        visitBloc.add(VisitPhotoUploaded(photo.path));
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.photo_library, size: 18),
                    label: const Text('Galeri'),
                    onPressed: () async {
                      final picker = ImagePicker();
                      final photo = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
                      if (photo != null && context.mounted) {
                        visitBloc.add(VisitPhotoUploaded(photo.path));
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
