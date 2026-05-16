import 'package:flutter/material.dart';
import '../widgets/glass_card.dart';

class MemoryScreen extends StatelessWidget {
  const MemoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("AI MEMORY TIMELINE")),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildMemoryNode("Jan 12, 2026", "You mentioned starting a new project in Flutter.", "Technical"),
          _buildMemoryNode("Jan 10, 2026", "We discussed the architecture of a real-time AI backend.", "Architecture"),
          _buildMemoryNode("Jan 05, 2026", "You shared your preference for Dark Mode and Cyberpunk aesthetics.", "Personal"),
          _buildMemoryNode("Jan 02, 2026", "Initial session established. System learned your name: Navigator.", "Identity"),
        ],
      ),
    );
  }

  Widget _buildMemoryNode(String date, String content, String category) {
    return IntrinsicHeight(
      child: Row(
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle),
              ),
              Expanded(
                child: Container(width: 2, color: Colors.white12),
              ),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 32),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0A0F),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: Main_AxisAlignment.spaceBetween,
                    children: [
                      Text(date, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(category, style: const TextStyle(color: Color(0xFF6366F1), fontSize: 10)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(content, style: const TextStyle(fontSize: 14, height: 1.5)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
