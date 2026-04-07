import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Syncopate } from "next/font/google";
import "./globals.css";
import { UserProvider } from '@/components/providers/UserProvider';

const inter = Inter({ subsets: ["latin"], weight: ['400', '700', '900'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], weight: ['400', '700', '900'], variable: '--font-outfit' });
const syncopate = Syncopate({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-syncopate' });

const SITE_URL = 'https://gasp.fun';

export const metadata: Metadata = {
  title: 'GASP // Premium Archive',
  description: 'The official @Gasp. High-status digital media archive and premium creator feed.',
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GASP // Premium Archive',
    description: "The official Gasp. Exclusive digital media archive and premium creator feed.",
    url: SITE_URL,
    siteName: 'Gasp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GASP',
    description: "The official @Gasp. High-status creator content, exclusive dispatches, and $GASPai member rewards.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  }
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import Providers from '@/components/providers/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${syncopate.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script src="https://terminal.jup.ag/main-v2.js" defer></script>
      </head>
      <body className="bg-black overflow-x-hidden antialiased selection:bg-[#ff00ff]/30 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
