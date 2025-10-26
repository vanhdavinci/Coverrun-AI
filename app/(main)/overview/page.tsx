"use client";

import React, { useState, useEffect } from "react";
import { User, TrendingUp, Target, Lightbulb, ArrowRight, Wallet, PiggyBank, Receipt, BarChart2, LayoutDashboard, Brain, Trophy, Zap, DollarSign } from "lucide-react";
import { useUser } from "@/app/provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import Footer from "../_components/Footer";
import { checkUserAccumulativeSetup, getAccumulativeDashboardData } from "@/services/accumulativeFinancialService";
import { toast } from "sonner";
import { useDataRefresh } from "@/context/DataRefreshContext";

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

interface DashboardData {
  user: any;
  jars: any[];
  incomeHistory: any[];
  lifetimeBalance: {
    lifetimeIncome: any;
    lifetimeExpenses: number;
    totalBalance: any;
    monthlyIncome: any;
    monthlyExpenses: any;
    monthlySavings: number;
    firstTransactionDate: any;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const { refreshTrigger } = useDataRefresh();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadPageData = async (isManualRefresh: boolean = false): Promise<void> => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (isInitialLoading) {
      setIsInitialLoading(true);
    }

    try {
      if (!user?.id) return;
      
      // Check setup (auto-initializes jars for new users)
      await checkUserAccumulativeSetup(user.id);

      // Load dashboard data
      const data = await getAccumulativeDashboardData(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPageData();
    }
  }, [user?.id, refreshTrigger]);

  const features: FeatureCard[] = [
    {
      title: "Financial Overview",
      description: "Track your account balance and recent transactions with real-time updates",
      icon: Wallet,
      href: "/dashboard",
      color: "bg-blue-50 border-blue-200 text-blue-600"
    },
    {
      title: "Smart Jars System",
      description: "Organize your money into different categories for better financial planning",
      icon: PiggyBank,
      href: "/jars",
      color: "bg-green-50 border-green-200 text-green-600"
    },
    {
      title: "Transaction Management",
      description: "Add, edit, and categorize your financial transactions with ease",
      icon: Receipt,
      href: "/transactions",
      color: "bg-purple-50 border-purple-200 text-purple-600"
    },
    {
      title: "Analytics & Insights",
      description: "Get personalized financial insights and spending pattern analysis",
      icon: BarChart2,
      href: "/analytics",
      color: "bg-orange-50 border-orange-200 text-orange-600"
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Financial Dashboard
            </h1>
            <p className="text-xl lg:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Your intelligent financial management platform. Take control of your money with AI-powered insights and smart budgeting tools.
            </p>
            


          </div>
        </div>
      </section>

      {/* Smart Money Jars Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8">
              <PiggyBank className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Smart Money Jars
            </h2>
            <p className="text-xl lg:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Organize your finances with our intelligent jar system. Allocate your money across different categories for better financial control.
            </p>
          </div>
          
          {/* Quick Stats */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ${dashboardData.lifetimeBalance?.totalBalance?.toLocaleString() || '0'}
                </h3>
                <p className="text-gray-600">Total Balance</p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4 mx-auto">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ${dashboardData.lifetimeBalance?.monthlyIncome?.toLocaleString() || '0'}
                </h3>
                <p className="text-gray-600">Monthly Income</p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4 mx-auto">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {dashboardData.jars?.length || 0}
                </h3>
                <p className="text-gray-600">Active Jars</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Your Financial Command Center
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your finances effectively, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={index} href={feature.href}>
                  <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 border-2 border-transparent hover:border-blue-200 hover:-translate-y-2 h-80 flex flex-col">
                    <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300 relative">
                      <span className="relative">
                        Explore
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                      </span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:rotate-45 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Why Choose CoverRun AI?
            </h2>
            <p className="text-xl text-blue-50 max-w-3xl mx-auto">
              Join thousands of users who have transformed their financial lives with our intelligent platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group text-center text-white hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-opacity-30 group-hover:scale-110 transition-all duration-300">
                <Brain className="w-10 h-10 text-blue-500 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-200 transition-colors duration-300">Smart Insights</h3>
              <p className="text-blue-50 group-hover:text-white transition-colors duration-300">
                AI-powered analysis of your spending patterns and financial habits
              </p>
            </div>
            
            <div className="group text-center text-white hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-opacity-30 group-hover:scale-110 transition-all duration-300">
                <Trophy className="w-10 h-10 text-blue-500 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-200 transition-colors duration-300">Goal Achievement</h3>
              <p className="text-blue-50 group-hover:text-white transition-colors duration-300">
                Set and track financial goals with personalized recommendations
              </p>
            </div>
            
            <div className="group text-center text-white hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-opacity-30 group-hover:scale-110 transition-all duration-300">
                <Zap className="w-10 h-10 text-blue-500 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-200 transition-colors duration-300">Smart Automation</h3>
              <p className="text-blue-50 group-hover:text-white transition-colors duration-300">
                Automated categorization and intelligent financial suggestions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Finances?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Start your journey towards better financial health today. Explore our features and discover how CoverRun AI can help you achieve your financial goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jars">
              <Button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <span className="relative z-10">Start with Jars</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </Link>
            <Link href="/transactions">
              <Button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                <span className="relative z-10">Add Transactions</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
