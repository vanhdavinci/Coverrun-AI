"use client";

import React, { useState, useEffect } from "react";
import { checkUserAccumulativeSetup, getAccumulativeDashboardData } from "@/services/accumulativeFinancialService";
import { useUser } from "@/app/provider";
import AccumulativeDashboard from "./_components/AccumulativeDashboard";
import { toast } from "sonner";
import { useDataRefresh } from "@/context/DataRefreshContext";
import { PiggyBank, TrendingUp, TrendingDown, Target, DollarSign, Home, Gamepad2, BookOpen, TrendingUp as Investment, Heart, Wallet } from "lucide-react";
import Footer from "../_components/Footer";

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

const JarsPage: React.FC = () => {
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
      console.error("Error loading jars page data:", error);
      toast.error("Failed to load jar data");
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

  const handleRefresh = (): void => {
    loadPageData(true);
  };

  const getJarStatusColor = (balance: number): string => {
    if (balance <= 0) return "text-gray-700";
    if (balance <= 500000) return "text-blue-600";
    return "text-blue-600";
  };

  const getJarStatusBadge = (balance: number): string => {
    if (balance <= 0) return "Empty";
    if (balance <= 500000) return "Low Balance";
    return "Healthy";
  };

  const getJarIcon = (jarName: string) => {
    const icons: { [key: string]: React.ComponentType<{ className?: string }> } = {
      'Necessity': Home,
      'Play': Gamepad2,
      'Education': BookOpen,
      'Investment': Investment,
      'Charity': Heart,
      'Savings': Wallet
    };
    const IconComponent = icons[jarName] || Wallet;
    return <IconComponent className="w-6 h-6 text-blue-600" />;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading state only on the very first load
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Setting up your financial jars...</h2>
          <p className="text-indigo-100">Preparing your personalized money management system</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className=" w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8">
              <PiggyBank className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Smart Money Jars
            </h1>
            <p className="text-xl lg:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Organize your finances with our intelligent jar system. Allocate your money across different categories for better financial control.
            </p>
            
          </div>
        </div>
      </section>

      {/* Power BI Style Dashboard */}
      <section className="py-8 bg-gray-50 min-h-screen ml-7 mr-7">
        <div className="w-full sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <button 
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>


          {/* Dashboard Grid - Power BI Style */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Main Dashboard - Takes 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Jars Overview</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Live</span>
                  </div>
                </div>
                <AccumulativeDashboard 
                  dashboardData={dashboardData} 
                  isRefreshing={isRefreshing}
                  onRefresh={handleRefresh}
                />
              </div>
            </div>

            {/* Quick Stats Panel - Takes 1 column */}
            <div className="space-y-6">
              {/* Total Income Added Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Income Added</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardData?.lifetimeBalance?.lifetimeIncome || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Spent Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(dashboardData?.lifetimeBalance?.lifetimeExpenses || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Balance (All Jars) Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Balance (All Jars)</p>
                    <p className={`text-2xl font-bold ${
                      (dashboardData?.lifetimeBalance?.totalBalance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(dashboardData?.lifetimeBalance?.totalBalance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Income Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(dashboardData?.lifetimeBalance?.monthlyIncome || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Jars Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jars</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {dashboardData?.jars?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Income Additions Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Recent Income</h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Live</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">October 2025</p>
                      <p className="text-sm font-semibold text-blue-600">15.000.000 ₫</p>
                      <p className="text-xs text-gray-500">Added on 10/25/2025</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jar Cards Grid Section */}
          {dashboardData?.jars && dashboardData.jars.length > 0 && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Jars</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Live</span>
                  </div>
                </div>
                
                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.jars.map((jar) => (
                    <div key={jar.category_id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all duration-300">
                            {getJarIcon(jar.category_name)}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{jar.category_name}</h4>
                            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{jar.category_description}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium group-hover:scale-105 transition-transform duration-300 ${
                          getJarStatusBadge(jar.current_balance_cents) === 'Empty' 
                            ? 'bg-gray-100 text-gray-800 group-hover:bg-gray-200' 
                            : getJarStatusBadge(jar.current_balance_cents) === 'Low Balance'
                            ? 'bg-blue-100 text-blue-800 group-hover:bg-blue-200'
                            : 'bg-blue-100 text-blue-800 group-hover:bg-blue-200'
                        }`}>
                          {getJarStatusBadge(jar.current_balance_cents)}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Current Balance */}
                        <div className="bg-gray-50 group-hover:bg-blue-50 rounded-lg p-4 transition-colors duration-300">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">Current Balance:</span>
                            <span className={`text-xl font-bold group-hover:scale-105 transition-transform duration-300 ${getJarStatusColor(jar.current_balance_cents)}`}>
                              {formatCurrency(jar.current_balance_cents)}
                            </span>
                          </div>
                        </div>

                        {/* Latest Allocation */}
                        {jar.latest_allocation_percentage > 0 && (
                          <div className="flex justify-between text-sm group-hover:bg-gray-50 rounded px-2 py-1 transition-colors duration-300">
                            <span className="group-hover:text-gray-800 transition-colors duration-300">Latest Allocation:</span>
                            <span className="font-semibold group-hover:scale-105 transition-transform duration-300">{jar.latest_allocation_percentage}%</span>
                          </div>
                        )}

                        {/* Total Income */}
                        <div className="flex justify-between text-sm group-hover:bg-gray-50 rounded px-2 py-1 transition-colors duration-300">
                          <span className="group-hover:text-gray-800 transition-colors duration-300">Total Income:</span>
                          <span className="font-semibold text-blue-600 group-hover:scale-105 transition-transform duration-300">
                            {formatCurrency(jar.total_income_cents)}
                          </span>
                        </div>

                        {/* Total Spent */}
                        <div className="flex justify-between text-sm group-hover:bg-gray-50 rounded px-2 py-1 transition-colors duration-300">
                          <span className="group-hover:text-gray-800 transition-colors duration-300">Total Spent:</span>
                          <span className="font-semibold text-gray-700 group-hover:scale-105 transition-transform duration-300">
                            {formatCurrency(jar.total_spent_cents)}
                          </span>
                        </div>

                        {/* This Month Income */}
                        {jar.income_this_month > 0 && (
                          <div className="flex justify-between text-sm group-hover:bg-gray-50 rounded px-2 py-1 transition-colors duration-300">
                            <span className="group-hover:text-gray-800 transition-colors duration-300">This Month:</span>
                            <span className="font-semibold text-blue-600 group-hover:scale-105 transition-transform duration-300">
                              {formatCurrency(jar.income_this_month)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default JarsPage;
