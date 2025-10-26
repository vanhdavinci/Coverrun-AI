"use client";

import React, { useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { useRouter } from "next/navigation";

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async (): Promise<void> => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          router.push('/overview');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/auth/signin');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Completing sign in...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
