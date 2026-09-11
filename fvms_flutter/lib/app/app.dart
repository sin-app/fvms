import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/router.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/app/theme/theme_cubit.dart';
import 'package:fvms_flutter/core/network/connectivity_cubit.dart';
import 'package:fvms_flutter/core/offline/db.dart';
import 'package:fvms_flutter/core/offline/sync_bloc.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';

final _appDatabase = AppDatabase();

class FvmsApp extends StatelessWidget {
  const FvmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    final db = _appDatabase;
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => AuthBloc()..add(AuthStarted())),
        BlocProvider(create: (_) => ConnectivityCubit()),
        BlocProvider(create: (_) => SyncBloc(db: db)),
        BlocProvider(create: (_) => ThemeCubit()),
      ],
      child: Builder(builder: (ctx) {
        final authBloc = ctx.read<AuthBloc>();
        final themeMode = ctx.watch<ThemeCubit>().state;
        return MaterialApp.router(
          title: 'FVMS',
          theme: buildLightTheme(),
          darkTheme: buildDarkTheme(),
          themeMode: themeMode,
          routerConfig: buildRouter(authBloc),
          debugShowCheckedModeBanner: false,
        );
      },),
    );
  }
}
