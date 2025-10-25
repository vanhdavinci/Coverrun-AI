"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { useUser } from "@/app/provider";

interface DashboardProviderProps {
  children: React.ReactNode;
}

function DashboardProvider({ children }: DashboardProviderProps): React.JSX.Element {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          // Redirect to login page if not authenticated
          router.replace('/auth/signin');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.replace('/auth/signin');
      }
    }
    
    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          <p className="text-indigo-100">Preparing your financial dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {children}
    </div>
  );
}

export default DashboardProvider;
