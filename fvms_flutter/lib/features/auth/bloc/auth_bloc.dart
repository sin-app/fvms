import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

abstract class AuthEvent extends Equatable {
  @override
  List<Object?> get props => [];
}
class AuthStarted extends AuthEvent {}
class AuthLoginRequested extends AuthEvent {
  AuthLoginRequested(this.email, this.password);
  final String email;
  final String password;
  @override
  List<Object?> get props => [email, password];
}
class AuthLogoutRequested extends AuthEvent {}
class AuthResetRequested extends AuthEvent {
  AuthResetRequested(this.email);
  final String email;
  @override
  List<Object?> get props => [email];
}

abstract class AuthState extends Equatable {
  @override
  List<Object?> get props => [];
}
class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthAuthenticated extends AuthState {
  AuthAuthenticated(this.ctx);
  final AuthContext ctx;
  @override
  List<Object?> get props => [ctx.userId];
}
class AuthUnauthenticated extends AuthState {}
class AuthFailure extends AuthState {
  AuthFailure(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(AuthInitial()) {
    on<AuthStarted>(_onStarted);
    on<AuthLoginRequested>(_onLogin);
    on<AuthLogoutRequested>(_onLogout);
    on<AuthResetRequested>(_onReset);
  }

  Future<void> _onStarted(AuthStarted e, Emitter<AuthState> emit) async {
    if (!isSupabaseInitialized) {
      emit(AuthFailure('Supabase belum siap: ${SupabaseConfig.isConfigured ? "init gagal" : "URL/ANON_KEY kosong"}'));
      emit(AuthUnauthenticated());
      return;
    }
    try {
      final ctx = await getAuthContext();
      if (ctx != null) {
        emit(AuthAuthenticated(ctx));
      } else {
        emit(AuthUnauthenticated());
      }
    } catch (_) {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLogin(AuthLoginRequested e, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    if (!SupabaseConfig.isConfigured) {
      emit(AuthFailure('Supabase belum dikonfigurasi. Rebuild APK dengan --dart-define SUPABASE_URL & ANON_KEY'));
      return;
    }
    if (!isSupabaseInitialized) {
      emit(AuthFailure('Supabase belum siap (client not init). Restart app.'));
      return;
    }
    try {
      await supabase.auth
          .signInWithPassword(email: e.email, password: e.password)
          .timeout(const Duration(seconds: 15));
      final ctx = await getAuthContext().timeout(const Duration(seconds: 10));
      if (ctx == null) throw Exception('Gagal ambil profil: cek tabel public.users & RLS');
      emit(AuthAuthenticated(ctx));
    } on AuthException catch (err) {
      final msg = err.message.toLowerCase().contains('invalid login credentials')
          ? 'Email atau password salah'
          : err.message;
      emit(AuthFailure(msg));
    } on Exception catch (err) {
      if (err.toString().contains('TimeoutException')) {
        emit(AuthFailure('Timeout: cek koneksi internet / Supabase URL'));
        return;
      }
      rethrow;
    } catch (err) {
      final m = err.toString();
      if (m.contains('LateInitializationError') || (m.contains('client') && m.contains('not been initialized'))) {
        emit(AuthFailure('Supabase belum siap (LateInit). Restart app & cek dart-define'));
      } else if (m.contains('TimeoutException')) {
        emit(AuthFailure('Timeout login. Cek internet.'));
      } else if (m.contains('Supabase not initialized') || m.contains('Supabase belum')) {
        emit(AuthFailure('Supabase belum siap. Coba restart app.'));
      } else {
        emit(AuthFailure(m.replaceFirst('Exception: ', '')));
      }
    }
  }

  Future<void> _onLogout(AuthLogoutRequested e, Emitter<AuthState> emit) async {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    emit(AuthUnauthenticated());
  }

  Future<void> _onReset(AuthResetRequested e, Emitter<AuthState> emit) async {
    if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
      emit(AuthFailure('Supabase belum siap'));
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(e.email);
      emit(AuthFailure('Link reset dikirim ke ${e.email}'));
    } catch (err) {
      emit(AuthFailure(err.toString()));
    }
  }
}
