import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const bbManualMono = IBM_Plex_Mono({
  variable: "--font-bb-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RetakeBase - The Fastest CS2 Retake Server",
  description: "Join RetakeBase, the fastest CS2 retakes server. Low ping, zero lag, 64-tick gameplay. Get VIP for exclusive perks including knife skins and XP boost.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`antialiased dark ${bbManualMono.variable}`} style={{ colorScheme: 'dark' }}>
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
