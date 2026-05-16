import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../widgets/glass_card.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: Main_AxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [const Color(0xFF6366F1), const Color(0xFF06B6D4)]),
                boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.4), blurRadius: 40)],
              ),
              child: const Icon(Icons.auto_awesome, size: 60, color: Colors.white),
            ).animate().scale(duration: 800.ms).shimmer(delay: 1.seconds),
            const SizedBox(height: 24),
            const Text(
              "NEXUS AI",
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 4),
            ).animate().fadeIn(delay: 500.ms).moveY(begin: 20, end: 0),
            const Text(
              "The Future of Intelligence",
              style: TextStyle(color: Colors.white54, letterSpacing: 2),
            ).animate().fadeIn(delay: 800.ms),
          ],
        ),
      ),
    );
  }
}
