"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import { getUserTransactions, getUserJarBalances } from "@/services/accumulativeFinancialService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import SavingsChart from "./_components/SavingsChart";
import MoneyFlow from "./_components/MoneyFlow";
import { BarChart2, TrendingUp, PieChart, Activity } from "lucide-react";
import Footer from "../_components/Footer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  amount_cents: number;
  occurred_at: string;
}

interface JarBalance {
  category_name?: string;
  category_id?: string;
  current_balance_cents: number;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jarBalances, setJarBalances] = useState<JarBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      getUserTransactions(user.id, 1000),
      getUserJarBalances(user.id),
    ])
      .then(([txs, jars]) => {
        setTransactions(txs || []);
        setJarBalances(jars || []);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Prepare data for income/outcome chart
  const monthlyData: Record<string, { income: number; outcome: number }> = {};
  transactions.forEach((tx) => {
    const month = tx.occurred_at?.slice(0, 7) || "Unknown";
    if (!monthlyData[month]) monthlyData[month] = { income: 0, outcome: 0 };
    if (tx.amount_cents > 0) monthlyData[month].income += tx.amount_cents;
    else monthlyData[month].outcome += Math.abs(tx.amount_cents);
  });
  const months = Object.keys(monthlyData).sort();
  const incomeData = months.map((m) => monthlyData[m].income);
  const outcomeData = months.map((m) => monthlyData[m].outcome);

  // Prepare data for jar balances over time (simple: show current balances by jar)
  const jarNames = jarBalances.map((jar) => jar.category_name || jar.category_id);
  const jarCurrentBalances = jarBalances.map((jar) => (jar.current_balance_cents || 0));

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8">
              <BarChart2 className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Financial Analytics
            </h1>
            <p className="text-xl lg:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Dive deep into your financial data with comprehensive analytics and insights. 
              Understand your spending patterns and make informed financial decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Power BI Style Dashboard */}
      <section className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Financial Analytics Dashboard</h2>
                <p className="text-gray-600">Comprehensive insights into your financial data</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Income KPI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(incomeData.reduce((a, b) => a + b, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Expenses KPI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(outcomeData.reduce((a, b) => a + b, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Net Savings KPI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Savings</p>
                  <p className={`text-2xl font-bold ${
                    (incomeData.reduce((a, b) => a + b, 0) - outcomeData.reduce((a, b) => a + b, 0)) >= 0 
                      ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(incomeData.reduce((a, b) => a + b, 0) - outcomeData.reduce((a, b) => a + b, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Jars KPI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jars</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {jarNames.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Income vs Outcome Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : months.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No transaction data available</p>
                    </div>
                  </div>
                ) : (
                  <Bar
                    data={{
                      labels: months,
                      datasets: [
                        {
                          label: "Income (VND)",
                          data: incomeData,
                          backgroundColor: "#10b981",
                          borderRadius: 4,
                        },
                        {
                          label: "Expenses (VND)",
                          data: outcomeData,
                          backgroundColor: "#ef4444",
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "#f3f4f6" },
                        },
                        x: {
                          grid: { color: "#f3f4f6" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Jar Balances Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Jar Balances</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : jarNames.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No jar data available</p>
                    </div>
                  </div>
                ) : (
                  <Bar
                    data={{
                      labels: jarNames,
                      datasets: [
                        {
                          label: "Balance (VND)",
                          data: jarCurrentBalances,
                          backgroundColor: jarCurrentBalances.map(v => v >= 0 ? "#3b82f6" : "#ef4444"),
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "#f3f4f6" },
                        },
                        x: {
                          grid: { color: "#f3f4f6" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Full Width Charts Row */}
          <div className="grid grid-cols-1 gap-6">
            {/* Savings Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Savings Growth Over Time</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
              <div className="h-96 w-full relative">
                <SavingsChart />
              </div>
            </div>

            {/* Money Flow Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Balance Over Time</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
              <div className="h-96 w-full relative">
                <MoneyFlow />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Advanced Analytics Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful insights to help you understand and improve your financial habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trend Analysis</h3>
              <p className="text-gray-600">
                Identify patterns in your spending and income to make better financial decisions.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PieChart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Visual Insights</h3>
              <p className="text-gray-600">
                Beautiful charts and graphs that make complex financial data easy to understand.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Updates</h3>
              <p className="text-gray-600">
                Get instant updates on your financial metrics as you make transactions.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default AnalyticsPage;
