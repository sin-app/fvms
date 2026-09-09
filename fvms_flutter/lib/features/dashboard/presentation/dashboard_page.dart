import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/features/dashboard/bloc/dashboard_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
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
            IconButton(icon: const Icon(Icons.notifications_none), onPressed: () {}),
            const SizedBox(width: 4),
          ],
        ),
        body: BlocBuilder<DashboardBloc, DashboardState>(
          builder: (c, s) {
            if (s is DashboardInitial || s is DashboardLoading) return const LoadingState();
            if (s is DashboardError) return ErrorState(message: s.message, onRetry: () => _bloc.add(DashboardLoad()));
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
                    _Section(title: 'Jadwal Hari Ini', count: d.todaySchedules.length, onMore: () => context.go('/jadwal'), child: d.todaySchedules.isEmpty ? const EmptyState(message: 'Tidak ada jadwal hari ini') : Column(children: d.todaySchedules.take(3).map((e) => Card(child: ListTile(title: Text(e.memberName ?? '-'), subtitle: Text('${e.blockNo ?? '-'} • ${e.status}'), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/visit/${e.id}')))).toList())),
                    const SizedBox(height: 12),
                    _Section(title: 'Akan Datang', count: d.upcoming.length, child: d.upcoming.isEmpty ? const Text('Tidak ada', style: TextStyle(color: Colors.grey)) : Column(children: d.upcoming.take(3).map((e) => ListTile(title: Text(e.memberName ?? '-'), subtitle: Text(e.visitDate))).toList())),
                  ],
                ),
              );
            }
            return const SizedBox.shrink();
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(gradient: brandGradient, borderRadius: BorderRadius.all(Radius.circular(20))),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Halo, $name', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)), const SizedBox(height: 4), Text(now, style: const TextStyle(color: Colors.white70, fontSize: 12))])),
        const Icon(Icons.spa, color: Colors.white, size: 32),
      ],),
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
    return GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 2.2, children: items.map((e) => Card(child: Padding(padding: const EdgeInsets.all(12), child: Row(children: [Icon(e.icon, color: e.color), const SizedBox(width: 12), Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(e.value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)), Text(e.title, style: const TextStyle(fontSize: 12, color: Colors.grey))])])))).toList());
  }
}
class _Stat { _Stat(this.title, this.value, this.icon, this.color); final String title;
final String value; final IconData icon; final Color color; }

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.count = 0, this.onMore});
  final String title; final int count; final Widget child; final VoidCallback? onMore;
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(children: [Text(title, style: const TextStyle(fontWeight: FontWeight.bold)), const Spacer(), if (onMore != null) TextButton(onPressed: onMore, child: Text('Lihat $count'))]), child]);
}
