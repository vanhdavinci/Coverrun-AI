"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";

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

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const navigationItems: NavigationItem[] = [
    {
      name: "Why CoverGo",
      href: "/why-covergo",
      hasDropdown: false
    },
    {
      name: "CoverRun",
      href: "#",
      hasDropdown: true,
      dropdownItems: [
        { name: "Overview", href: "/overview" },
        { name: "Jars", href: "/jars" },
        { name: "Transactions", href: "/transactions" },
        { name: "Analytics", href: "/analytics" }
      ]
    },
    {
      name: "Use cases",
      href: "#",
      hasDropdown: true,
      dropdownItems: [
        { name: "Build Products", href: "/use-cases/build-products" },
        { name: "Distribute Products", href: "/use-cases/distribute-products" },
        { name: "Manage Policies", href: "/use-cases/manage-policies" },
        { name: "Manage Claims", href: "/use-cases/manage-claims" }
      ]
    },
    {
      name: "Who we help",
      href: "#",
      hasDropdown: true,
      dropdownItems: [
        { name: "Our Clients", href: "/who-we-help/our-clients" },
        { name: "Insurers", href: "/who-we-help/insurers" },
        { name: "MGAs", href: "/who-we-help/mgas" },
        { name: "Insurtechs", href: "/who-we-help/insurtechs" }
      ]
    },
    {
      name: "Resources",
      href: "#",
      hasDropdown: true,
      dropdownItems: [
        { name: "Blog", href: "/blog" },
        { name: "Case Studies", href: "/case-studies" }
      ]
    },
    {
      name: "Company",
      href: "#",
      hasDropdown: true,
      dropdownItems: [
        { name: "About", href: "/about-us" },
        { name: "Careers", href: "/about-us/join-us" },
        { name: "News", href: "/news" }
      ]
    }
  ];

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = (index: number): void => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div className="h-8 w-32">
                  <svg width="150" height="27" viewBox="0 0 150 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_42_1511)">
                      <path d="M19.7853 1.81777C19.2174 0.860329 18.3891 0 17.2763 0H17.2066C16.0926 0 15.2654 0.860329 14.6976 1.81777L0 26.5845H10.2531L17.2409 14.701L24.2297 26.5845H34.4817L19.7853 1.81777Z" fill="#001F5E"></path>
                      <path d="M54.4553 16.3142C54.1263 16.7633 53.7378 17.1517 53.2888 17.5105C52.481 18.1092 51.375 18.7067 49.9686 18.7067C47.2768 18.7067 44.8832 16.3142 44.8832 13.1734C44.8832 10.0326 47.2756 7.64012 49.9686 7.64012C51.3739 7.64012 52.481 8.23767 53.1985 8.83635C53.6178 9.19511 53.9766 9.58472 54.3057 10.0326L55.8012 8.53701C55.3522 8.02858 54.8438 7.54986 54.2759 7.13169C53.2888 6.41418 51.8526 5.69553 49.9686 5.69553C46.0497 5.69553 42.79 8.98603 42.79 13.1734C42.79 17.3608 46.0508 20.6513 49.9686 20.6513C51.8526 20.6513 53.3185 19.903 54.3651 19.1557C54.9637 18.7067 55.5019 18.228 55.9509 17.6602L54.4553 16.3142Z" fill="#001F5E"></path>
                      <path d="M65.2208 20.6513C69.2585 20.6513 72.549 17.3608 72.549 13.1734C72.549 8.98603 69.2585 5.69553 65.2208 5.69553C61.1831 5.69553 57.8926 8.98603 57.8926 13.1734C57.8926 17.3608 61.1831 20.6513 65.2208 20.6513ZM65.2208 18.7067C62.3793 18.7067 59.9857 16.2834 59.9857 13.1734C59.9857 10.0634 62.3793 7.64012 65.2208 7.64012C68.0623 7.64012 70.4559 10.0326 70.4559 13.1734C70.4559 16.3142 68.0634 18.7067 65.2208 18.7067Z" fill="#001F5E"></path>
                      <path d="M80.1783 20.3531H82.2726L88.1052 5.99603H85.8625L81.226 17.5116L76.5896 5.99603H74.3457L80.1783 20.3531Z" fill="#001F5E"></path>
                      <path d="M101.722 16.3143C101.393 16.7633 100.975 17.1517 100.526 17.5105C99.7182 18.1092 98.6111 18.7067 97.0858 18.7067C94.3643 18.7067 92.15 16.4628 92.0004 13.9206L103.666 13.9504L103.725 13.651C103.755 13.4419 103.815 13.202 103.815 12.8729C103.815 8.68555 100.854 5.6944 96.9361 5.6944C93.0184 5.6944 89.9072 8.9849 89.9072 13.1723C89.9072 17.3597 93.168 20.6502 97.0858 20.6502C99.0304 20.6502 100.495 19.9018 101.543 19.1546C102.141 18.7056 102.65 18.2269 103.068 17.659L101.722 16.3131V16.3143ZM92.0015 12.1269C92.3305 9.7344 94.3643 7.64013 96.9373 7.64013C99.5102 7.64013 101.394 9.58473 101.723 12.1269H92.0026H92.0015Z" fill="#001F5E"></path>
                      <path d="M107.546 20.3531H109.64V12.4262C109.64 9.58472 111.735 7.78979 114.127 7.78979H115.024V5.69553H114.425C112.75 5.69553 111.613 6.26337 110.806 6.83235C110.357 7.1614 109.968 7.54986 109.639 7.93947V5.99487H107.545V20.352L107.546 20.3531Z" fill="#001F5E"></path>
                      <path d="M123.989 16.3143C122.045 16.3143 120.549 14.8484 120.549 12.7244C120.549 10.6004 122.045 9.13457 123.989 9.13457C125.934 9.13457 127.43 10.6004 127.43 12.7244C127.43 14.8484 125.934 16.3143 123.989 16.3143ZM117.11 23.6425C117.53 24.2103 118.068 24.689 118.696 25.1381C119.772 25.8864 121.358 26.6336 123.542 26.6336C128.178 26.6336 131.468 23.3431 131.468 18.8564V5.69554H127.431V7.78981H127.281C126.982 7.34079 126.623 6.95233 126.205 6.59357C125.487 5.99603 124.35 5.39734 122.794 5.39734C119.534 5.39734 116.513 8.3885 116.513 12.7256C116.513 17.0626 119.534 20.0538 122.794 20.0538C124.349 20.0538 125.486 19.4551 126.205 18.8575C126.623 18.4988 126.983 18.1092 127.281 17.6613H127.431V18.8575C127.431 21.25 125.786 22.8953 123.543 22.8953C122.346 22.8953 121.389 22.4462 120.701 21.9984C120.313 21.7287 119.953 21.4305 119.655 21.1015L117.113 23.6436L117.11 23.6425Z" fill="#001F5E"></path>
                      <path d="M142.223 16.9129C140.128 16.9129 138.483 15.2677 138.483 13.0249C138.483 10.7821 140.128 9.13686 142.223 9.13686C144.317 9.13686 145.962 10.7821 145.962 13.0249C145.962 15.2677 144.317 16.9129 142.223 16.9129ZM134.445 13.0249C134.445 17.2123 137.885 20.6525 142.223 20.6525C146.56 20.6525 150 17.2123 150 13.0249C150 8.83751 146.56 5.39734 142.223 5.39734C137.885 5.39734 134.445 8.83751 134.445 13.0249Z" fill="#001F5E"></path>
                    </g>
                    <defs>
                      <clipPath id="clip0_42_1511">
                        <rect width="150" height="26.6336" fill="white"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item, index) => (
                <div key={index} className="relative group">
                  <button
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 py-2 cursor-pointer"
                    onClick={() => item.hasDropdown && toggleDropdown(index)}
                  >
                    <span>{item.name}</span>
                    {item.hasDropdown && (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {item.hasDropdown && activeDropdown === index && item.dropdownItems && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                      {item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                        <Link
                          key={dropdownIndex}
                          href={dropdownItem.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Book a demo
              </Button>
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
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item, index) => (
              <div key={index}>
                <button
                  className="flex items-center justify-between w-full text-left py-2 text-gray-700 hover:text-blue-600 cursor-pointer"
                  onClick={() => item.hasDropdown && toggleDropdown(index)}
                >
                  <span>{item.name}</span>
                  {item.hasDropdown && (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {item.hasDropdown && activeDropdown === index && item.dropdownItems && (
                  <div className="ml-4 space-y-1">
                    {item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                      <Link
                        key={dropdownIndex}
                        href={dropdownItem.href}
                        className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                      >
                        {dropdownItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Book a demo
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
