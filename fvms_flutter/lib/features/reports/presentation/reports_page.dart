import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/reports/bloc/reports_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ReportsBloc()..add(ReportsLoad()),
      child: Scaffold(
        appBar: AppBar(title: const Text('Laporan')),
        body: BlocBuilder<ReportsBloc, ReportsState>(
          builder: (c, s) {
            if (s is ReportsInitial || s is ReportsLoading) return const LoadingState();
            if (s is ReportsError) return ErrorState(message: s.message, onRetry: () => c.read<ReportsBloc>().add(ReportsLoad()));
            if (s is ReportsLoaded) {
              final d = s.data;
              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                children: [
                  // filters stub
                  Card(child: Padding(padding: const EdgeInsets.all(12), child: Row(children: [Expanded(child: TextField(decoration: const InputDecoration(labelText: 'Cari member', border: OutlineInputBorder()), onSubmitted: (v) => c.read<ReportsBloc>().add(ReportsFilterChanged(member: v))))]))),
                  const SizedBox(height: 12),
                  GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), childAspectRatio: 2.2, mainAxisSpacing: 12, crossAxisSpacing: 12, children: [
                    _Kpi('Total', d.total.toString(), Colors.blue),
                    _Kpi('Selesai', d.completed.toString(), Colors.green),
                    _Kpi('Pending', d.pending.toString(), Colors.amber),
                    _Kpi('Terlambat', d.late.toString(), Colors.red),
                  ],),
                  const SizedBox(height: 16),
                  const Text('Per Hari', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (d.daily.isEmpty)
                    const Padding(padding: EdgeInsets.all(12), child: Text('Belum ada data harian', style: TextStyle(color: Colors.grey)))
                  else
                    SizedBox(height: 180, child: BarChart(BarChartData(barGroups: d.daily.entries.map((e) => BarChartGroupData(x: e.key.hashCode % 100, barRods: [BarChartRodData(toY: e.value.toDouble(), color: const Color(0xFF10B981))])).toList()))),
                  const SizedBox(height: 16),
                  const Text('Per Petugas', style: TextStyle(fontWeight: FontWeight.bold)),
                  if (d.byOfficer.isEmpty)
                    const Padding(padding: EdgeInsets.all(12), child: Text('Belum ada data petugas', style: TextStyle(color: Colors.grey)))
                  else
                    ...d.byOfficer.map((o) => Card(child: ListTile(title: Text(o.name), trailing: Text('${o.completed}/${o.total}')))),
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

class _Kpi extends StatelessWidget {
  const _Kpi(this.title, this.value, this.color);
  final String title;
  final String value; final Color color;
  @override
  Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)), Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color))])));

}
