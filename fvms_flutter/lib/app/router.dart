import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../features/auth/bloc/auth_bloc.dart';
import 'shell.dart';

GoRouter buildRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/login',
    refreshListenable: _BlocListenable(authBloc),
    redirect: (ctx, state) {
      final auth = authBloc.state;
      final logged = auth is AuthAuthenticated;
      final atLogin = state.matchedLocation == '/login' || state.matchedLocation == '/reset-password';
      if (!logged && !atLogin) return '/login';
      if (logged && atLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (c, s) => const LoginPage()),
      GoRoute(path: '/reset-password', builder: (c, s) => const ResetPage()),
      ShellRoute(
        builder: (c, s, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (c, s) => const DashboardPage()),
          GoRoute(path: '/jadwal', builder: (c, s) => const SchedulesPage()),
          GoRoute(path: '/kalender', builder: (c, s) => const CalendarPage()),
          GoRoute(path: '/laporan', builder: (c, s) => const ReportsPage()),
          GoRoute(path: '/profil', builder: (c, s) => const ProfilePage()),
          GoRoute(path: '/visit/:id', builder: (c, s) => VisitPage(id: s.pathParameters['id']!)),
        ],
      ),
    ],
  );
}

class _BlocListenable extends ChangeNotifier {
  final AuthBloc bloc;
  late final sub = bloc.stream.listen((_) => notifyListeners());
  _BlocListenable(this.bloc);
  @override
  void dispose() { sub.cancel(); super.dispose(); }
}

// Stubs - akan diisi F1-F4
class LoginPage extends StatelessWidget { const LoginPage({super.key}); @override Widget build(BuildContext c) => const Scaffold(body: Center(child: Text('Login - F1')));}
class ResetPage extends StatelessWidget { const ResetPage({super.key}); @override Widget build(BuildContext c) => const Scaffold(body: Center(child: Text('Reset')));}
class DashboardPage extends StatelessWidget { const DashboardPage({super.key}); @override Widget build(BuildContext c) => const Scaffold(body: Center(child: Text('Dashboard')));}
class SchedulesPage extends StatelessWidget { const SchedulesPage({super.key}); @override Widget build(BuildContext c) => const Scaffold(body: Center(child: Text('Jadwal')));}
class CalendarPage extends StatelessWidget { const CalendarPage({super.key}); @override Widget build(BuildContext c) => const Scaffold(body: Center(child: Text('Kalender')));}
class ReportsPage extends StatelessWidget { const ReportsPage({super.key}); @override Widget build(BuildContext c) => const Scaffold(body: Center(child: Text('Laporan')));}
class ProfilePage extends StatelessWidget { const ProfilePage({super.key}); @override Widget build(BuildContext c) => const Scaffold(body: Center(child: Text('Profil')));}
class VisitPage extends StatelessWidget { final String id; const VisitPage({super.key, required this.id}); @override Widget build(BuildContext c) => Scaffold(body: Center(child: Text('Visit $id')));}
