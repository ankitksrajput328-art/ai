import 'dart:convert';
import 'package:dio/dio.dart';

class ChatRemoteDataSource {
  final Dio _dio = Dio();
  final String _baseUrl = "http://localhost:8000";

  /// Connects to the SSE stream and yields tokens to the UI
  Stream<String> streamAIResponse(String prompt, List<Map<String, dynamic>> history) async* {
    try {
      final response = await _dio.post(
        "$_baseUrl/chat/stream",
        data: {
          "user_id": "test_user_123",
          "prompt": prompt,
          "history": history,
        },
        options: Options(responseType: ResponseType.stream),
      );

      final stream = response.data.stream;
      
      await for (final chunk in stream.transform(utf8.decoder)) {
        // SSE format: "data: token \n\n"
        if (chunk.startsWith("data: ")) {
          final token = chunk.replaceFirst("data: ", "").trim();
          yield token;
        }
      }
    } catch (e) {
      yield "Error connecting to Nexus Core: $e";
    }
  }
}
