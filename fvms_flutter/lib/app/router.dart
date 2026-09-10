import 'package:flutter/material.dart';
import 'package:fvms_flutter/app/shell.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';
import 'package:fvms_flutter/features/auth/presentation/login_page.dart';
import 'package:fvms_flutter/features/auth/presentation/profile_page.dart';
import 'package:fvms_flutter/features/auth/presentation/reset_page.dart';
import 'package:fvms_flutter/features/dashboard/presentation/dashboard_page.dart';
import 'package:fvms_flutter/features/land_proposals/presentation/land_proposals_page.dart';
import 'package:fvms_flutter/features/notifications/presentation/notifications_page.dart';
import 'package:fvms_flutter/features/reports/presentation/reports_page.dart';
import 'package:fvms_flutter/features/schedules/presentation/calendar_page.dart';
import 'package:fvms_flutter/features/schedules/presentation/schedules_page.dart';
import 'package:fvms_flutter/features/visits/presentation/visit_page.dart';
import 'package:go_router/go_router.dart';

GoRouter buildRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/login',
    refreshListenable: _BlocListenable(authBloc),
    redirect: (ctx, state) {
      final auth = authBloc.state;
      // Selama loading, jangan redirect - biarkan di halaman login dengan spinner
      if (auth is AuthLoading) return null;
      final logged = auth is AuthAuthenticated;
      final atLogin = state.matchedLocation == '/login' || state.matchedLocation == '/reset-password';
      if (!logged && !atLogin) return '/login';
      if (logged && atLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (c, s) => const LoginPage()),
      GoRoute(path: '/reset-password', builder: (c, s) => const ResetPage()),
      GoRoute(path: '/visit/:id', builder: (c, s) => VisitPage(id: s.pathParameters['id']!)),
      ShellRoute(
        builder: (c, s, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (c, s) => const DashboardPage()),
          GoRoute(path: '/jadwal', builder: (c, s) => const SchedulesPage()),
          GoRoute(path: '/kalender', builder: (c, s) => const CalendarPage()),
          GoRoute(path: '/laporan', builder: (c, s) => const ReportsPage()),
          GoRoute(path: '/profil', builder: (c, s) => const ProfilePage()),
          GoRoute(path: '/pengajuan-lahan', builder: (c, s) => const LandProposalsPage()),
          GoRoute(path: '/notifikasi', builder: (c, s) => const NotificationsPage()),
        ],
      ),
    ],
  );
}

class _BlocListenable extends ChangeNotifier {
  _BlocListenable(this.bloc);
  final AuthBloc bloc;
  late final sub = bloc.stream.listen((_) => notifyListeners());
  @override
  void dispose() { sub.cancel(); super.dispose(); }
}


