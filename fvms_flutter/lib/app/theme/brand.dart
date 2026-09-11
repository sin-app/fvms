import 'package:flutter/material.dart';

/// Mirror src/app/globals.css --brand tokens
abstract class BrandColors {
  static const brand = Color(0xFF10B981); // emerald
  static const brandStrong = Color(0xFF065F46);
  static const brandSoft = Color(0xFFECFDF5);
  static const brandForeground = Colors.white;

  // dark variant
  static const brandSoftDark = Color(0xFF064E3B);

  // status dots
  static const pending = Color(0xFFF59E0B);
  static const inProgress = Color(0xFF8B5CF6);
  static const gagalPartial = Color(0xFFF97316);
  static const completed = Color(0xFF22C55E);
  static const gagalTotal = Color(0xFFEF4444);
}

ThemeData buildLightTheme() {
  final base = ThemeData.light(useMaterial3: true);
  return base.copyWith(
    colorScheme: ColorScheme.fromSeed(
      seedColor: BrandColors.brand,
      primary: BrandColors.brand,
      surface: Colors.white,
    ),
    scaffoldBackgroundColor: Colors.white,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 4,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
  );
}

ThemeData buildDarkTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    colorScheme: ColorScheme.fromSeed(
      seedColor: BrandColors.brand,
      brightness: Brightness.dark,
      primary: BrandColors.brand,
      surface: const Color(0xFF1E1E1E),
    ),
    scaffoldBackgroundColor: const Color(0xFF121212),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1E1E1E),
      elevation: 0,
      scrolledUnderElevation: 4,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFF1E1E1E),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
      ),
    ),
    dividerColor: Colors.white.withValues(alpha: 0.1),
    chipTheme: base.chipTheme.copyWith(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
  );
}

// Gradient helper
const brandGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [BrandColors.brand, BrandColors.brandStrong],
);
