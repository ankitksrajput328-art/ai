import 'dart:convert';
import 'package:http/http.dart' as http;

/// Nexus Analytics Service for Flutter
/// Tracks user interactions, API usage, and crash reports.
class NexusAnalytics {
  static const String _baseUrl = "https://api.nexus-ai.com/v1/analytics";
  static String? _userId;

  static void initialize(String userId) {
    _userId = userId;
    _trackEvent("session_start", {"device": "mobile_app"});
  }

  /// Tracks a custom user interaction
  static Future<void> track(String eventType, [Map<String, dynamic>? metadata]) async {
    await _trackEvent(eventType, metadata ?? {});
  }

  /// Logs AI usage with token counts
  static Future<void> logAIUsage({
    required String model,
    required int promptTokens,
    required int completionTokens,
    required int latencyMs,
  }) async {
    final Map<String, dynamic> data = {
      "model": model,
      "prompt_tokens": promptTokens,
      "completion_tokens": completionTokens,
      "latency_ms": latencyMs,
      "estimated_cost": (promptTokens * 0.0000035) + (completionTokens * 0.0000105),
    };
    await _trackEvent("ai_usage", data);
  }

  /// Reports a crash or exception
  static Future<void> reportCrash(dynamic error, dynamic stackTrace) async {
    await _trackEvent("app_crash", {
      "error": error.toString(),
      "stack": stackTrace.toString(),
    });
  }

  static Future<void> _trackEvent(String type, Map<String, dynamic> payload) async {
    final event = {
      "user_id": _userId,
      "event_type": type,
      "payload": payload,
      "timestamp": DateTime.now().toIso8601String(),
    };

    print("[NexusAnalytics] Sending: $type");

    try {
      // In production:
      // await http.post(Uri.parse(_baseUrl), body: jsonEncode(event));
    } catch (e) {
      print("Analytics Sync Failed: $e");
    }
  }
}
