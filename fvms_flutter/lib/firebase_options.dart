// Stub - generate via `flutterfire configure` setelah Firebase project dibuat
// ignore_for_file: avoid_classes_with_only_static_members
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    // Ganti setelah flutterfire configure
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return const FirebaseOptions(
          apiKey: 'REPLACE_ME',
          appId: '1:000000000:android:000000',
          messagingSenderId: '000000000',
          projectId: 'fvms-replace',
        );
      default:
        throw UnsupportedError('Platform belum dikonfigurasi - jalankan flutterfire configure');
    }
  }
}
