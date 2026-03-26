# Mi Amor • Verdad Redesign Spec (2026)

**Identity:** A raw, authentic "Private Messenger + Social Feed" hybrid. Transitioned from the legacy "Social Club" aesthetic to a premium, exclusive, OLED-black platform for high-end Latin American interactions.

---

## 🎨 1. Visual Architecture (OLED Verdad)
*   **The Blackest Theme**: Strict OLED True Black (`#000000`) for maximum contrast and premium night-mode feel.
*   **Glassmorphism Glass**: Headers and Navigation use high-end `backdrop-blur-xl` (15px) with `white/8 border`.
*   **Two-Panel Desktop Layout**:
    *   **Left Sidebar (Inbox)**: A persistent list of "Direct Messages" with glowing Online status and last-message previews.
    *   **Center Column (Social Feed)**: A vertically scrolling story-style feed of raw status updates/photos.
*   **Mobile Navigation**: Low-profile bottom navbar for switching between "Reality Feed" and "Private Lines."

## 📡 2. The Shared Reality Engine
*   **Real-Time City Sync**: Every profile and post is linked to a specific city (Santiago, Medellín, Rio, Madrid).
*   **Environment Widgets**: Real-time **Local Time & Weather** displayed in chat headers and sidebars.
*   **LLM Context Injection**: The current city context (e.g., "82°F • Night in Santiago") is passed directly to the AI, allowing it to naturally reference the time/weather (e.g., "it's late here," "the sun is setting in medallo").

## 🧠 3. AI Persona Protocol (Raw Street)
*   **Persona Profile**: Powered by **Meta Llama 3 (8B)** via OpenRouter.
*   **Vibe Check**: Strictly **Lowercase Only**. No corporate talk. No AI formalisms. 
*   **Slang Integration**: Uses city-specific slang for authenticity:
    *   **DR**: "klk", "dimelo", "dame luz", "k lo k".
    *   **Colombia**: "parce", "mor", "parcero".
*   **Gratitude-Aware**: AI is programmed to recognize and thank users for "Priority Infusion" (tips).

## 💳 4. Monetization & Paywall
*   **The 3-Msg Buffer**: Users get 3 complimentary messages to establish a connection.
*   **The "Private Line" Gate**: On the 4th message attempt, a premium modal triggers.
*   **Price Points**:
    *   **Unlock Single Line**: $19.99/mo per persona.
    *   **Elite All-Access**: $39.99/mo for all personas.

## 🛠️ 5. Technical Stack
*   **Frontend**: Next.js 16.2.0 (App Router) + Turbopack.
*   **Styling**: Tailwind CSS 4.0 (CSS-Variable First).
*   **Animations**: Framer Motion 12.0.
*   **AI Backend**: Vercel AI SDK 6.0 + OpenRouter API.
*   **Database**: Supabase (PostgreSQL + Real-time).
*   **Runtime**: Node.js 22 (LTS).

---

## 🖼️ 6. Screen-by-Screen Breakdown

### A. The Home Social Feed (`src/app/page.tsx`)
A vertically scrolling feed of "Shared Reality" posts. Each post shows the persona's name, their city/time badge, a large photo/video area, and an authentic "raw status" caption. 
*   **Action**: "Private Line" button deep-links directly to the chat session.

### B. The Inbox Sidebar
Real-time "Directs" list. Displays active personas with their current atmosphere (e.g., "Medellín: 74°F • Sunset").

### C. The Private Messenger (`src/app/chat/[id]/page.tsx`)
A high-contrast, encrypted-style chat interface.
*   **Header**: Shows the "Shared Reality" sync for the specific persona.
*   **Chat Box**: Lowercase-first input, message counter (X/3), and a premium-gradient SEND button.
*   **Logic**: Implements the RRA (Realistic Response Algorithm) with simulated human typing delays.

---

### 🚀 Future Roadmap: Verdad 2.0
*   **Live Broadcasts**: Momentary "Live" status alerts in the feed.
*   **Voice Notes**: Encrypted audio clips for premium lines.
*   **Auto-Generation**: Periodic background post generation for personas using LLV (Local Language Variation) scripts.

