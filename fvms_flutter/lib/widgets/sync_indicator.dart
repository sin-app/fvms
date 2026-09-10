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
            icon = Icons.sync;
            color = Colors.blue;
            label = 'Sync...';
          case SyncStatus.offline:
            icon = Icons.cloud_off;
            color = Colors.orange;
            label = 'Luring';
          default:
            icon = Icons.cloud_done;
            color = Colors.green;
            label = s.pending > 0 ? '${s.pending} antri' : 'Online';
        }
        return Tooltip(
          message: s.status == SyncStatus.offline
              ? 'Mode luring: perubahan disimpan lokal'
              : s.pending > 0
                  ? '${s.pending} perubahan menunggu sync'
                  : 'Terhubung ke server',
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (s.status == SyncStatus.syncing)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Icon(icon, size: 14, color: color),
                const SizedBox(width: 5),
                Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
              ],
            ),
          ),
        );
      },
    );
  }
}
