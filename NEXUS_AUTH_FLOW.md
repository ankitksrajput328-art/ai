# 🔐 Nexus AI: Universal Authentication & Security Flow

This document defines the high-fidelity security protocols for user identification and session management.

---

## 1. Dual-Token JWT Flow
To ensure security without compromising user experience, we use a **Short-Lived Access Token** and a **Long-Lived Refresh Token**.

1.  **Login:** User provides credentials -> Backend returns `access_token` (15 mins) and `refresh_token` (7 days).
2.  **Request:** Frontend sends `access_token` in the `Authorization: Bearer` header.
3.  **Expiry:** When `access_token` expires, Frontend calls `/auth/refresh` with the `refresh_token`.
4.  **Security:** If a `refresh_token` is compromised, it can be revoked in the database.

---

## 2. Multi-Channel Identity (Google & OTP)

### A. Google OAuth 2.0
- **Mobile (Flutter):** Uses `google_sign_in` package to get an `idToken`.
- **Backend (FastAPI):** Verifies the `idToken` with Google's public keys. If valid, it logs the user in or creates a new account.

### B. OTP (Mobile Number / Email)
- **Flow:** User enters Email/Phone -> Backend sends 6-digit code via **Twilio** or **SendGrid** -> User enters code -> Backend returns JWTs.

---

## 3. Secure Token Storage (Flutter)
- **NEVER** store tokens in `SharedPreferences` (easily hackable).
- **ALWAYS** use `flutter_secure_storage` (KeyStore on Android / Keychain on iOS).

---

## 4. Biometric Auth (Fingerprint / FaceID)
- **Integration:** Use `local_auth` package in Flutter.
- **Workflow:** After initial login, the app stores a "Biometric Key." Upon restart, it asks for a fingerprint to unlock the stored JWTs.

---

**Security Note:** All traffic must be served over **HTTPS**. We also implement **Rate Limiting** on the `/login` and `/otp` endpoints to prevent brute-force attacks.
