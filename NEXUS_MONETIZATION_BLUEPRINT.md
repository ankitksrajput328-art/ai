# 💰 Nexus AI: Monetization & Revenue Architecture

This document defines the strategy and technical implementation for turning the Nexus AI platform into a profitable SaaS business.

---

## 1. Multi-Tier Revenue Model
| Feature | Free Tier | Pro Ultra ($19/mo) | Nexus API (Pay-as-you-go) |
| :--- | :--- | :--- | :--- |
| **Model** | Gemini 1.5 Flash | Gemini 1.5 Pro | All Models |
| **Daily Credits** | 50 Coins | Unlimited | Based on Tokens |
| **Voice AI** | Standard | Premium (ElevenLabs) | API Access |
| **Image Gen** | 5 / Day | Unlimited | 0.05 / Image |
| **Memory** | None | Full Long-term Memory | None |

---

## 2. The "Nexus Coin" System (Micro-transactions)
- **Concept:** Users can purchase "Coin Packs" (e.g., $5 for 1,000 Coins) to use for high-cost features like Image Generation or Premium Voice.
- **Dynamic Pricing:** 
    - Text Chat: 1 Coin / Interaction.
    - Image Gen: 10 Coins / Image.
    - OCR PDF: 5 Coins / Document.

---

## 3. Referral & Viral Growth
- **Give & Get:** If User A invites User B, both get 500 free "Nexus Coins".
- **Social Sharing:** Sharing an AI-generated image to Twitter/Instagram earns the user 10 Coins.

---

## 4. Technical Payment Architecture
- **Gateway:** **Stripe** (International) & **Razorpay** (India).
- **Webhooks:** The backend listens for `checkout.session.completed` to instantly update the user's `is_premium` status in PostgreSQL.
- **Credit Deductor:** A middleware in FastAPI that checks the user's balance *before* calling the AI API.

---

## 5. Revenue Optimization (LTV)
- **Annual Discount:** 20% off for users who pay yearly ($190/yr instead of $228/yr).
- **In-App Ads (Free Only):** Subtle, non-intrusive banner ads for free-tier users to offset API costs.
- **Usage Alerts:** Push notifications when a user is at 10% credit balance.

---

**Business Note:** The goal is to make the "Free" tier great enough to go viral, but the "Pro" tier essential for power users and professionals.
