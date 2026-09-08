import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:path_provider/path_provider.dart';
import 'core/supabase/client.dart';
import 'app/app.dart';
import 'firebase_options.dart'; // generated via flutterfire configure

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
