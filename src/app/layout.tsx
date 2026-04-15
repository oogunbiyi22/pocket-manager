import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { PocketProvider } from "@/components/pocket-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pocket Manager — Your manager brain in your pocket",
    template: "%s | Pocket Manager",
  },
  description: "Your manager brain in your pocket. Release planning, royalty tracking, playlist pitching, vault storage, and outreach — built for independent artists doing team-sized work alone.",
  keywords: ["music manager", "independent artist", "royalties", "playlist pitching", "music release", "music business", "music vault", "gap engine"],
  applicationName: "Pocket Manager",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pocket Manager",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Pocket Manager — Your manager brain in your pocket",
    description: "Everything around the music, so you can stay in the music.",
    type: "website",
    siteName: "Pocket Manager",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pocket Manager",
    description: "Your manager brain in your pocket. Built for independent artists.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full scroll-smooth antialiased ${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        {/* PWA / mobile app meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pocket Manager" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        {/* Inline script to apply theme before first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('pocket-manager-theme') || 'system';
                var d = t === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
                document.documentElement.setAttribute('data-theme', d);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`min-h-full ${syne.variable} ${dmSans.variable}`}>
        <ThemeProvider>
          <PocketProvider>{children}</PocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
