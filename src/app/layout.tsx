import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HairBook - Správa kadeřnictví",
  description: "Moderní aplikace pro správu kadeřnictví",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
