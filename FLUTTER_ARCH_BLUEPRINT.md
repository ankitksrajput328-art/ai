# 📱 Nexus AI: Flutter Clean Architecture Blueprint

This document defines the high-level architecture for the Nexus AI mobile app (iOS & Android). It follows the **Clean Architecture** pattern to ensure scalability, testability, and maintainability.

---

## 1. Project Structure (Clean Architecture)
```text
/lib
├── core/                   # Shared logic, themes, constants
│   ├── network/            # API Client (Dio)
│   ├── theme/              # Material 3 Neon Theme
│   └── utils/              # Extensions & Helpers
├── domain/                 # Business Rules (Entities & Use Cases)
│   ├── entities/           # ChatMessage, User, Tool
│   ├── repositories/       # Abstract interface for data
│   └── usecases/           # SendMessage, GenerateImage, FetchHistory
├── data/                   # Implementation details (Data Sources)
│   ├── models/             # DTOs (JSON converters)
│   ├── repositories/       # Repo implementations
│   └── datasources/        # Remote (Gemini API) & Local (Hive/SQLite)
├── presentation/           # UI Layer (Screens & State)
│   ├── providers/          # Riverpod State Management
│   ├── screens/            # Chat, Tools, Profile, Auth
│   └── widgets/            # ChatBubble, InputBar, GlassCard
└── main.dart               # App Entry Point
```

---

## 2. Core Dependencies (`pubspec.yaml`)
- **State Management:** `flutter_riverpod`, `riverpod_annotation`
- **Networking:** `dio` (with Interceptors)
- **Persistence:** `hive`, `hive_flutter` (for local chat history)
- **UI & Icons:** `font_awesome_flutter`, `google_fonts`, `flutter_animate`
- **Voice & AI:** `speech_to_text`, `flutter_tts`, `record`
- **Utilities:** `freezed_annotation`, `json_annotation`

---

## 3. State Management Strategy (Riverpod)
- **`ChatProvider`:** Manages the list of messages and the streaming state.
- **`AuthProvider`:** Handles JWT tokens and user session.
- **`SearchProvider`:** Manages real-time search logic and citations.
- **`ThemeProvider`:** Controls Dark/Light mode and Neon accents.

---

## 4. UI/UX Principles
- **Glassmorphism:** Custom `BackdropFilter` widgets for all cards.
- **Haptic Feedback:** Interactive feedback for voice activation and sending.
- **Streaming Responses:** Using `StreamProvider` or `StateProvider` with word-by-word updates.
- **Responsive Design:** Using `LayoutBuilder` to adapt between Phone and Tablet layouts.

---

**Developer's Note:** This structure is "Google-Level" standard. It allows multiple developers to work on different layers (e.g., one on Gemini API integration, another on the UI) without merge conflicts.
