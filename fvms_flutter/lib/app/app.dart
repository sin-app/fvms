import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'theme/brand.dart';
import 'router.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../core/network/connectivity_cubit.dart';

class FvmsApp extends StatelessWidget {
  const FvmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => AuthBloc()..add(AuthStarted())),
        BlocProvider(create: (_) => ConnectivityCubit()),
      ],
      child: Builder(builder: (ctx) {
        final authBloc = ctx.read<AuthBloc>();
        return MaterialApp.router(
          title: 'FVMS',
          theme: buildLightTheme(),
          darkTheme: buildDarkTheme(),
          themeMode: ThemeMode.system,
          routerConfig: buildRouter(authBloc),
          debugShowCheckedModeBanner: false,
        );
      }),
    );
  }
}
