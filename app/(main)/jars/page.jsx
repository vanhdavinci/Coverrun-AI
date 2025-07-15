"use client";

import { useState, useEffect } from "react";
import { checkUserAccumulativeSetup, getAccumulativeDashboardData } from "@/services/accumulativeFinancialService";
import { useUser } from "@/app/provider";
import AccumulativeDashboard from "./_components/AccumulativeDashboard";
import { toast } from "sonner";
import { useDataRefresh } from "@/context/DataRefreshContext";

const JarsPage = () => {
  const { user } = useUser();
  const { refreshTrigger } = useDataRefresh();
  const [dashboardData, setDashboardData] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPageData = async (isManualRefresh = false) => {
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

  const handleRefresh = () => {
    loadPageData(true);
  }

  // Show loading state only on the very first load
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your financial jars...</p>
        </div>
      </div>
    );
  }

  // Always show the accumulative dashboard
  return (
    <AccumulativeDashboard 
      dashboardData={dashboardData} 
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
    />
  );
};

export default JarsPage; 