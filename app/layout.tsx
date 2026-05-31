import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fay — Your AI Business Assistant",
  description: "Personal AI assistant for TikTok and business management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
