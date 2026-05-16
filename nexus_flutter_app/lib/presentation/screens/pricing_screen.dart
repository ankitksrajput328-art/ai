import 'package:flutter/material.dart';
import '../widgets/glass_card.dart';

class PricingScreen extends StatelessWidget {
  const PricingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("NEXUS PLANS")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildPlanCard(
            context,
            "FREE",
            "0",
            ["50 daily coins", "Gemini 1.5 Flash", "Basic Memory", "Standard Voice"],
            isPremium: false,
          ),
          const SizedBox(height: 24),
          _buildPlanCard(
            context,
            "PRO ULTRA",
            "19",
            ["Unlimited coins", "Gemini 1.5 Pro", "Advanced Long-term Memory", "HD Image Generation", "Premium ElevenLabs Voice"],
            isPremium: true,
          ),
          const SizedBox(height: 48),
          const Text("NEED MORE COINS?", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildCoinPack("1000", "5"),
              const SizedBox(width: 16),
              _buildCoinPack("2500", "10"),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildPlanCard(BuildContext context, String title, String price, List<String> features, {required bool isPremium}) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isPremium ? const Color(0xFF6366F1).withOpacity(0.1) : const Color(0xFF0A0A0F),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isPremium ? const Color(0xFF6366F1) : Colors.white12, width: isPremium ? 2 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: isPremium ? const Color(0xFF6366F1) : Colors.white54, fontWeight: FontWeight.bold, letterSpacing: 2)),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              const Text("\$", style: TextStyle(fontSize: 20, color: Colors.white54)),
              Text(price, style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold)),
              const Text("/mo", style: TextStyle(color: Colors.white54)),
            ],
          ),
          const SizedBox(height: 24),
          ...features.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(children: [const Icon(Icons.check_circle, size: 16, color: Color(0xFF6366F1)), const SizedBox(width: 12), Text(f)]),
          )),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: isPremium ? const Color(0xFF6366F1) : Colors.white.withOpacity(0.05),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: Text(isPremium ? "UPGRADE NOW" : "CURRENT PLAN", style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildCoinPack(String coins, String price) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF0A0A0F),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          children: [
            const Icon(Icons.toll, color: Color(0xFF6366F1)),
            const SizedBox(height: 8),
            Text("$coins COINS", style: const TextStyle(fontWeight: FontWeight.bold)),
            Text("\$$price", style: const TextStyle(color: Colors.white54, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
