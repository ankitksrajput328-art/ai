import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:record/record.dart';
import 'package:speech_to_text/speech_to_text.dart';

class VoiceState {
  final bool isListening;
  final String lastTranscript;
  final bool isThinking;

  VoiceState({this.isListening = false, this.lastTranscript = "", this.isThinking = false});

  VoiceState copyWith({bool? isListening, String? lastTranscript, bool? isThinking}) {
    return VoiceState(
      isListening: isListening ?? this.isListening,
      lastTranscript: lastTranscript ?? this.lastTranscript,
      isThinking: isThinking ?? this.isThinking,
    );
  }
}

class VoiceNotifier extends StateNotifier<VoiceState> {
  final SpeechToText _speech = SpeechToText();
  final AudioRecorder _recorder = AudioRecorder();

  VoiceNotifier() : super(VoiceState());

  Future<void> startListening() async {
    bool available = await _speech.initialize();
    if (available) {
      state = state.copyWith(isListening: true);
      _speech.listen(
        onResult: (result) {
          state = state.copyWith(lastTranscript: result.recognizedWords);
          if (result.finalResult) {
            _processVoiceCommand(result.recognizedWords);
          }
        },
      );
    }
  }

  Future<void> stopListening() async {
    await _speech.stop();
    state = state.copyWith(isListening: false);
  }

  void _processVoiceCommand(String text) async {
    state = state.copyWith(isThinking: true, isListening: false);
    
    // In production: Send audio stream to Backend via WebSockets
    // final audioStream = await _recorder.startStream(const RecordConfig());
    
    await Future.delayed(const Duration(seconds: 2));
    state = state.copyWith(isThinking: false);
    
    // Play AI response via TTS (FlutterTts)
    print("AI Response: I am processing your voice command: $text");
  }
}

final voiceProvider = StateNotifierProvider<VoiceNotifier, VoiceState>((ref) {
  return VoiceNotifier();
});
