"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface TabItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  features: string[];
}

const TabsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("track");

  const tabs: TabItem[] = [
    {
      id: "track",
      title: "Smart Tracking",
      subtitle: "AI-powered expense tracking",
      description: "Never lose track of your money again. Our AI automatically categorizes your transactions, learns your spending patterns, and provides real-time insights into where your money goes.",
      image: "/6206970.jpg",
      features: [
        "Automatic categorization",
        "Spending pattern analysis",
        "Real-time notifications",
        "Smart alerts & warnings"
      ]
    },
    {
      id: "budget",
      title: "Intelligent Budgeting",
      subtitle: "AI-driven budget optimization",
      description: "Create budgets that actually work for your lifestyle. Our AI analyzes your income, expenses, and goals to suggest personalized budgets that adapt to your changing needs.",
      image: "/flat-design-busines...tion.png",
      features: [
        "Personalized budget suggestions",
        "Goal-based planning",
        "Spending predictions",
        "Adaptive recommendations"
      ]
    },
    {
      id: "save",
      title: "Automated Savings",
      subtitle: "Smart jar system",
      description: "Build wealth effortlessly with our intelligent savings system. Set up different savings goals and let our AI automatically allocate money based on your spending patterns and financial goals.",
      image: "/6207967.jpg",
      features: [
        "Smart jar allocation",
        "Goal-based savings",
        "Automatic transfers",
        "Progress tracking"
      ]
    },
    {
      id: "insights",
      title: "AI Insights",
      subtitle: "Personalized financial advice",
      description: "Get personalized financial advice from your AI assistant. Receive recommendations on spending optimization, investment opportunities, and strategies to achieve your financial goals faster.",
      image: "/6206970.jpg",
      features: [
        "Personalized recommendations",
        "Financial health analysis",
        "Goal achievement strategies",
        "24/7 AI assistance"
      ]
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Your complete AI financial assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From smart expense tracking to automated savings, CoverRun AI provides everything 
            you need to master your finances with the power of artificial intelligence.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={`px-6 py-3 text-base font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.title}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Content Side */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                    {activeTabData.title}
                  </h3>
                  <p className="text-xl text-blue-600 font-semibold mb-4">
                    {activeTabData.subtitle}
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {activeTabData.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {activeTabData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-semibold rounded-lg">
                    Try Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Image Side */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[400px] lg:min-h-[600px]">
              <div className="relative w-full h-full p-8 flex items-center justify-center">
                <Image
                  src={activeTabData.image}
                  alt={activeTabData.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TabsSection;
