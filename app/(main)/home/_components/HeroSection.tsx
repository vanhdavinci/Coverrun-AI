"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Personal AI Financial Assistant
              </h1>
              <h4 className="text-xl lg:text-2xl text-gray-700 font-medium">
                Meet your intelligent financial companion that learns your habits, predicts your needs, and guides you to financial success.
              </h4>
              <p className="text-lg text-gray-600 leading-relaxed">
                CoverRun AI is more than just an app - it's your personal financial advisor that works 24/7 to help you save money, 
                avoid overspending, and achieve your financial dreams. Get personalized insights, smart budgeting, and automated savings 
                that adapt to your lifestyle and goals.
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg">
                  Start with AI Assistant
                </Button>
              </Link>
              <Link href="/jars">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-lg">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative w-full h-[500px] lg:h-[600px]">
              <Image
                src="/flat-design-business-communication.png"
                alt="AI Financial Assistant - Collaborative Financial Management"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            {/* Floating elements for visual interest */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-200 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-indigo-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

