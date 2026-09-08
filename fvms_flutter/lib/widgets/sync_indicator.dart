import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/offline/sync_bloc.dart';

class SyncIndicator extends StatelessWidget {
  const SyncIndicator({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SyncBloc, SyncState>(
      builder: (c, s) {
        IconData icon;
        Color color;
        String label;
        switch (s.status) {
          case SyncStatus.syncing:
            icon = Icons.sync; color = Colors.blue; label = 'Sync...';
          case SyncStatus.offline:
            icon = Icons.cloud_off; color = Colors.orange; label = 'Luring';
          default:
            icon = Icons.cloud_done; color = Colors.green; label = s.pending > 0 ? '${s.pending} antri' : 'Online';
        }
        return Chip(avatar: Icon(icon, size: 16, color: color), label: Text(label, style: const TextStyle(fontSize: 11)), visualDensity: VisualDensity.compact);
      },
    );
  }
}
