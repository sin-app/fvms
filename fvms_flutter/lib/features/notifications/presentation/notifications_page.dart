import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/notifications/bloc/notifications_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => NotificationsBloc()..add(NotificationsLoad()),
      child: Scaffold(
        appBar: AppBar(title: const Text('Notifikasi')),
        body: BlocBuilder<NotificationsBloc, NotificationsState>(
          builder: (c, s) {
            if (s is NotificationsLoading) return const LoadingState();
            if (s is NotificationsError) return ErrorState(message: s.message);
            if (s is NotificationsLoaded) {
              if (s.items.isEmpty) return const EmptyState(message: 'Tidak ada notifikasi');
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: s.items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) => Card(child: ListTile(leading: Icon(s.items[i].isRead ? Icons.notifications_none : Icons.notifications_active, color: s.items[i].isRead ? Colors.grey : const Color(0xFF10B981)), title: Text(s.items[i].title), subtitle: Text(s.items[i].message), trailing: s.items[i].isRead ? null : const CircleAvatar(radius: 4, backgroundColor: Color(0xFF10B981)))) ,
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
