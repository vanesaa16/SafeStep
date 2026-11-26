/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AdaptiveMapBackgroundProps {
  mapId: string;
}

/**
 * Adaptive Background System for Widescreen Laptop & Desktop displays.
 * Seamlessly extends the environment (lawn, walls, floor, street, sky)
 * to fill 100% of the desktop viewport without letterbox borders or distortion.
 */
export default function AdaptiveMapBackground({ mapId }: AdaptiveMapBackgroundProps) {
  if (mapId === "school") {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden bg-[#68B43E]">
        <svg
          className="w-full h-full block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="adaptRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E3533D" />
              <stop offset="60%" stopColor="#C53B28" />
              <stop offset="100%" stopColor="#932416" />
            </linearGradient>
            <linearGradient id="adaptCorridorWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDF9EE" />
              <stop offset="100%" stopColor="#F3EBD6" />
            </linearGradient>
            <linearGradient id="adaptGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#75BE41" />
              <stop offset="50%" stopColor="#68B43E" />
              <stop offset="100%" stopColor="#569E30" />
            </linearGradient>
          </defs>

          {/* Full-width Grass Field */}
          <rect x="0" y="0" width="100" height="100" fill="url(#adaptGrass)" />

          {/* Top School Building Wing Extension (Roof, Corridor & Steps) */}
          <rect x="0" y="0" width="100" height="13" fill="url(#adaptRoof)" />
          <line x1="0" y1="13" x2="100" y2="13" stroke="#7F1D1D" strokeWidth="0.8" />
          <rect x="0" y="13" width="100" height="7.5" fill="url(#adaptCorridorWall)" />
          <line x1="0" y1="20.5" x2="100" y2="20.5" stroke="#CBD5E1" strokeWidth="0.5" />
          <rect x="0" y="20.5" width="100" height="2.5" fill="#64748B" />

          {/* Bottom School Fence & Hedge Extension */}
          <rect x="0" y="91.5" width="100" height="1.5" fill="#CBD5E1" />
          <rect x="0" y="93" width="100" height="4.5" fill="#2D5A18" />
          <line x1="0" y1="97.5" x2="100" y2="97.5" stroke="#334155" strokeWidth="0.8" />
          <line x1="0" y1="99" x2="100" y2="99" stroke="#334155" strokeWidth="0.8" />
        </svg>
      </div>
    );
  }

  if (mapId === "class") {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden bg-[#FAFAF9]">
        <svg
          className="w-full h-full block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="adaptClassCream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDFBF4" />
              <stop offset="100%" stopColor="#F2E9D8" />
            </linearGradient>
            <linearGradient id="adaptClassGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8FD1AE" />
              <stop offset="100%" stopColor="#6BAE8B" />
            </linearGradient>
            <linearGradient id="adaptClassFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F7F4EC" />
              <stop offset="60%" stopColor="#EAE3D5" />
              <stop offset="100%" stopColor="#DDD4C3" />
            </linearGradient>
          </defs>

          {/* Ceiling */}
          <rect x="0" y="0" width="100" height="3.4" fill="#EAE3D2" />
          <line x1="0" y1="3.4" x2="100" y2="3.4" stroke="#CBBFA8" strokeWidth="0.5" />

          {/* Upper Cream Wall */}
          <rect x="0" y="3.4" width="100" height="19.4" fill="url(#adaptClassCream)" />

          {/* Teak Wood Chair-Rail Molding */}
          <rect x="0" y="22.6" width="100" height="1.0" fill="#A46B39" />
          <line x1="0" y1="23.6" x2="100" y2="23.6" stroke="rgba(0,0,0,0.18)" strokeWidth="0.3" />

          {/* Lower Mint-Sage Wainscoting */}
          <rect x="0" y="23.6" width="100" height="9.8" fill="url(#adaptClassGreen)" />

          {/* Ceramic Baseboard (Plint Keramik) */}
          <rect x="0" y="33.4" width="100" height="1.0" fill="#6D4C3D" />

          {/* Ceramic Tile Floor */}
          <rect x="0" y="34.4" width="100" height="65.6" fill="url(#adaptClassFloor)" />

          {/* Horizontal Ceramic Grout Lines */}
          {[39, 44.5, 51, 58.5, 67, 77, 88].map((y, idx) => (
            <line
              key={idx}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#D6CFC0"
              strokeWidth={idx > 3 ? "0.35" : "0.25"}
              opacity="0.75"
            />
          ))}
        </svg>
      </div>
    );
  }

  if (mapId === "street") {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden bg-[#333842]">
        <svg
          className="w-full h-full block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="adaptSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60B6F7" />
              <stop offset="60%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
            <linearGradient id="adaptWalkway" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="adaptAsphalt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3F444E" />
              <stop offset="50%" stopColor="#333842" />
              <stop offset="100%" stopColor="#282C34" />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width="100" height="26.3" fill="url(#adaptSky)" />

          {/* Upper Sidewalk */}
          <rect x="0" y="26.3" width="100" height="12.7" fill="url(#adaptWalkway)" />
          <line x1="0" y1="39" x2="100" y2="39" stroke="#94A3B8" strokeWidth="0.6" />

          {/* Asphalt Road */}
          <rect x="0" y="39" width="100" height="26.7" fill="url(#adaptAsphalt)" />
          <line
            x1="0"
            y1="52.3"
            x2="100"
            y2="52.3"
            stroke="#F59E0B"
            strokeWidth="0.8"
            strokeDasharray="4 2.5"
          />

          {/* Lower Sidewalk */}
          <rect x="0" y="65.7" width="100" height="17.0" fill="url(#adaptWalkway)" />
          <line x1="0" y1="82.7" x2="100" y2="82.7" stroke="#94A3B8" strokeWidth="0.6" />

          {/* Bottom Grass Berm */}
          <rect x="0" y="82.7" width="100" height="17.3" fill="#477333" />
        </svg>
      </div>
    );
  }

  // Home Map (Living Room & Study)
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden bg-[#F8F6F1]">
      <svg
        className="w-full h-full block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="adaptHomeWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAF8F5" />
            <stop offset="100%" stopColor="#EFECE6" />
          </linearGradient>
          <linearGradient id="adaptHomeFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8F6F1" />
            <stop offset="50%" stopColor="#F3EFE7" />
            <stop offset="100%" stopColor="#EAE4D8" />
          </linearGradient>
        </defs>

        {/* Living Room Warm Wall */}
        <rect x="0" y="0" width="100" height="36.3" fill="url(#adaptHomeWall)" />
        <rect x="0" y="35.5" width="100" height="0.8" fill="#A86E3B" />
        <rect x="0" y="36.3" width="100" height="1.0" fill="#78350F" />

        {/* Porcelain Tile Floor */}
        <rect x="0" y="37.3" width="100" height="62.7" fill="url(#adaptHomeFloor)" />

        {/* Horizontal Porcelain Grout Lines */}
        {[42, 48, 55, 63, 73, 85].map((y, idx) => (
          <line
            key={idx}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#DCD5C9"
            strokeWidth="0.3"
            opacity="0.8"
          />
        ))}
      </svg>
    </div>
  );
}
