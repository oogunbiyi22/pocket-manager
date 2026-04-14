import type { Metadata } from "next";
import { PocketProvider } from "@/components/pocket-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pocket Manager",
    template: "%s | Pocket Manager",
  },
  description: "Pocket Manager finds missing creator revenue paths and tells music creatives exactly what to do next.",
  keywords: ["music royalties", "creator revenue", "independent artist", "gap engine", "music business"],
  openGraph: {
    title: "Pocket Manager",
    description: "Find missing royalties. Close the Gap.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased" suppressHydrationWarning>
      <head>
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
      <body className="min-h-full">
        <ThemeProvider>
          <PocketProvider>{children}</PocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
