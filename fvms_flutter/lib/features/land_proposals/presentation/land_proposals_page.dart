import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/land_proposals/bloc/land_proposal_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';

class LandProposalsPage extends StatelessWidget {
  const LandProposalsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => LandProposalBloc()..add(LandProposalsLoad()),
      child: Scaffold(
        appBar: AppBar(title: const Text('Pengajuan Lahan')),
        floatingActionButton: FloatingActionButton.extended(icon: const Icon(Icons.add), label: const Text('Ajukan'), onPressed: () {}),
        body: BlocBuilder<LandProposalBloc, LandProposalState>(
          builder: (c, s) {
            if (s is LandProposalsLoading) return const LoadingState();
            if (s is LandProposalsError) return ErrorState(message: s.message);
            if (s is LandProposalsLoaded) {
              if (s.items.isEmpty) return const EmptyState(message: 'Belum ada pengajuan');
              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                itemCount: s.items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final p = s.items[i];
                  return Card(child: ListTile(title: Text(p.memberName ?? '-'), subtitle: Text('${p.blockNo ?? '-'} • ${p.status}'), trailing: Chip(label: Text(p.status))));
                },
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
