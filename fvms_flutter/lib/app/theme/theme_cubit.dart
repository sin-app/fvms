import 'package:flutter/material.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';

class ThemeCubit extends HydratedCubit<ThemeMode> {
  ThemeCubit() : super(ThemeMode.system);

  void setTheme(ThemeMode mode) => emit(mode);
  void toggleLight() => emit(ThemeMode.light);
  void toggleDark() => emit(ThemeMode.dark);
  void toggleSystem() => emit(ThemeMode.system);

  @override
  ThemeMode fromJson(Map<String, dynamic> json) {
    final v = json['themeMode'] as String? ?? 'system';
    return switch (v) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  @override
  Map<String, dynamic> toJson(ThemeMode state) => {
    'themeMode': state.name,
  };
}
