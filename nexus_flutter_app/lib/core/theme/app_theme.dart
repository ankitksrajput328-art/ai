import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryAccent = Color(0xFF6366F1);
  static const Color spaceBlack = Color(0xFF050509);
  static const Color surfaceDark = Color(0xFF0A0A0F);
  static const Color cyberCyan = Color(0xFF06B6D4);

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: spaceBlack,
    colorScheme: const ColorScheme.dark(
      primary: primaryAccent,
      secondary: cyberCyan,
      surface: surfaceDark,
    ),
    textTheme: GoogleFonts.outfitTextTheme(
      ThemeData.dark().textTheme.apply(bodyColor: Colors.white, displayColor: Colors.white),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
    ),
    navigationRailTheme: const NavigationRailThemeData(
      backgroundColor: surfaceDark,
      selectedIconTheme: IconThemeData(color: primaryAccent),
      unselectedIconTheme: IconThemeData(color: Colors.white54),
    ),
  );
}
