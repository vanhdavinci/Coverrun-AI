"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface FooterLink {
  name: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const Footer: React.FC = () => {
  const footerSections: FooterSection[] = [
    {
      title: "Platform",
      links: [
        { name: "Platform Overview", href: "/our-platforms" },
        { name: "CoverGo for Health", href: "/our-platforms/covergo-for-health" },
        { name: "CoverGo for Life", href: "/our-platforms/covergo-for-life" },
        { name: "CoverGo for P&C", href: "/our-platforms/covergo-for-p-and-c" }
      ]
    },
    {
      title: "Use Cases",
      links: [
        { name: "Build Products", href: "/use-cases/build-products" },
        { name: "Distribute Products", href: "/use-cases/distribute-products" },
        { name: "Manage Policies", href: "/use-cases/manage-policies" },
        { name: "Manage Claims", href: "/use-cases/manage-claims" }
      ]
    },
    {
      title: "Who We Help",
      links: [
        { name: "Our Clients", href: "/who-we-help/our-clients" },
        { name: "Insurers", href: "/who-we-help/insurers" },
        { name: "MGAs", href: "/who-we-help/mgas" },
        { name: "Insurtechs", href: "/who-we-help/insurtechs" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about-us" },
        { name: "Careers", href: "/about-us/join-us" },
        { name: "News", href: "/news" },
        { name: "Contact", href: "/about-us/contact-us" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Case Studies", href: "/case-studies" },
        { name: "Documentation", href: "/docs" },
        { name: "Support", href: "/support" }
      ]
    }
  ];

  const socialLinks = [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/covergo",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8 7a1 1 0 011-1h6a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM12 9v6M9 12h6" />
        </svg>
      )
    },
    {
      name: "Twitter",
      href: "https://twitter.com/covergo",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      )
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/covergo",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Logo & Description */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <Link href="/" className="inline-block mb-6">
                <div className="h-8 w-32">
                  <svg width="150" height="27" viewBox="0 0 150 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_footer)">
                      <path d="M19.7853 1.81777C19.2174 0.860329 18.3891 0 17.2763 0H17.2066C16.0926 0 15.2654 0.860329 14.6976 1.81777L0 26.5845H10.2531L17.2409 14.701L24.2297 26.5845H34.4817L19.7853 1.81777Z" fill="white"></path>
                    </g>
                  </svg>
                </div>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                The next-gen insurance platform for modern insurers.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Sections */}
            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} CoverGo. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6">
              <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookie-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
