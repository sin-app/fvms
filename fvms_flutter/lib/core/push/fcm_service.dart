import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FcmService {
  final _messaging = FirebaseMessaging.instance;
  final _local = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    await _messaging.requestPermission();
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _local.initialize(const InitializationSettings(android: android));
    FirebaseMessaging.onMessage.listen(_onMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_onOpened);
  }

  Future<void> _onMessage(RemoteMessage m) async {
    await _local.show(
      m.hashCode,
      m.notification?.title ?? 'FVMS',
      m.notification?.body ?? '',
      const NotificationDetails(android: AndroidNotificationDetails('fvms_channel', 'FVMS', importance: Importance.high)),
    );
  }

  void _onOpened(RemoteMessage m) {
    // go_router deep link via /visit/:id if payload contains schedule_id
  }

  Future<String?> getToken() => _messaging.getToken();
  Future<void> subscribe(String topic) => _messaging.subscribeToTopic(topic);
}
