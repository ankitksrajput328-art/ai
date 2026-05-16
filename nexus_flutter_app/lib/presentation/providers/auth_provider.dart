import 'package:flutter_riverpod/flutter_riverpod.dart';

// User model for auth
class AppUser {
  final String email;
  final String name;
  final bool isPremium;

  AppUser({required this.email, required this.name, this.isPremium = false});
}

// Auth state class
class AuthState {
  final AppUser? user;
  final bool isLoading;
  final String? error;

  AuthState({this.user, this.isLoading = false, this.error});

  AuthState copyWith({AppUser? user, bool? isLoading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true);
    
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));

    if (email.contains("@")) {
      state = state.copyWith(
        isLoading: false, 
        user: AppUser(email: email, name: "Premium Navigator", isPremium: true)
      );
    } else {
      state = state.copyWith(isLoading: false, error: "Invalid credentials");
    }
  }

  void logout() {
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
