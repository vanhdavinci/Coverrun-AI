"use client";

import React from "react";
import { Card } from '@/components/ui/card';
import TransactionList from './_components/TransactionList';
import TransactionForm from './_components/TransactionForm';
import { useDataRefresh } from '@/context/DataRefreshContext';
import { useUser } from "@/app/provider";
import { Receipt, Plus, History, TrendingUp, DollarSign } from "lucide-react";
import Footer from "../_components/Footer";

const TransactionsPage: React.FC = () => {
  const { user } = useUser();
  const { triggerRefresh } = useDataRefresh();

  const handleTransactionSuccess = (): void => {
    triggerRefresh();
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8">
              <Receipt className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Transaction Management
            </h1>
            <p className="text-xl lg:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Track, categorize, and manage all your financial transactions with ease. Keep your finances organized and under control.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Transaction Form */}
            <div className="lg:col-span-1">
              <Card className="p-8 bg-white rounded-3xl shadow-2xl border-0">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add Transaction</h2>
                    <p className="text-gray-600">Record a new financial transaction</p>
                  </div>
                </div>
                <TransactionForm onTransactionSuccess={handleTransactionSuccess} />
              </Card>
            </div>

            {/* Transaction List */}
            <div className="lg:col-span-2">
              <Card className="p-8 bg-white rounded-3xl shadow-2xl border-0">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <History className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
                    <p className="text-gray-600">View and manage your transaction records</p>
                  </div>
                </div>
                <TransactionList />
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Smart Transaction Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools to help you manage your financial transactions effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Easy Recording</h3>
              <p className="text-gray-600">
                Quickly add transactions with smart categorization and automatic suggestions.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Analytics</h3>
              <p className="text-gray-600">
                Get insights into your spending patterns and financial trends over time.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Budget Integration</h3>
              <p className="text-gray-600">
                Seamlessly integrate with your jar system for better financial planning.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TransactionsPage;
