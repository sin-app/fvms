import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fvms_flutter/app/app.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/firebase_options.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:path/path.dart' as p;

String? _initError;
const String _appVersion = String.fromEnvironment('APP_VERSION', defaultValue: 'dev');

Future<void> main() async {
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    final msg = 'FlutterError: ${details.exceptionAsString()}\n${details.stack ?? ''}';
    _initError ??= msg;
    _logError(msg);
  };
  ErrorWidget.builder = (details) {
    final msg = 'ErrorWidget: ${details.exceptionAsString()}\n\n${details.stack ?? ''}';
    _logError(msg);
    return Material(
      color: Colors.red.shade50,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('FVMS — ERROR', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 16)),
            const SizedBox(height: 12),
            SelectableText(msg, style: const TextStyle(fontSize: 12, fontFamily: 'monospace')),
          ],
        ),
      ),
    );
  };

  await runZonedGuarded<Future<void>>(() async {
    WidgetsFlutterBinding.ensureInitialized();

    try {
      await initializeDateFormatting('id_ID');
    } catch (e) {
      initError('DateFormatting: $e');
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

    if (_initError != null) {
      runApp(_ErrorApp(message: _initError!));
    } else {
      runApp(const FvmsApp());
    }
  }, (error, stack) {
    final msg = 'Uncaught: $error\n$stack';
    _initError ??= msg;
    _logError(msg);
  });

  if (_initError != null) {
    runApp(_ErrorApp(message: _initError!));
  }
}

void initError(String msg) {
  _initError ??= msg;
  _logError(msg);
}

void _logError(String msg) {
  try {
    final dir = Directory('/storage/emulated/0/Download');
    if (dir.existsSync()) {
      final file = File(p.join(dir.path, 'fvms_error.log'));
      file.writeAsStringSync('${DateTime.now()}\n$msg\n\n', mode: FileMode.append);
    }
  } catch (_) {}
}

class _ErrorApp extends StatefulWidget {
  const _ErrorApp({required this.message});
  final String message;
  @override
  State<_ErrorApp> createState() => _ErrorAppState();
}

class _ErrorAppState extends State<_ErrorApp> {
  bool _copied = false;
  @override
  Widget build(BuildContext context) => MaterialApp(
    home: Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('FVMS v$_appVersion — Error', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.red)),
            const SizedBox(height: 8),
            Text(
              _copied ? 'Error sudah dicopy.' : 'Tap tombol copy untuk copy error.',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            SelectableText(widget.message, style: const TextStyle(fontSize: 12, fontFamily: 'monospace')),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.copy, size: 14),
                label: const Text('Copy Error'),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: widget.message));
                  setState(() => _copied = true);
                },
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
