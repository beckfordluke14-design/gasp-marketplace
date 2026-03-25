# Gasp Marketplace: Railway Migration Guide (2026)

**The upgrade from Vercel to Railway is now active.** This transition allows for more transparent and stable deployments using the **Next.js 16 + Node 22 (LTS)** stack.

---

## 🛠️ 1. Infrastructure Sync
1.  **Node.js Profile**: I've ensured the `.node-version` file is set to `22` for high-end marketplace performance.
2.  **Builder**: Using **Nixpacks** (via `railway.json`) to automatically detect and optimize the Turbopack build pipeline.
3.  **Revenue Logic**: The **80/20 Split Engine** and **Whale-Hunter Protocol** are already infused into your local code—ready for the final push.

## 🗝️ 2. Environment Variables (Required in Railway)
Before you trigger the final deployment, ensure these keys are added in your Railway project settings:

| KEY | VALUE / FORMAT |
| :--- | :--- |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` (Your provider key) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Your public-tier key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (For Whale-Hunter transactions) |
| `NEXT_PUBLIC_MARKETPLACE_NAME` | `Gasp.fun` |
| `NODE_ENV` | `production` |

## 🚀 3. Final Build Sequence
1.  **Connect Repo**: Link your GitHub repository to a new **Railway Service**.
2.  **Trigger Deploy**: Nixpacks will detect the `next.config.ts` and `railway.json`.
3.  **Health Check**: The monitor will verify the root `/` path for the OLED black marketplace feed.

## 🚥 4. Post-Deploy Verification
*   **Whale Pulse**: Test a $10 gift to verify the **Neon Purple** border-glow and **Auto-Gratitude** response.
*   **Agency Hub**: Verify the `/dashboard` correctly identifies your **Master Admin UUID** to bypass persona limits.
*   **Split Engine**: Check the Supabase `transactions` table to confirm the **80% Split** to creators.

---
**The code is 100% build-safe and synchronized. On Railway, you'll finally see the high-resolution Gasp Marketplace in its full, unmasked glory.** 🥂

