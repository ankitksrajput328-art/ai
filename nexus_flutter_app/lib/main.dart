import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'presentation/screens/splash_screen.dart';
import 'presentation/screens/login_screen.dart';

void main() {
  runApp(const ProviderScope(child: NexusAIApp()));
}

class NexusAIApp extends StatelessWidget {
  const NexusAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nexus AI Ultra',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const MainLayout(),
      },
    );
  }
}

class MainLayout extends ConsumerStatefulWidget {
  const MainLayout({super.key});

  @override
  ConsumerState<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends ConsumerState<MainLayout> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050509),
      body: Row(
        children: [
          // Navigation Rail (Side Menu for Tablet/Desktop)
          if (MediaQuery.of(context).size.width > 600)
            NavigationRail(
              selectedIndex: _selectedIndex,
              onDestinationSelected: (i) => setState(() => _selectedIndex = i),
              labelType: NavigationRailLabelType.selected,
              backgroundColor: const Color(0xFF0A0A0F),
              destinations: const [
                NavigationRailDestination(icon: Icon(Icons.chat_bubble_outline), label: Text('Chat')),
                NavigationRailDestination(icon: Icon(Icons.grid_view_outlined), label: Text('Tools')),
                NavigationRailDestination(icon: Icon(Icons.psychology_outlined), label: Text('Memory')),
                NavigationRailDestination(icon: Icon(Icons.person_outline), label: Text('Profile')),
              ],
            ),
          
          // Main View Content
          Expanded(
            child: _buildView(_selectedIndex),
          ),
        ],
      ),
      bottomNavigationBar: MediaQuery.of(context).size.width <= 600
          ? BottomNavigationBar(
              currentIndex: _selectedIndex,
              onTap: (i) => setState(() => _selectedIndex = i),
              type: BottomNavigationBarType.fixed,
              backgroundColor: const Color(0xFF0A0A0F),
              selectedItemColor: const Color(0xFF6366F1),
              unselectedItemColor: Colors.white54,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.chat_bubble), label: 'Chat'),
                BottomNavigationBarItem(icon: Icon(Icons.grid_view), label: 'Tools'),
                BottomNavigationBarItem(icon: Icon(Icons.psychology), label: 'Memory'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
              ],
            )
          : null,
    );
  }

  Widget _buildView(int index) {
    switch (index) {
      case 0: return const ChatScreen();
      case 1: return const Center(child: Text('AI Tools Dashboard'));
      case 2: return const Center(child: Text('AI Long-term Memory'));
      case 3: return const Center(child: Text('User Profile & Credits'));
      default: return const ChatScreen();
    }
  }
}

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Chat Viewport
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: const [
              ChatBubble(text: "Hello! I am Nexus AI. How can I help you today?", isUser: false),
            ],
          ),
        ),
        
        // Input System
        const ChatInputBar(),
      ],
    );
  }
}

class ChatBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  const ChatBubble({super.key, required this.text, required this.isUser});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(16),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isUser ? const Color(0xFF6366F1).withOpacity(0.1) : const Color(0xFF1E1E2E),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Text(text, style: const TextStyle(fontSize: 16)),
      ),
    );
  }
}

class ChatInputBar extends StatelessWidget {
  const ChatInputBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0F),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: Row(
        children: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.add_circle_outline, color: Colors.white54)),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: const TextField(
                decoration: InputDecoration(
                  hintText: "Ask anything...",
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          CircleAvatar(
            backgroundColor: const Color(0xFF6366F1),
            child: IconButton(onPressed: () {}, icon: const Icon(Icons.arrow_upward, color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
