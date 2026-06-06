import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";

import "./globals.css";
import { appConfig } from "@/lib/app-config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  icons: [{ rel: "icon", url: "/assets/logo.png" }],
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      className={`${inter.variable} ${bricolageGrotesque.variable}`}
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
