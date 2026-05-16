# 🛠️ Nexus AI: Complete Project Setup & Installation Guide

Welcome, Architect. This guide will take you from a blank computer to a fully functioning AI ecosystem.

---

## 1. Required Software Installation
Before we write code, you must install the following tools:

1.  **Python 3.10+:** [Download Here](https://www.python.org/downloads/) (For the FastAPI Backend).
2.  **Flutter SDK:** [Install Guide](https://docs.flutter.dev/get-started/install) (For Mobile App).
3.  **PostgreSQL:** [Download Here](https://www.postgresql.org/download/) (For Relational Database).
4.  **Docker Desktop:** [Download Here](https://www.docker.com/products/docker-desktop/) (For Production Containers).
5.  **Git:** [Download Here](https://git-scm.com/downloads) (For Version Control).

---

## 2. Project Folder Structure
Run these commands in your terminal to create the workspace:
```bash
mkdir Nexus_AI && cd Nexus_AI
mkdir backend_core
mkdir AI_Chat_App
# Flutter app will be created via CLI later
```

---

## 3. Backend Setup (FastAPI)
1.  Navigate to `backend_core`:
    ```bash
    cd backend_core
    python -m venv venv
    source venv/bin/activate  # On Windows use: venv\Scripts\activate
    pip install -r requirements.txt
    ```
2.  Create your `.env` file (see Section 6).

---

## 4. Frontend Setup (Flutter)
1.  Initialize the Flutter project:
    ```bash
    flutter create nexus_mobile_app
    cd nexus_mobile_app
    flutter pub get
    ```

---

## 5. VS Code Extensions (Recommended)
Install these to make development 10x faster:
- **Flutter & Dart** (Essential for Mobile).
- **Python** (By Microsoft).
- **Thunder Client** (For testing API endpoints).
- **Docker** (For managing containers).
- **Error Lens** (To see errors inline).

---

## 6. Environment Variables (`.env`)
Create a `.env` file in `backend_core/` with these keys:
```env
# AI Keys
OPENAI_API_KEY=sk-your-key
GEMINI_API_KEY=your-gemini-key

# Databases
DATABASE_URL=postgresql://user:pass@localhost:5432/nexus_db
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENV=us-east1-gcp

# Billing
STRIPE_SECRET_KEY=sk_test_...

# Security
JWT_SECRET=your-super-secret-key
```

---

## 7. Starting the Engines
1.  **Backend:** `uvicorn main:app --reload`
2.  **Web:** Open `AI_Chat_App/index.html` in your browser (use a Live Server).
3.  **Mobile:** `flutter run` (Connect an Android/iOS emulator).

---

**CTO Note:** You are now ready. The foundation is set. Start with the backend logic and connect your mobile app via the API endpoints.
