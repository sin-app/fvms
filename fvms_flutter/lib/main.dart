import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:fvms_flutter/app/app.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/firebase_options.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:path_provider/path_provider.dart';

Future<void> main() async {
  String? initError;
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
  };
  ErrorWidget.builder = (details) => Material(
    color: Colors.red.shade50,
    child: ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('ERROR', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
        const SizedBox(height: 8),
        Text(details.exceptionAsString(), style: const TextStyle(fontSize: 12)),
        if (details.stack != null) ...[
          const SizedBox(height: 8),
          Text(details.stack.toString(), style: const TextStyle(fontSize: 10, color: Colors.grey)),
        ],
      ],
    ),
  );
  await runZonedGuarded<Future<void>>(() async {
    WidgetsFlutterBinding.ensureInitialized();
    try {
      await initializeDateFormatting('id_ID');
    } catch (e) {
      initError ??= 'DateFormatting: $e';
    }
    try {
      HydratedBloc.storage = await HydratedStorage.build(
        storageDirectory: await getApplicationDocumentsDirectory(),
      );
    } catch (e) {
      initError ??= 'HydratedStorage: $e';
    }
    try {
      await initSupabase();
    } on Exception catch (e) {
      debugPrint('Supabase init gagal: $e');
    } catch (e) {
      debugPrint('Supabase init error: $e');
    }
    try {
      final opts = DefaultFirebaseOptions.currentPlatform;
      if (opts.apiKey != 'REPLACE_ME') {
        await Firebase.initializeApp(options: opts);
      }
    } catch (_) {}
    if (initError != null) {
      runApp(_ErrorApp(message: initError!));
    } else {
      runApp(const FvmsApp());
    }
  }, (error, stack) {
    debugPrint('Uncaught: $error\n$stack');
  });
}

class _ErrorApp extends StatelessWidget {
  const _ErrorApp({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => MaterialApp(
    home: Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('FVMS — Startup Error', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            Text(message, style: const TextStyle(fontSize: 12, fontFamily: 'monospace')),
          ],
        ),
      ),
    ),
  );
}
