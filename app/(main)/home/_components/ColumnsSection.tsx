"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column {
  icon: string;
  title: string;
  description: string;
}

const ColumnsSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(7 / itemsPerSlide); // 7 items, 3 per slide = 3 slides

  const columns: Column[] = [
    {
      icon: "https://covergo.com/wp-content/uploads/2024/05/Speed_Dark.svg",
      title: "Smart Expense Tracking",
      description: "Automatically categorize and track your spending with AI-powered insights. CoverRun AI learns from your financial habits to provide personalized recommendations and identify opportunities to save money. Get real-time notifications about unusual spending patterns and budget alerts."
    },
    {
      icon: "https://covergo.com/wp-content/uploads/2024/05/Replace_Dark.svg",
      title: "Intelligent Budgeting",
      description: "Create and maintain budgets effortlessly with our AI-driven budgeting system. Set financial goals, track progress, and receive smart suggestions to optimize your spending. Our platform adapts to your lifestyle and financial situation, making budgeting simple and effective."
    },
    {
      icon: "https://covergo.com/wp-content/uploads/2024/05/Time_Dark.svg",
      title: "Automated Savings",
      description: "Build your savings automatically with our Smart Jars system. Set up different savings goals for vacations, emergencies, or major purchases. Our AI analyzes your income and spending patterns to suggest optimal savings amounts and timing."
    },
    {
      icon: "https://covergo.com/wp-content/uploads/2024/05/More_Money_Dark.svg",
      title: "Financial Analytics",
      description: "Get comprehensive insights into your financial health with detailed analytics and reports. Understand your spending trends, identify areas for improvement, and track your progress toward financial goals. Make informed decisions with data-driven recommendations."
    },
    {
      icon: "https://covergo.com/wp-content/uploads/2024/05/People_Dark.svg",
      title: "Goal Achievement",
      description: "Set and achieve your financial goals with personalized roadmaps and milestone tracking. Whether you're saving for a house, planning for retirement, or building an emergency fund, our AI provides tailored strategies and motivation to keep you on track."
    },
    {
      icon: "https://covergo.com/wp-content/uploads/2024/05/Innovation_Dark.svg",
      title: "AI-Powered Insights",
      description: "Leverage advanced artificial intelligence to understand your financial behavior and receive personalized advice. Our AI learns from your patterns to predict future expenses, suggest investment opportunities, and help you make smarter financial decisions."
    },
    {
      icon: "https://covergo.com/wp-content/uploads/2024/05/Deployment_Dark.svg",
      title: "Secure & Private",
      description: "Your financial data is protected with bank-level security and encryption. We use advanced privacy-preserving techniques to ensure your personal information remains secure while still providing powerful AI insights. Your financial privacy is our top priority."
    }
  ];

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // 4 seconds per slide

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false); // Pause auto-play when user interacts
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false); // Pause auto-play when user interacts
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    setIsAutoPlaying(false); // Pause auto-play when user interacts
  };

  const getCurrentItems = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return columns.slice(startIndex, startIndex + itemsPerSlide);
  };

  return (
    <section className="py-20 bg-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Why choose CoverRun AI?
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Whether you're just starting your financial journey or looking to optimize your existing strategy, 
            CoverRun AI is the perfect choice if you want to:
          </p>
        </div>

        {/* Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }, (_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {columns.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide).map((column, index) => (
                      <div 
                        key={index}
                        className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                      >
                        <div className="space-y-6">
                          {/* Icon */}
                          <div className="w-16 h-16 flex-shrink-0">
                            <Image
                              src={column.icon}
                              alt={`${column.title} Icon`}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* Content */}
                          <div className="space-y-4">
                            <h4 className="text-xl font-bold text-gray-900 leading-tight">
                              {column.title}
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                              {column.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center items-center mt-12 space-x-2">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 cursor-pointer ${
                currentSlide === index 
                  ? 'bg-white' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ColumnsSection;
