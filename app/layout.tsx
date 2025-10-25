import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Provider from "./provider";
import ChatBubble from "@/components/ChatBubble";
import DashboardHeader from "./(main)/_components/DashboardHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CoverRun AI Dashboard",
  description: "Your comprehensive financial management platform",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          <DashboardHeader />
          {children}
          <ChatBubble />
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
