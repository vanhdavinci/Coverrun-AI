"use client";

import React from "react";

const VideoSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                See CoverGo Claims
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Next-gen, end-to-end claims management platform to drastically reduce costs, 
                increase accuracy and speed, and elevate satisfaction.
              </p>
            </div>
          </div>

          {/* Video */}
          <div className="relative">
            <div className="relative w-full h-[315px] lg:h-[400px] rounded-lg overflow-hidden shadow-2xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/ujoPmcxkTbo?si=8NY1526xmnKs7qwL"
                title="CoverGo Claims Management Platform Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            
            {/* Video overlay elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-200 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-indigo-200 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
