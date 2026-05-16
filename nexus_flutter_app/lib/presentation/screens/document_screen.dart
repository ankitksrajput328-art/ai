import 'package:flutter/material.dart';
import '../widgets/glass_card.dart';

class DocumentScreen extends StatefulWidget {
  const DocumentScreen({super.key});

  @override
  State<DocumentScreen> createState() => _DocumentScreenState();
}

class _DocumentScreenState extends State<DocumentScreen> {
  bool _isUploading = false;
  String? _analysis;

  void _simulateUpload() async {
    setState(() => _isUploading = true);
    await Future.delayed(const Duration(seconds: 3));
    setState(() {
      _isUploading = false;
      _analysis = "SUMMARY: This document outlines the core scaling strategy for the Nexus AI infrastructure. It mentions using AWS EKS for GPU auto-scaling and Pinecone for semantic memory management.";
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("AI DOCUMENT ANALYZER")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Upload Zone
            GestureDetector(
              onTap: _simulateUpload,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  color: const Color(0xFF0A0A0F),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.3), width: 2, style: BorderStyle.solid),
                ),
                child: Column(
                  mainAxisAlignment: Main_AxisAlignment.center,
                  children: [
                    Icon(Icons.cloud_upload_outlined, size: 48, color: const Color(0xFF6366F1)),
                    const SizedBox(height: 16),
                    const Text("Tap to upload PDF, DOCX, or Image", style: TextStyle(color: Colors.white70)),
                    const Text("(Max size: 25MB)", style: TextStyle(color: Colors.white24, fontSize: 12)),
                  ],
                ),
              ),
            ),

            if (_isUploading) ...[
              const SizedBox(height: 40),
              const Center(child: CircularProgressIndicator()),
              const SizedBox(height: 16),
              const Text("NEXUS IS EXTRACTING INTELLIGENCE...", textAlign: TextAlign.center, style: TextStyle(letterSpacing: 2, fontSize: 12)),
            ],

            if (_analysis != null) ...[
              const SizedBox(height: 40),
              const Text("AI INSIGHTS", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E2E),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(_analysis!, style: const TextStyle(height: 1.6, color: Colors.white70)),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.chat_bubble_outline),
                label: const Text("CHAT WITH THIS DOCUMENT"),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), padding: const EdgeInsets.all(16)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
