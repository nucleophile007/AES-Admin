import type { Metadata } from "next";
import type { ReactNode } from 'react'
import AdminProviders from './AdminProviders'
import "./globals.css";

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
    <html lang="en">
      <body
        className="antialiased"
      >
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
