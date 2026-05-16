# 🛡️ Nexus Admin: Next.js Dashboard Architecture

This document defines the professional administrative interface for managing the Nexus AI Ecosystem.

---

## 1. Technical Stack (Next.js)
- **Framework:** Next.js 14 (App Router).
- **Styling:** TailwindCSS + Framer Motion.
- **Charts:** Recharts or Chart.js.
- **State Management:** TanStack Query (React Query) for real-time API syncing.

---

## 2. Page Structure & Components

### A. Dashboard Overview (Index)
- **Revenue Chart:** Monthly recurring revenue (MRR) and Daily Active Users (DAU) trends.
- **AI Health Monitor:** Real-time latency tracking for Gemini and OpenAI endpoints.
- **Usage Heatmap:** Visualizing peak times for AI interaction globally.

### B. User Management (`/users`)
- **Searchable Table:** Filter by subscription tier, country, or join date.
- **Profile Deep-Dive:** View a user's chat history summaries and memory counts.
- **Moderation Tools:** Single-click Ban, Reset Credits, or Upgrade to Pro.

### C. Financials (`/payments`)
- **Transaction Ledger:** Live feed of successful Stripe/Razorpay payments.
- **Churn Analysis:** Tracking user retention and subscription cancellations.

### D. AI Usage Metrics (`/ai-stats`)
- **Token Economy:** Breakdown of most expensive queries and top models used.
- **Error Logs:** Monitoring for API failures, rate limits, and slow responses.

---

## 3. Security & Admin Roles
- **SuperAdmin:** Full access to all systems, including revenue and user deletion.
- **Moderator:** Can view user reports and issue temporary bans.
- **Analyst:** View-only access to revenue and usage charts.

---

**Architect's Note:** The Admin Dashboard must be hosted on a separate **Internal VPN** or secured with **MFA (Multi-Factor Authentication)** to ensure the safety of user data.
