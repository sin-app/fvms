import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:fvms_flutter/app/app.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/firebase_options.dart'; // generated via flutterfire configure
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:path_provider/path_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');
  HydratedBloc.storage = await HydratedStorage.build(
    storageDirectory: await getApplicationDocumentsDirectory(),
  );
  // Supabase - jangan silent, biar login bisa tampilkan error config
  try {
    await initSupabase();
  } on Exception catch (e) {
    debugPrint('Supabase init gagal: $e');
  } catch (e) {
    debugPrint('Supabase init error: $e');
  }
  // FCM
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (_) {}
  runApp(const FvmsApp());
}
