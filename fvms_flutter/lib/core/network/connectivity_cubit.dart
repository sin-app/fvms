import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConnectivityState extends Equatable {
  const ConnectivityState(this.online);
  final bool online;
  @override
  List<Object?> get props => [online];
}

class ConnectivityCubit extends Cubit<ConnectivityState> {
  ConnectivityCubit() : super(const ConnectivityState(true)) {
    _init();
  }
  final Connectivity _conn = Connectivity();
  StreamSubscription? _sub;

  bool _isOnline(List<ConnectivityResult> results) => !results.contains(ConnectivityResult.none);

  Future<void> _init() async {
    try {
      final res = await _conn.checkConnectivity();
      emit(ConnectivityState(_isOnline(res)));
      _sub = _conn.onConnectivityChanged.listen((r) {
        emit(ConnectivityState(_isOnline(r)));
      });
    } catch (_) {
      emit(const ConnectivityState(true));
    }
  }

  @override
  Future<void> close() {
    _sub?.cancel();
    return super.close();
  }
}
