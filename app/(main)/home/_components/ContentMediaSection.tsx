"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const ContentMediaSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Stop struggling with complex financial management
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Managing your finances shouldn't be complicated or time-consuming. Traditional budgeting apps 
                are rigid, difficult to use, and don't understand your unique financial situation. 
                You end up spending more time managing the app than actually improving your finances.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                CoverRun AI's intelligent assistant learns your spending patterns, automatically categorizes 
                transactions, and provides personalized recommendations that actually work for your lifestyle. 
                No more manual data entry or confusing interfaces.
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg">
                  Try AI Assistant
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-lg">
                  See Analytics
                </Button>
              </Link>
            </div>
          </div>

          {/* Media */}
          <div className="relative">
            <div className="relative w-full h-[400px] lg:h-[500px]">
              <Image
                src="/6207967.jpg"
                alt="AI Financial Management - Business Meeting and Data Analysis"
                fill
                className="object-cover rounded-lg shadow-2xl"
              />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-100 rounded-full opacity-60"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100 rounded-full opacity-40"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentMediaSection;
