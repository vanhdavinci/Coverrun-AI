"use client";

import React from "react";
import Image from "next/image";

interface Logo {
  name: string;
  src: string;
  alt: string;
}

const LogosSection: React.FC = () => {
  const logos: Logo[] = [
    {
      name: "BUPA",
      src: "https://covergo.com/wp-content/uploads/2024/05/bupa_white.webp",
      alt: "BUPA Logo"
    },
    {
      name: "AXA",
      src: "https://covergo.com/wp-content/uploads/2024/05/axa_white.webp",
      alt: "AXA Logo"
    },
    {
      name: "MSIG",
      src: "https://covergo.com/wp-content/uploads/2024/05/msig_white.webp",
      alt: "MSIG Logo"
    },
    {
      name: "Dai-ichi Life",
      src: "https://covergo.com/wp-content/uploads/2024/05/dai_ichi_life_white.webp",
      alt: "Dai-ichi Life Logo"
    },
    {
      name: "Partner 5",
      src: "https://covergo.com/wp-content/uploads/2024/11/d2ea5557-7a62-40df-a671-cb34792b3303.png",
      alt: "Partner 5 Logo"
    },
    {
      name: "Santevet",
      src: "https://covergo.com/wp-content/uploads/2025/06/santevet-white.png",
      alt: "Santevet Logo"
    },
    {
      name: "OM",
      src: "https://covergo.com/wp-content/uploads/2025/06/OM-FULL-COLOUR-LOGO-1000-X-750px-1-save.png",
      alt: "OM Logo"
    },
    {
      name: "Humania Assurance",
      src: "https://covergo.com/wp-content/uploads/2025/06/Humania_Assurance_inc-white.png",
      alt: "Humania Assurance Logo"
    },
    {
      name: "Partner 9",
      src: "https://covergo.com/wp-content/uploads/2024/11/30d285ab-39c7-4027-98ac-8062c1cc5a4d.png",
      alt: "Partner 9 Logo"
    }
  ];

  return (
    <section className="bg-blue-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h4 className="text-xl font-semibold text-white mb-4">
            Trusted by thousands of users worldwide
          </h4>
        </div>
        
        {/* Logos Grid - 6 columns like original */}
        <div className="flex justify-center items-center">
          {logos.map((logo, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
            >
              <div className="relative w-28 h-20">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogosSection;
