import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Syncopate } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/providers/UserProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import InstallHint from "@/components/pwa/InstallHint";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
// GASP STABLE PROTOCOL: RE-HYDRATING NIXPACKS CACHE

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-syncopate" });

const SITE_URL = 'https://gasp.fun';

export const metadata: Metadata = {
  title: "GASP | AI Creator Companions",
  description: "Meet GASP — the most immersive AI creator platform. Chat, connect, and unlock exclusive content from the world's most captivating AI personas. Powered by $GASPAI.",
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  keywords: [
    "AI girlfriend", "AI companion", "AI creator", "virtual influencer",
    "AI chat", "NSFW AI", "adult AI platform", "AI persona",
    "crypto AI", "GASPAI", "web3 creator", "AI social"
  ],
  authors: [{ name: "AllTheseFlows LLC" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "GASP | AI Creator Companions",
    description: "The most immersive AI creator platform. Chat, connect, and unlock exclusive content from elite AI personas.",
    siteName: "GASP",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1024,
        height: 1024,
        alt: "GASP — AI Creator Platform",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GASP | AI Creator Companions",
    description: "The most immersive AI creator platform. Unlock elite AI personas today.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@gaspfun",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GASP",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://asset.gasp.fun" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
        <style dangerouslySetInnerHTML={{ __html: `
          #debug-marker { display: block !important; background: red; color: white; position: fixed; top: 0; left: 0; z-index: 99999; padding: 10px; font-weight: bold; }
        ` }} />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${syncopate.variable} font-sans bg-black text-white antialiased selection:bg-[#ff00ff] selection:text-black overflow-x-hidden hide-scrollbar text-base`}>
        <GoogleAnalytics />
        <UserProvider>
          <WalletProvider>
            <InstallHint />
            {children}
          </WalletProvider>
        </UserProvider>

        {/* SECURE MICRO-NAV (CCBill Requirement - Completely Unobtrusive) */}
        <div className="fixed bottom-1.5 left-0 right-0 z-[9999] pointer-events-none flex items-center justify-center gap-4 md:gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <a href="/terms" className="pointer-events-auto text-[7.5px] uppercase tracking-[0.25em] text-white/60 hover:text-white font-black drop-shadow-[0_0_5px_rgba(0,0,0,1)]">Terms</a>
            <a href="/privacy" className="pointer-events-auto text-[7.5px] uppercase tracking-[0.25em] text-white/60 hover:text-white font-black drop-shadow-[0_0_5px_rgba(0,0,0,1)]">Privacy</a>
            <a href="/refunds" className="pointer-events-auto text-[7.5px] uppercase tracking-[0.25em] text-white/60 hover:text-white font-black drop-shadow-[0_0_5px_rgba(0,0,0,1)]">Refunds</a>
            <a href="/contact" className="pointer-events-auto text-[7.5px] uppercase tracking-[0.25em] text-white/60 hover:text-white font-black drop-shadow-[0_0_5px_rgba(0,0,0,1)]">Contact</a>
        </div>
      </body>
    </html>
  );
}



