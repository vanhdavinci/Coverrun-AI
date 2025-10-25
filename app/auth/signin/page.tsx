"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const signInWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) {
    console.error("Error", error.message);
  }
};

const SignInPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Image 
              src="/Coverrunlogo.jpg" 
              alt="CoverRun Logo" 
              width={200} 
              height={150}
              className="rounded-lg"
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to CoverRun</h1>
            <p className="text-gray-600">Your Personal AI Financial Assistant</p>
            <p className="text-gray-500 text-sm mt-2">Sign in to get started</p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-lg border-2 border-gray-300 hover:border-blue-400 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <FcGoogle className="w-6 h-6" />
            <span>Continue with Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
