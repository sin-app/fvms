import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/client.dart';

abstract class AuthEvent extends Equatable {
  @override
  List<Object?> get props => [];
}
class AuthStarted extends AuthEvent {}
class AuthLoginRequested extends AuthEvent {
  final String email, password;
  AuthLoginRequested(this.email, this.password);
  @override
  List<Object?> get props => [email, password];
}
class AuthLogoutRequested extends AuthEvent {}
class AuthResetRequested extends AuthEvent {
  final String email;
  AuthResetRequested(this.email);
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
  final AuthContext ctx;
  AuthAuthenticated(this.ctx);
  @override
  List<Object?> get props => [ctx.userId];
}
class AuthUnauthenticated extends AuthState {}
class AuthFailure extends AuthState {
  final String message;
  AuthFailure(this.message);
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
    final ctx = await getAuthContext();
    if (ctx != null) {
      emit(AuthAuthenticated(ctx));
    } else {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLogin(AuthLoginRequested e, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      await supabase.auth.signInWithPassword(email: e.email, password: e.password);
      final ctx = await getAuthContext();
      if (ctx == null) throw Exception('Gagal ambil profil');
      emit(AuthAuthenticated(ctx));
    } on AuthException catch (err) {
      emit(AuthFailure(err.message));
    } catch (err) {
      emit(AuthFailure(err.toString()));
    }
  }

  Future<void> _onLogout(AuthLogoutRequested e, Emitter<AuthState> emit) async {
    await supabase.auth.signOut();
    emit(AuthUnauthenticated());
  }

  Future<void> _onReset(AuthResetRequested e, Emitter<AuthState> emit) async {
    try {
      await supabase.auth.resetPasswordForEmail(e.email);
      emit(AuthFailure('Link reset dikirim ke ${e.email}'));
    } catch (err) {
      emit(AuthFailure(err.toString()));
    }
  }
}
