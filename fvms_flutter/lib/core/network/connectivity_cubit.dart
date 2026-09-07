import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

class ConnectivityState extends Equatable {
  final bool online;
  const ConnectivityState(this.online);
  @override
  List<Object?> get props => [online];
}

class ConnectivityCubit extends Cubit<ConnectivityState> {
  final Connectivity _conn = Connectivity();
  StreamSubscription? _sub;
  ConnectivityCubit() : super(const ConnectivityState(true)) {
    _init();
  }

  Future<void> _init() async {
    final res = await _conn.checkConnectivity();
    emit(ConnectivityState(!res.contains(ConnectivityResult.none)));
    _sub = _conn.onConnectivityChanged.listen((r) {
      emit(ConnectivityState(!r.contains(ConnectivityResult.none)));
    });
  }

  @override
  Future<void> close() {
    _sub?.cancel();
    return super.close();
  }
}
