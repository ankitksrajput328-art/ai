import 'dart:ui';
import 'package:flutter/material.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final double blur;
  final double opacity;
  final double borderRadius;
  final Color borderColor;

  const GlassCard({
    super.key,
    required this.child,
    this.blur = 20.0,
    this.opacity = 0.05,
    this.borderRadius = 24.0,
    this.borderColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: borderColor.withOpacity(opacity),
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: borderColor.withOpacity(0.08),
              width: 1.0,
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
