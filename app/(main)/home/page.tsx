"use client";

import React from "react";
import HeroSection from "./_components/HeroSection";
import LogosSection from "./_components/LogosSection";
import ContentMediaSection from "./_components/ContentMediaSection";
import TabsSection from "./_components/TabsSection";
import VideoSection from "./_components/VideoSection";
import ColumnsSection from "./_components/ColumnsSection";
import CTASection from "./_components/CTASection";
import Footer from "./_components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100 text-gray-800">
      <main>
        <HeroSection />
        <LogosSection />
        <ContentMediaSection />
        <TabsSection />
        <VideoSection />
        <ColumnsSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
}