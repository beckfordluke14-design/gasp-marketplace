# Implementation Plan - "The Squeezed Funnel"

The goal is to create a high-conversion landing page for TrafficStars traffic that funnels users through a customization survey directly to a premium offer.

## 1. New Route: `/funnel`
- Create `src/app/funnel/page.tsx`.
- This page will be the target for ad traffic (e.g., `gasp.ai/funnel`).

## 2. Funnel Components
- **Step 1: Customization Flow**
  - Question 1: Race/Ethnicity (European, Latina, Asian, African, etc.)
  - Question 2: Body Type (Slim, Athletic, Curvy, etc.)
  - Question 3: Personality Type (Sweet, Dominant, Playful, etc.)
  - Question 4: Interest (Gaming, Cosplay, Fitness, etc.)
- **Step 2: Matching Animation**
  - "Scanning Neural Network..."
  - "Generating Aesthetic Profile..."
  - "Matching with 5,000+ Personas..."
- **Step 3: Offer Page (The Squeeze)**
  - Display a "Match Found" banner.
  - Present the pricing table inspired by the competitor's design.
  - Highlight the "Most Popular" 12-month (or equivalent high-value) package.
  - Frame pricing as "Price per day" to make it look cheaper.

## 3. UI/UX Design
- **Premium Aesthetics**: Use the existing design system (Black, Neon Blue `#00f0ff`, Magenta `#ff00ff`, Yellow `#ffea00`).
- **Glassmorphism**: Use backdrop blurs and subtle borders.
- **Micro-animations**: Use `framer-motion` for smooth transitions between steps.

## 4. Technical Details
- Use `localStorage` to save the user's choices.
- Direct integration with `Stripe Onramp` and `Solana Pay`.
- SEO optimization for the landing page.

## 5. Next Steps
1. Create the `FunnelView` component.
2. Create the customization steps.
3. Build the Premium Offer table.
4. Hook up the payment logic.
