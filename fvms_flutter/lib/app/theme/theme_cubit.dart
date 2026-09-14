import 'package:flutter/material.dart';

class ThemeCubit extends Cubit<ThemeMode> {
  ThemeCubit() : super(ThemeMode.system);

  void setTheme(ThemeMode mode) => emit(mode);
  void toggleLight() => emit(ThemeMode.light);
  void toggleDark() => emit(ThemeMode.dark);
  void toggleSystem() => emit(ThemeMode.system);
}
