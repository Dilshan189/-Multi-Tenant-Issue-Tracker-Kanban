import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse | Multi-Tenant Issue Tracker & Autonomous Kanban",
  description:
    "Enterprise team issue tracking, fluid drag-and-drop kanban board, and autonomous Gemini AI agent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-foreground flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200"
      >
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
