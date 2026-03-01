import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Vistara — Infinite Study Canvas",
  description:
    "An offline-first infinite canvas for studying, note-taking, and organising ideas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-[#1a1a2e] text-white`}>
        {children}
      </body>
    </html>
  );
}
