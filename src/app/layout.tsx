import type { Metadata } from "next";
import { PocketProvider } from "@/components/pocket-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pocket Manager",
  description: "Pocket Manager is the mobile-first operator app for artists, with a lighter desktop landing surface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#05060a] text-white">
        <PocketProvider>{children}</PocketProvider>
      </body>
    </html>
  );
}
