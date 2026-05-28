import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { appConfig } from "@/lib/app-config";

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
