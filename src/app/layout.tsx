import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from 'react'
import AdminProviders from './AdminProviders'
import "./globals.css";

// Inter for UI text, Plus Jakarta Sans for headings, JetBrains Mono for ids/code.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Acharya Admin",
  description: "Acharya Educational Services admin portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${mono.variable}`}>
      <body
        className="antialiased"
      >
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
