import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ReferralCard extends StatelessWidget {
  final String referralCode = "NEXUS-UX8273";

  const ReferralCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF6366F1).withOpacity(0.2), const Color(0xFF06B6D4).withOpacity(0.1)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.stars, color: Color(0xFF6366F1), size: 40),
          const SizedBox(height: 16),
          const Text(
            "GIVE 500, GET 500",
            style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 18),
          ),
          const SizedBox(height: 8),
          const Text(
            "Invite a friend to Nexus AI. When they join, both of you earn 500 Nexus Coins.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              mainAxisAlignment: Main_AxisAlignment.spaceBetween,
              children: [
                Text(referralCode, style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
                IconButton(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: referralCode));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Code copied to clipboard!")));
                  },
                  icon: const Icon(Icons.copy, size: 18, color: Color(0xFF6366F1)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
