"use client";

import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { formatCurrency } from "@/services/accumulativeFinancialService";
import { RefreshCw, Settings, TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar, History, Home, Gamepad2, BookOpen, Heart } from "lucide-react";
import AddIncomeForm from "./AddIncomeForm";
import SettingsDialog from "./SettingsDialog";

const AccumulativeDashboard = ({ dashboardData, isRefreshing, onRefresh }) => {

  const getJarStatusColor = (balance) => {
    if (balance <= 0) return "text-gray-700";
    if (balance <= 500000) return "text-blue-600"; // Less than 500k VND
    return "text-blue-600";
  };

  const getJarStatusBadge = (balance) => {
    if (balance <= 0) return <Badge variant="destructive" className="">Empty</Badge>;
    if (balance <= 500000) return <Badge variant="secondary" className="">Low Balance</Badge>;
    return <Badge variant="default" className="">Healthy</Badge>;
  };

  const getJarIcon = (jarName) => {
    const icons = {
      'Necessity': Home,
      'Play': Gamepad2,
      'Education': BookOpen,
      'Investment': TrendingUp,
      'Charity': Heart,
      'Savings': Wallet
    };
    const IconComponent = icons[jarName] || Wallet;
    return <IconComponent className="w-6 h-6 text-blue-600" />;
  };

  // If no data is available, show loading state
  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading jar data...</p>
      </div>
    );
  }

  const { user: userData, jars, incomeHistory, lifetimeBalance } = dashboardData;


  // Check if this is a new user (no income added yet)
  const isNewUser = !incomeHistory || incomeHistory.length === 0;

  // Get latest allocation percentages from most recent income entry
  const getLastAllocations = () => {
    if (incomeHistory && incomeHistory.length > 0) {
      return incomeHistory[0].allocation_percentages;
    }
    return {};
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Accumulative Financial Jars</h1>
          <p className="text-gray-600">
            Track your growing savings across all categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <AddIncomeForm 
            lastIncomeAllocations={getLastAllocations()}
            onIncomeAdded={onRefresh}
          />
          <SettingsDialog onDataDeleted={onRefresh} />
        </div>
      </div>
      {isNewUser && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-2">Welcome to Your Financial Jars! 🎉</h2>
            <p className="text-green-700 mb-4">
              Your jars are ready and waiting. Start by adding your first monthly income to begin building your savings.
            </p>
            <div className="flex justify-center">
              <AddIncomeForm 
                lastIncomeAllocations={getLastAllocations()}
                onIncomeAdded={onRefresh}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lifetime Balance Section */}
      {lifetimeBalance && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-800">
              Lifetime Financial Summary
            </h2>
            {lifetimeBalance.firstTransactionDate && (
              <p className="text-sm text-blue-600">
                Since {new Date(lifetimeBalance.firstTransactionDate).toLocaleDateString()}
              </p>
            )}
          </div>
          {/* This Month Summary */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            
            {/* Monthly Jar Details */}
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Monthly Jar Breakdown</h4>
              <div className="space-y-3">
                {jars.map((jar) => {
                  // Calculate jar remaining capacity percentage (100% to 0%)
                  const monthlyIncome = jar.income_this_month || 0; // total added this month
                  const usedPercentage = monthlyIncome > 0 
                    ? Math.min(100, Math.round((jar.spent_this_month / monthlyIncome) * 100))
                    : 0;
                  const remainingPercentage = 100 - usedPercentage;
                    
                  return (
                    <div key={`monthly-${jar.category_id}`} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          {getJarIcon(jar.category_name)}
                          <span className="font-medium">{jar.category_name}</span>
                        </span>
                        <span className="text-xs font-medium">
                          {remainingPercentage}% Remaining
                        </span>
                      </div>
                      
                      {/* Progress bar for capacity usage */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                          className={`h-2.5 rounded-full ${
                            remainingPercentage <= 10 
                              ? 'bg-gradient-to-r from-red-500 to-red-600' 
                              : remainingPercentage <= 30 
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}
                          style={{ width: `${remainingPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Monthly Allocation:</span>
                          <p className="font-medium text-blue-600">{formatCurrency(monthlyIncome)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Spent This Month:</span>
                          <p className="font-medium text-gray-700">{formatCurrency(jar.spent_this_month)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Remaining:</span>
                          <p className="font-medium text-blue-600">{formatCurrency(monthlyIncome - jar.spent_this_month)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccumulativeDashboard;