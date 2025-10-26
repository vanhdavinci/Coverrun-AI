"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8 text-white">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Ready to meet your AI financial assistant?
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Join thousands of users who have transformed their financial lives with CoverRun AI. 
                Start your journey today and discover how our intelligent assistant can help you save more, 
                spend smarter, and achieve your financial goals faster than ever before.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/overview">
                <Button className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg">
                  Start with AI Assistant
                </Button>
              </Link>
              <Link href="/jars">
                <Button className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg">
                  Try Smart Jars
                </Button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative w-full h-[400px] lg:h-[500px]">
              <Image
                src="/1910.i039.014_wealth management isometric.jpg"
                alt="CoverRun  Platform Interface"
                fill
                className="object-contain"
              />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-white bg-opacity-20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
