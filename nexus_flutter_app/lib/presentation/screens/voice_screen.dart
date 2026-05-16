import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/voice_provider.dart';
import '../widgets/glass_card.dart';

class VoiceScreen extends ConsumerWidget {
  const VoiceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceState = ref.watch(voiceProvider);
    final voiceNotifier = ref.read(voiceProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFF050509),
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF6366F1).withOpacity(0.05),
              ),
            ).animate(onPlay: (c) => c.repeat()).scale(duration: 10.seconds, begin: const Offset(1, 1), end: const Offset(1.5, 1.5)).fadeOut(),
          ),

          Center(
            child: Column(
              mainAxisAlignment: Main_AxisAlignment.center,
              children: [
                // The Nexus Orb (Animated AI Avatar)
                _buildNexusOrb(voiceState.isListening, voiceState.isThinking),
                
                const SizedBox(height: 60),
                
                Text(
                  voiceState.isThinking ? "NEXUS IS THINKING..." : (voiceState.isListening ? "I'M LISTENING..." : "TAP TO SPEAK"),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2, color: Color(0xFF6366F1)),
                ).animate().fadeIn(),
                
                const SizedBox(height: 20),
                
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    voiceState.lastTranscript.isEmpty ? "What can I do for you today?" : '"${voiceState.lastTranscript}"',
                    style: const TextStyle(fontSize: 16, color: Colors.white54, fontStyle: FontStyle.italic),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),

          // Control Buttons
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: Main_AxisAlignment.center,
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, size: 32, color: Colors.white24),
                ),
                const SizedBox(width: 40),
                GestureDetector(
                  onTap: () => voiceState.isListening ? voiceNotifier.stopListening() : voiceNotifier.startListening(),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: voiceState.isListening ? Colors.red.withOpacity(0.2) : const Color(0xFF6366F1).withOpacity(0.1),
                      border: Border.all(color: voiceState.isListening ? Colors.red : const Color(0xFF6366F1), width: 2),
                    ),
                    child: Icon(
                      voiceState.isListening ? Icons.stop : Icons.mic,
                      size: 40,
                      color: voiceState.isListening ? Colors.red : Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 40),
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.volume_up, size: 32, color: Colors.white24),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNexusOrb(bool isListening, bool isThinking) {
    return Container(
      width: 240,
      height: 240,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: isListening 
            ? [const Color(0xFFEF4444), const Color(0xFFF97316)] 
            : [const Color(0xFF6366F1), const Color(0xFF06B6D4), const Color(0xFFEC4899)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: (isListening ? Colors.red : const Color(0xFF6366F1)).withOpacity(0.3),
            blurRadius: 60,
            spreadRadius: 10,
          )
        ],
      ),
    ).animate(onPlay: (c) => c.repeat())
     .shimmer(duration: 3.seconds)
     .scale(
       duration: isListening ? 500.ms : 4.seconds,
       begin: const Offset(1, 1),
       end: Offset(isListening ? 1.1 : 1.05, isListening ? 1.1 : 1.05),
       curve: Curves.easeInOut,
     ).then().scale(begin: const Offset(1.05, 1.05), end: const Offset(1, 1));
  }
}
