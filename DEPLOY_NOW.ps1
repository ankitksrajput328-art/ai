# Nexus AI Ultra - GitHub + Vercel Deployment Guide
# ===================================================
# Yeh commands ek ek karke terminal mein chalaaein

# ─── STEP 1: GitHub Par Repo Banao ────────────────────────
# https://github.com/new par jaao aur banao:
# Name: nexus-ai-ultra
# Public/Private: Public (Google index ke liye Public rakho)
# README: uncheck karo

# ─── STEP 2: Apna Code GitHub Par Push Karo ───────────────
# Neeche ki commands terminal mein chalao:

git remote add origin https://github.com/AAPKA-USERNAME/nexus-ai-ultra.git
git branch -M main
git push -u origin main

# "AAPKA-USERNAME" ki jagah apna actual GitHub username daalo
# Example: https://github.com/ankitantigravity/nexus-ai-ultra.git

# ─── STEP 3: Vercel Par Deploy Karo ───────────────────────
# Option A (Auto - Recommended):
#   1. https://vercel.com par jaao
#   2. "New Project" click karo
#   3. GitHub se "nexus-ai-ultra" import karo
#   4. "Deploy" click karo
#   → Your app will be live at: nexus-ai-ultra.vercel.app

# Option B (Terminal se):
npx vercel --prod

# ─── STEP 4: Custom Domain (Optional) ─────────────────────
# Vercel Dashboard > Settings > Domains
# "nexusai.app" ya "nexusaiultra.com" add karo

# ─── STEP 5: Google Search Console ───────────────────────
# https://search.google.com/search-console
# "Add Property" > URL: https://nexus-ai-ultra.vercel.app
# Verify karo aur sitemap submit karo:
# https://nexus-ai-ultra.vercel.app/sitemap.xml
