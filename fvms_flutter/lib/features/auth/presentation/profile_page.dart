import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/brand.dart';
import '../bloc/auth_bloc.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (c, s) {
        final user = (s is AuthAuthenticated) ? s.ctx : null;
        return Scaffold(
          appBar: AppBar(title: const Text('Profil')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (user != null) ...[
                CircleAvatar(radius: 36, backgroundColor: BrandColors.brandSoft, child: Text(user.userId.substring(0, 2).toUpperCase(), style: const TextStyle(color: BrandColors.brand, fontWeight: FontWeight.bold))),
                const SizedBox(height: 12),
                Text(user.userId, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
                Chip(label: Text(user.role.name)),
                if (user.assignedKabupatenIds.isNotEmpty) Wrap(spacing: 6, children: user.assignedKabupatenIds.map((e) => Chip(label: Text(e))).toList()),
              ],
              const Divider(height: 32),
              ListTile(leading: const Icon(Icons.admin_panel_settings), title: const Text('Master Data'), subtitle: const Text('Kelola via web (coexist)'), onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Buka web fvms-eight.vercel.app untuk Master Data')))),
              ListTile(leading: const Icon(Icons.upload_file), title: const Text('Import Excel'), subtitle: const Text('Admin only - via web'), onTap: () {}),
              ListTile(leading: const Icon(Icons.group), title: const Text('Users'), subtitle: const Text(' via web'), onTap: () {}),
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
