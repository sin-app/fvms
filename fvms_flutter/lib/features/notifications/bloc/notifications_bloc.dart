import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';

class NotifLite { NotifLite({required this.id, required this.title, required this.message, required this.isRead}); final String id;
final String title;
final String message; final bool isRead; }

abstract class NotificationsEvent extends Equatable { @override List<Object?> get props => []; }
class NotificationsLoad extends NotificationsEvent {}

abstract class NotificationsState extends Equatable { @override List<Object?> get props => []; }
class NotificationsInitial extends NotificationsState {}
class NotificationsLoading extends NotificationsState {}
class NotificationsLoaded extends NotificationsState { NotificationsLoaded(this.items); final List<NotifLite> items; @override List<Object?> get props => [items]; }
class NotificationsError extends NotificationsState { NotificationsError(this.message); final String message; @override List<Object?> get props => [message]; }

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  NotificationsBloc() : super(NotificationsInitial()) {
    on<NotificationsLoad>((e, emit) async {
      emit(NotificationsLoading());
      if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
        emit(NotificationsError('Supabase belum siap'));
        return;
      }
      try {
        final user = supabase.auth.currentUser;
        if (user == null) throw Exception('Belum login');
        final rows = await supabase.from('notifications').select('id, title, message, is_read').eq('user_id', user.id).order('created_at', ascending: false).limit(50).timeout(const Duration(seconds: 10));
        final items = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return NotifLite(id: m['id'] as String, title: m['title'] as String, message: m['message'] as String, isRead: (m['is_read'] as bool?) ?? false);
        }).toList();
        emit(NotificationsLoaded(items));
      } catch (err) { emit(NotificationsError(err.toString())); }
    });
  }
}
