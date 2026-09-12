import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';
import 'package:fvms_flutter/features/dashboard/bloc/dashboard_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:fvms_flutter/widgets/sync_indicator.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});
  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late final DashboardBloc _bloc;
  @override
  void initState() {
    super.initState();
    _bloc = DashboardBloc()..add(DashboardLoad());
  }

  @override
  void dispose() {
    _bloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _bloc,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('FVMS'),
          actions: [
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: SyncIndicator(),
            ),
            Builder(builder: (btnCtx) => IconButton(
              icon: const Icon(Icons.notifications_none),
              onPressed: () => GoRouter.of(btnCtx).go('/notifikasi'),
              tooltip: 'Notifikasi',
            )),
            const SizedBox(width: 4),
          ],
        ),
        body: BlocBuilder<DashboardBloc, DashboardState>(
          builder: (c, s) {
            if (s is DashboardInitial || s is DashboardLoading) {
              return const LoadingState();
            }
            if (s is DashboardError) {
              return ErrorState(message: s.message, onRetry: () => _bloc.add(DashboardLoad()));
            }
            if (s is DashboardLoaded) {
              final d = s.data;
              return RefreshIndicator(
                onRefresh: () async => _bloc.add(DashboardLoad()),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                  children: [
                    _Hero(name: d.userName),
                    const SizedBox(height: 16),
                    _StatsGrid(stats: d.stats),
                    const SizedBox(height: 16),
                    _Section(
                      title: 'Jadwal Hari Ini',
                      count: d.todaySchedules.length,
                      onMore: () => GoRouter.of(c).go('/jadwal'),
                      child: d.todaySchedules.isEmpty
                          ? const EmptyState(message: 'Tidak ada jadwal hari ini')
                          : Column(
                              children: d.todaySchedules.take(5).map(
                                (e) => _ScheduleCard(
                                  schedule: e,
                                  onTap: () => GoRouter.of(c).go('/visit/${e.id}'),
                                ),
                              ).toList(),
                            ),
                    ),
                    const SizedBox(height: 12),
                    _Section(
                      title: 'Akan Datang',
                      count: d.upcoming.length,
                      child: d.upcoming.isEmpty
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: Text('Tidak ada', style: TextStyle(color: Colors.grey)),
                            )
                          : Column(
                              children: d.upcoming.take(5).map(
                                (e) => ListTile(
                                  title: Text(e.memberName ?? '-'),
                                  subtitle: Text(e.visitDate),
                                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                                  onTap: () => GoRouter.of(c).go('/visit/${e.id}'),
                                ),
                              ).toList(),
                            ),
                    ),
                  ],
                ),
              );
            }
            return const LoadingState();
          },
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.name});
  final String name;
  @override
  Widget build(BuildContext context) {
    String now;
    try {
      now = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(DateTime.now());
    } catch (_) {
      now = DateFormat('yyyy-MM-dd').format(DateTime.now());
    }
    final roleBadge = context.read<AuthBloc>().state is AuthAuthenticated
        ? (context.read<AuthBloc>().state as AuthAuthenticated).ctx.role.name.toUpperCase()
        : '';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        gradient: brandGradient,
        borderRadius: BorderRadius.all(Radius.circular(20)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Halo, $name', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(now, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                if (roleBadge.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(roleBadge, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                  ),
                ],
              ],
            ),
          ),
          const Icon(Icons.spa, color: Colors.white, size: 32),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});
  final DashboardStats stats;
  @override
  Widget build(BuildContext context) {
    final items = [
      _Stat('Hari Ini', stats.today.toString(), Icons.today, BrandColors.brand),
      _Stat('Terlambat', stats.late.toString(), Icons.warning_amber, Colors.red),
      _Stat('Selesai', stats.completed.toString(), Icons.check_circle, BrandColors.completed),
      _Stat('Pending', stats.pending.toString(), Icons.pending, BrandColors.pending),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.2,
      children: items.map((e) => Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(e.icon, color: e.color),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(e.value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  Text(e.title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ],
          ),
        ),
      )).toList(),
    );
  }
}

class _Stat {
  _Stat(this.title, this.value, this.icon, this.color);
  final String title;
  final String value;
  final IconData icon;
  final Color color;
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({required this.schedule, this.onTap});
  final ScheduleLite schedule;
  final VoidCallback? onTap;

  Color _statusColor(String status) {
    return switch (status) {
      'completed' => BrandColors.completed,
      'in_progress' => Colors.amber.shade700,
      'pending' => BrandColors.pending,
      'gagal_partial' => Colors.orange,
      'gagal_total' => Colors.red,
      _ => Colors.grey,
    };
  }

  String _statusLabel(String status) {
    return switch (status) {
      'completed' => 'Selesai',
      'in_progress' => 'Dikerjakan',
      'pending' => 'Pending',
      'gagal_partial' => 'Gagal Sebagian',
      'gagal_total' => 'Gagal Total',
      _ => status,
    };
  }

  @override
  Widget build(BuildContext context) {
    final member = schedule.memberName ?? '-';
    final block = schedule.blockNo ?? '-';
    final status = schedule.status;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 48,
                decoration: BoxDecoration(
                  color: _statusColor(status),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(member, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text('Block $block', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    if (schedule.desaName != null || schedule.kecamatanName != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        [schedule.desaName, schedule.kecamatanName].where((e) => e != null && e.isNotEmpty).join(', '),
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(status).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _statusLabel(status),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _statusColor(status),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.count = 0, this.onMore});
  final String title;
  final int count;
  final Widget child;
  final VoidCallback? onMore;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          const Spacer(),
          if (onMore != null)
            TextButton(onPressed: onMore, child: Text('Lihat $count')),
        ],
      ),
      child,
    ],
  );
}
