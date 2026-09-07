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
  // Supabase
  try {
    await initSupabase();
  } catch (_) {
    // .env missing on first scaffold - app tetap jalan ke login dengan error state
  }
  // FCM
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (_) {}
  runApp(const FvmsApp());
}
