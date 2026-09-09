import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (c, s) {
        if (s is AuthInitial || s is AuthLoading) {
          return Scaffold(appBar: AppBar(title: const Text('Profil')), body: const LoadingState());
        }
        if (s is AuthFailure) {
          return Scaffold(
            appBar: AppBar(title: const Text('Profil')),
            body: ErrorState(message: s.message, onRetry: () => c.read<AuthBloc>().add(AuthStarted())),
          );
        }
        if (s is AuthUnauthenticated) {
          return Scaffold(
            appBar: AppBar(title: const Text('Profil')),
            body: const EmptyState(message: 'Belum login — silakan login kembali'),
          );
        }
        final user = (s is AuthAuthenticated) ? s.ctx : null;
        if (user == null) {
          return Scaffold(appBar: AppBar(title: const Text('Profil')), body: const LoadingState());
        }
        return Scaffold(
          appBar: AppBar(title: const Text('Profil')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              CircleAvatar(radius: 36, backgroundColor: BrandColors.brandSoft, child: Text(user.userId.length >= 2 ? user.userId.substring(0, 2).toUpperCase() : user.userId.toUpperCase(), style: const TextStyle(color: BrandColors.brand, fontWeight: FontWeight.bold))),
              const SizedBox(height: 12),
              Text(user.userId, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
              Center(child: Chip(label: Text(user.role.name))),
              if (user.assignedKabupatenIds.isNotEmpty) ...[
                const SizedBox(height: 8),
                Center(child: Wrap(spacing: 6, children: user.assignedKabupatenIds.map((e) => Chip(label: Text(e))).toList())),
              ],
              const Divider(height: 32),
              ListTile(leading: const Icon(Icons.admin_panel_settings), title: const Text('Master Data'), subtitle: const Text('Kelola via web (coexist)'), onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Buka web fvms-eight.vercel.app untuk Master Data')))),
              ListTile(leading: const Icon(Icons.upload_file), title: const Text('Import Excel'), subtitle: const Text('Admin only - via web'), onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Import Excel hanya via web (admin)')))),
              ListTile(leading: const Icon(Icons.group), title: const Text('Users'), subtitle: const Text(' via web'), onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Kelola Users via web')))),
              const SizedBox(height: 16),
              FilledButton.icon(
                icon: const Icon(Icons.logout),
                label: const Text('Keluar'),
                style: FilledButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () {
                  context.read<AuthBloc>().add(AuthLogoutRequested());
                },
              ),
              const SizedBox(height: 24),
              const Text('FVMS Flutter v0.1.0 • Android Only • Coexist Web', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        );
      },
    );
  }
}
