import 'package:flutter_riverpod/flutter_riverpod.dart';

// Chat message model
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({required this.text, required this.isUser, required this.timestamp});
}

// State class for chat
class ChatState {
  final List<ChatMessage> messages;
  final bool isStreaming;

  ChatState({this.messages = const [], this.isStreaming = false});

  ChatState copyWith({List<ChatMessage>? messages, bool? isStreaming}) {
    return ChatState(
      messages: messages ?? this.messages,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }
}

// Riverpod Provider for Chat Logic
import '../../data/datasources/chat_remote_datasource.dart';

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatRemoteDataSource _remoteDataSource = ChatRemoteDataSource();
  ChatNotifier() : super(ChatState());

  void sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    // Add user message
    final userMsg = ChatMessage(text: text, isUser: true, timestamp: DateTime.now());
    state = state.copyWith(messages: [...state.messages, userMsg], isStreaming: true);

    // Prepare AI message placeholder
    final aiMsg = ChatMessage(text: "", isUser: false, timestamp: DateTime.now());
    state = state.copyWith(messages: [...state.messages, aiMsg]);

    // Stream response from Backend
    String accumulatedText = "";
    final history = state.messages.map((m) => {"text": m.text, "is_user": m.isUser}).toList();
    
    await for (final token in _remoteDataSource.streamAIResponse(text, history)) {
      accumulatedText += "$token ";
      
      // Update the last message in UI
      final updatedMessages = List<ChatMessage>.from(state.messages);
      updatedMessages[updatedMessages.length - 1] = ChatMessage(
        text: accumulatedText, 
        isUser: false, 
        timestamp: aiMsg.timestamp
      );
      
      state = state.copyWith(messages: updatedMessages);
    }
    
    state = state.copyWith(isStreaming: false);
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier();
});
