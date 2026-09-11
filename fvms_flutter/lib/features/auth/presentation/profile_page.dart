import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/app/theme/theme_cubit.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';
import 'package:fvms_flutter/widgets/shimmer.dart';
import 'package:go_router/go_router.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});
  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  List<String> _kabupatenNames = [];
  bool _loadingKab = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _resolveKabupatenNames();
  }

  Future<void> _resolveKabupatenNames() async {
    final state = context.read<AuthBloc>().state;
    final user = (state is AuthAuthenticated) ? state.ctx : null;
    if (user == null || user.assignedKabupatenIds.isEmpty) return;
    if (!isSupabaseInitialized) return;
    if (_loadingKab) return;
    setState(() => _loadingKab = true);
    try {
      final rows = await supabase
          .from('kabupaten')
          .select('id, name')
          .inFilter('id', user.assignedKabupatenIds)
          .timeout(const Duration(seconds: 8));
      if (mounted) {
        setState(() {
          _kabupatenNames = (rows as List).map((r) => (r as Map<String, dynamic>)['name'] as String).toList();
          _loadingKab = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingKab = false);
    }
  }

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
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.person_off, size: 64, color: Colors.grey),
                  const SizedBox(height: 12),
                  const Text('Belum login', style: TextStyle(fontSize: 16)),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Login'),
                  ),
                ],
              ),
            ),
          );
        }
        final user = (s is AuthAuthenticated) ? s.ctx : null;
        if (user == null) {
          return Scaffold(appBar: AppBar(title: const Text('Profil')), body: const LoadingState());
        }

        final displayName = user.name.isNotEmpty ? user.name : user.email;
        final initials = displayName.length >= 2 ? displayName.substring(0, 2).toUpperCase() : displayName.toUpperCase();

        final displayKab = _kabupatenNames.isNotEmpty
            ? _kabupatenNames
            : user.assignedKabupatenIds;

        return Scaffold(
          appBar: AppBar(title: const Text('Profil')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: BrandColors.brandSoft,
                  child: Text(initials, style: const TextStyle(color: BrandColors.brand, fontSize: 22, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 14),
              Center(
                child: Text(
                  displayName,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
              if (user.email.isNotEmpty && user.name.isNotEmpty) ...[
                const SizedBox(height: 4),
                Center(
                  child: Text(user.email, style: const TextStyle(color: Colors.grey, fontSize: 14)),
                ),
              ],
              const SizedBox(height: 10),
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: BrandColors.brand.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: BrandColors.brand.withValues(alpha: 0.3)),
                  ),
                  child: Text(user.role.name.toUpperCase(), style: const TextStyle(color: BrandColors.brand, fontWeight: FontWeight.w600, fontSize: 12)),
                ),
              ),
              if (user.assignedKabupatenIds.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Center(child: Text('Kabupaten Tugas', style: TextStyle(fontSize: 12, color: Colors.grey))),
                const SizedBox(height: 6),
                Center(
                  child: _loadingKab
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: displayKab.map((e) => Chip(
                            label: Text(e, style: const TextStyle(fontSize: 12)),
                            visualDensity: VisualDensity.compact,
                          )).toList(),
                        ),
                ),
              ],
              const Divider(height: 32),
              BlocBuilder<ThemeCubit, ThemeMode>(
                builder: (_, mode) => Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Tampilan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _themeChip(Icons.light_mode, 'Terang', ThemeMode.light, mode),
                            const SizedBox(width: 8),
                            _themeChip(Icons.dark_mode, 'Gelap', ThemeMode.dark, mode),
                            const SizedBox(width: 8),
                            _themeChip(Icons.phone_android, 'Sistem', ThemeMode.system, mode),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              _menuTile(context, Icons.dashboard_outlined, 'Dashboard', () => context.go('/')),
              _menuTile(context, Icons.calendar_today_outlined, 'Jadwal', () => context.go('/jadwal')),
              _menuTile(context, Icons.bar_chart_outlined, 'Laporan', () => context.go('/laporan')),
              _menuTile(context, Icons.notifications_outlined, 'Notifikasi', () => context.go('/notifikasi')),
              const Divider(height: 32),
              _menuTile(context, Icons.language, 'Buka Web (Admin)', () {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Buka fvms-eight.vercel.app di browser')));
              }),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  icon: const Icon(Icons.logout),
                  label: const Text('Keluar'),
                  style: FilledButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: () {
                    context.read<AuthBloc>().add(AuthLogoutRequested());
                  },
                ),
              ),
              const SizedBox(height: 24),
              const Text('FVMS Flutter v0.1.0', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        );
      },
    );
  }

  Widget _menuTile(BuildContext context, IconData icon, String title, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: BrandColors.brand),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _themeChip(IconData icon, String label, ThemeMode value, ThemeMode current) {
    final isActive = value == current;
    return Expanded(
      child: GestureDetector(
        onTap: () => context.read<ThemeCubit>().setTheme(value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? BrandColors.brand : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isActive ? BrandColors.brand : Colors.grey.shade300),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isActive ? Colors.white : Colors.grey),
              const SizedBox(width: 6),
              Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isActive ? Colors.white : Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
