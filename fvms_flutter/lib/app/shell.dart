import 'package:flutter/material.dart';
import 'package:fvms_flutter/widgets/sync_indicator.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({required this.child, super.key});
  final Widget child;

  static const _tabs = [
    ('/', Icons.home_rounded, 'Home'),
    ('/jadwal', Icons.calendar_today_rounded, 'Jadwal'),
    ('/kalender', Icons.calendar_month_rounded, 'Kalender'),
    ('/laporan', Icons.bar_chart_rounded, 'Laporan'),
    ('/profil', Icons.person_rounded, 'Profil'),
  ];

  int _index(BuildContext c) {
    final loc = GoRouterState.of(c).matchedLocation;
    for (var i = 0; i < _tabs.length; i++) {
      if (loc == _tabs[i].$1 || loc.startsWith('${_tabs[i].$1}/')) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _index(context);
    final isHome = GoRouterState.of(context).matchedLocation == '/';
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (!isHome) {
          context.go('/');
        } else {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (c) => AlertDialog(
              title: const Text('Keluar Aplikasi?'),
              content: const Text('Apakah Anda yakin ingin keluar?'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Batal')),
                FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Keluar')),
              ],
            ),
          );
          if ((confirmed ?? false) && context.mounted) {
            Navigator.of(context).maybePop();
          }
        }
      },
      child: Scaffold(
        body: child,
        bottomNavigationBar: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: SyncIndicator(),
              ),
              Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 8))],
                  border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: List.generate(_tabs.length, (i) {
                    final active = i == idx;
                    return InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () => context.go(_tabs[i].$1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: active ? const Color(0xFFECFDF5) : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(_tabs[i].$2, size: 22, color: active ? const Color(0xFF10B981) : Colors.grey),
                            const SizedBox(height: 2),
                            Text(_tabs[i].$3, style: TextStyle(fontSize: 10, color: active ? const Color(0xFF10B981) : Colors.grey, fontWeight: active ? FontWeight.w600 : FontWeight.normal)),
                          ],
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
