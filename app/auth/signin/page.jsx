"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) {
    console.error("Error", error.message)
  }
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-400 to-emerald-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-xl">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Image 
              src="/image.png" 
              alt="VPBank Dashboard Logo" 
              width={300} 
              height={2000} 
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Welcome to VPBank Dashboard</h1>
            <p className="text-gray-500 mt-2">Sign in to get started</p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg border border-gray-300 shadow-sm transition duration-200"
          >
            <FcGoogle className="w-6 h-6" />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
} 