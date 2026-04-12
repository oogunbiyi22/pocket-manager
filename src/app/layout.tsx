import type { Metadata } from "next";
import { PocketProvider } from "@/components/pocket-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pocket Manager",
    template: "%s | Pocket Manager",
  },
  description: "Pocket Manager finds missing creator revenue paths and tells music creatives exactly what to do next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full bg-[#f4f1eb] text-[#111]">
        <PocketProvider>{children}</PocketProvider>
      </body>
    </html>
  );
}
