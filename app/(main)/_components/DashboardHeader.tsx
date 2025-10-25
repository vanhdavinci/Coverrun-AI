"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/app/provider";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";

interface DropdownItem {
  name: string;
  href: string;
}

interface NavigationItem {
  name: string;
  href: string;
  hasDropdown: boolean;
  dropdownItems?: DropdownItem[];
}

const DashboardHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUser();

  const navigationItems: NavigationItem[] = [
    {
      name: "Home",
      href: "/home",
      hasDropdown: false
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      hasDropdown: false
    },
    {
      name: "Jars",
      href: "/jars",
      hasDropdown: false
    },
    {
      name: "Transactions",
      href: "/transactions",
      hasDropdown: false
    },
    {
      name: "Analytics",
      href: "/analytics",
      hasDropdown: false
    }
  ];

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDropdownEnter = (index: number): void => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setActiveDropdown(index);
  };

  const handleDropdownLeave = (): void => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 500); // 500ms delay
    setDropdownTimeout(timeout);
  };

  const toggleDropdown = (index: number): void => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleUserDropdownEnter = (): void => {
    if (userDropdownTimeout) {
      clearTimeout(userDropdownTimeout);
      setUserDropdownTimeout(null);
    }
    setIsUserDropdownOpen(true);
    
    // Tự động tắt sau 3 giây
    const timeout = setTimeout(() => {
      setIsUserDropdownOpen(false);
    }, 3000); // 3 giây
    setUserDropdownTimeout(timeout);
  };

  const handleUserDropdownLeave = (): void => {
    const timeout = setTimeout(() => {
      setIsUserDropdownOpen(false);
    }, 500); // 500ms delay khi rời chuột
    setUserDropdownTimeout(timeout);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Error logging out: " + (error as Error).message);
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    <Link href="/home" className="flex items-center">
                      <Image 
                        src="/Coverrunlogo.jpg" 
                        alt="CoverRun AI Logo" 
                        width={400} 
                        height={40} 
                        className="h-12 w-auto"
                      />
                    </Link>
                  </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item, index) => (
                <div 
                  key={index} 
                  className="relative group"
                  onMouseEnter={() => item.hasDropdown && handleDropdownEnter(index)}
                  onMouseLeave={() => item.hasDropdown && handleDropdownLeave()}
                >
                  {item.hasDropdown ? (
                    <button
                      className="flex items-center space-x-1 text-gray-700 hover:text-purple-900 py-2 transition-all duration-400 ease-in-out font-medium relative group cursor-pointer"
                    >
                      <span className="transition-colors duration-200 relative">
                        {item.name}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 ease-in-out group-hover:w-full"></span>
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === index ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-1 py-2 px-3 rounded-md transition-all duration-200 ease-in-out font-medium relative group ${
                        isActive(item.href)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="transition-colors duration-200 relative">
                        {item.name}
                        <span className={`absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ease-in-out ${
                          isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}></span>
                      </span>
                    </Link>
                  )}
                  
                  {item.hasDropdown && activeDropdown === index && item.dropdownItems && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-80 bg-transparent z-50"
                      onMouseEnter={() => handleDropdownEnter(index)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <div className="w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-3 ml-0 animate-in fade-in slide-in-from-top-2 duration-200">
                      {item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                        <Link
                          key={dropdownIndex}
                          href={dropdownItem.href}
                          className={`block px-5 py-4 text-sm transition-all duration-150 ease-in-out ${
                            isActive(dropdownItem.href)
                              ? "bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600"
                              : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1"
                          }`}
                        >
                          <span className="transition-all duration-150">{dropdownItem.name}</span>
                        </Link>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div 
                  className="relative group"
                  onMouseEnter={handleUserDropdownEnter}
                  onMouseLeave={handleUserDropdownLeave}
                >
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2 transition-all duration-400 ease-in-out font-medium cursor-pointer">
                    <User className="w-5 h-5" />
                    <span className="transition-colors duration-200">
                      {user.full_name || user.email}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-600 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isUserDropdownOpen && (
                    <div 
                      className="absolute top-full right-0 mt-1 w-80 bg-transparent z-50"
                      onMouseEnter={handleUserDropdownEnter}
                      onMouseLeave={handleUserDropdownLeave}
                    >
                      <div className="w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-4 ml-auto animate-in fade-in slide-in-from-top-2 duration-600">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-6 py-4 text-sm text-red-600 hover:bg-red-50 transition-all duration-150 ease-in-out cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/signin">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-700 hover:text-blue-600 cursor-pointer"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-in slide-in-from-top duration-200">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item, index) => (
              <div key={index}>
                {item.hasDropdown ? (
                  <button
                    className="flex items-center justify-between w-full text-left py-2 px-3 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-150 font-medium cursor-pointer"
                    onClick={() => toggleDropdown(index)}
                  >
                    <span className="transition-colors duration-150">{item.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === index ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center w-full text-left py-2 px-3 rounded-md transition-all duration-150 font-medium ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="transition-colors duration-150">{item.name}</span>
                  </Link>
                )}
                
                {item.hasDropdown && activeDropdown === index && item.dropdownItems && (
                  <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                      <Link
                        key={dropdownIndex}
                        href={dropdownItem.href}
                        className={`block py-2 px-3 text-sm rounded-md transition-all duration-150 ${
                          isActive(dropdownItem.href)
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="transition-colors duration-150">{dropdownItem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-900">{user.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-all duration-150 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link href="/auth/signin">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
