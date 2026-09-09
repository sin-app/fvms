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
        floatingActionButton: Builder(builder: (fabCtx) => FloatingActionButton.extended(icon: const Icon(Icons.add), label: const Text('Ajukan'), onPressed: () => ScaffoldMessenger.of(fabCtx).showSnackBar(const SnackBar(content: Text('Form pengajuan via web (coexist)'))))),
        body: BlocBuilder<LandProposalBloc, LandProposalState>(
          builder: (c, s) {
            if (s is LandProposalsInitial || s is LandProposalsLoading) return const LoadingState();
            if (s is LandProposalsError) return ErrorState(message: s.message, onRetry: () => c.read<LandProposalBloc>().add(LandProposalsLoad()));
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
            return const LoadingState();
          },
        ),
      ),
    );
  }
}
