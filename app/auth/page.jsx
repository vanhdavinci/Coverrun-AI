"use client";

import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaArchway, FaFacebook, FaLinkedin } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-400 to-emerald-500 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-lg overflow-hidden shadow-xl">
        {/* Left Side - Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center p-10 bg-green-50 relative">
          <div className="absolute top-8 left-8">
            <div className="flex items-center gap-2">
              <Image 
                src="/image.png" 
                alt="Logo" 
                width={200} 
                height={1500} 
              />
            </div>
          </div>
          <div className="relative w-full h-80">
            <Image
              src="/auth-illustration.svg"
              alt="Authentication"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="absolute w-full h-full">
            {/* Decorative diamond shapes */}
            <div className="absolute top-20 left-16 w-8 h-8 bg-green-200 rotate-45 opacity-50"></div>
            <div className="absolute bottom-32 right-16 w-12 h-12 bg-green-200 rotate-45 opacity-50"></div>
            <div className="absolute top-40 right-20 w-6 h-6 bg-green-200 rotate-45 opacity-50"></div>
            <div className="absolute bottom-20 left-20 w-10 h-10 bg-green-200 rotate-45 opacity-50"></div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col p-8 md:p-12">
          <div className="flex justify-between items-center mb-4">
            <div className="md:hidden mb-6">
              <div className="flex items-center gap-2">
                <Image 
                  src="/image.png" 
                  alt="Logo" 
                  width={200} 
                  height={1500} 
                />
              </div>
            </div>
            <div className="text-sm text-gray-500 ml-auto">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-green-600 font-medium hover:underline">
                SIGN IN
              </Link>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome to Jargon AI Dashboard</h1>
            <p className="text-gray-500 mt-1">Register your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="focus001@gmail.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="8+ characters"
                  minLength="8"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 bg-gray"
                  aria-label="Toggle password visibility"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition duration-200"
            >
              Login
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center">
              <div className="flex-1 h-px bg-gray-300"></div>
              <p className="mx-4 text-sm text-gray-500">Create account with</p>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            <div className="flex gap-4 mt-4 justify-center">
              <button
                type="button"
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Sign up with Facebook"
              >
                <FaFacebook className="w-6 h-6 text-blue-600" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Sign up with LinkedIn"
              >
                <FaLinkedin className="w-6 h-6 text-blue-700" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Sign up with Google"
              >
                <FcGoogle className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
