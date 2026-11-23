"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const dentists = [
  {
    name: "Dr. Olivia Lim, M.Ort.",
    specialty: "Orthodontist",
    image: "/dentist-1.svg",
    index: "01",
  },
  {
    name: "Dr. Kevin Tanaka, Sp.KG.",
    specialty: "Cosmetic Dentistry",
    image: "/dentist-2.svg",
    index: "02",
  },
  {
    name: "Dr. James Chen, M.Kes.",
    specialty: "Prosthodontist",
    image: "/dentist-3.svg",
    index: "03",
  },
  {
    name: "Dr. Sarah Miller, Sp.Perio.",
    specialty: "Periodontist",
    image: "/dentist-4.svg",
    index: "04",
  },
];

export default function DentistsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () =>
    setActiveIndex((i) => (i === 0 ? dentists.length - 1 : i - 1));
  const next = () =>
    setActiveIndex((i) => (i === dentists.length - 1 ? 0 : i + 1));

  return (
    <section id="clinics" className="bg-white py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-10">
          <h2
            className="text-5xl lg:text-7xl font-medium tracking-tight"
          >
            Meet The Dentists
          </h2>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={prev}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Previous dentist"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={next}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Next dentist"
            >
              <ArrowRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Dentists Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {dentists.map((dentist, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={dentist.name}
                className="relative rounded-[24px] overflow-hidden cursor-pointer transition-all duration-500 group"
                onClick={() => setActiveIndex(index)}
                style={{
                  background: isActive
                    ? "linear-gradient(160deg, #e8d5a0 0%, #c5a55a 30%, #1a8a8a 60%, #0d7377 85%, #0a5f63 100%)"
                    : "linear-gradient(160deg, #d4cdb8 0%, #b8b0a0 30%, #8aafaf 60%, #7a9a9a 85%, #6a8a8a 100%)",
                  filter: isActive ? "none" : "grayscale(40%)",
                }}
              >
                {/* Doctor Photo Area */}
                <div className="relative h-[320px] lg:h-[400px] flex items-end justify-center pt-6">
                  <svg
                    viewBox="0 0 200 280"
                    className="w-[75%] h-[90%] drop-shadow-lg"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Head */}
                    <circle
                      cx="100"
                      cy="70"
                      r="45"
                      fill={isActive ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)"}
                    />
                    {/* Body */}
                    <path
                      d="M40 280 C40 180, 50 140, 100 130 C150 140, 160 180, 160 280 Z"
                      fill={isActive ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)"}
                    />
                    {/* Lab coat collar */}
                    <path
                      d="M75 130 L100 155 L125 130"
                      stroke={isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)"}
                      strokeWidth="3"
                      fill="none"
                    />
                    {/* Stethoscope */}
                    <path
                      d="M80 135 C70 180, 60 200, 70 220"
                      stroke={isActive ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.25)"}
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <circle
                      cx="70"
                      cy="225"
                      r="8"
                      fill={isActive ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.25)"}
                    />
                    {/* Face features */}
                    <circle cx="87" cy="65" r="3" fill="rgba(255,255,255,0.5)" />
                    <circle cx="113" cy="65" r="3" fill="rgba(255,255,255,0.5)" />
                    <path
                      d="M92 82 Q100 90 108 82"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="2"
                      fill="none"
                    />
                    {/* Hair */}
                    {index === 0 || index === 3 ? (
                      // Female hair
                      <path
                        d="M55 65 C55 25, 80 15, 100 15 C120 15, 145 25, 145 65 C145 50, 135 30, 100 30 C65 30, 55 50, 55 65 Z"
                        fill={isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)"}
                      />
                    ) : (
                      // Male hair
                      <path
                        d="M60 55 C60 25, 80 18, 100 18 C120 18, 140 25, 140 55 C140 40, 130 30, 100 30 C70 30, 60 40, 60 55 Z"
                        fill={isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)"}
                      />
                    )}
                  </svg>
                </div>

                {/* Bottom Info Bar */}
                <div
                  className="mx-3 mb-3 rounded-2xl px-4 py-3 backdrop-blur-sm transition-all duration-300"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(13, 115, 119, 0.9) 0%, rgba(26, 138, 138, 0.9) 100%)"
                      : "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Index Number */}
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: isActive
                          ? "rgba(255, 255, 255, 0.2)"
                          : "rgba(255, 255, 255, 0.1)",
                        color: "white",
                      }}
                    >
                      {dentist.index}
                    </div>
                    {/* Name and Specialty */}
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight truncate">
                        {dentist.name}
                      </p>
                      <p className="text-white/70 text-xs mt-0.5 truncate">
                        {dentist.specialty}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile navigation */}
        <div className="flex md:hidden items-center justify-center gap-6 mt-6">
          <button
            onClick={prev}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous dentist"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">
            {activeIndex + 1} / {dentists.length}
          </span>
          <button
            onClick={next}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next dentist"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
}
