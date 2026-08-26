import { ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#f7f7f5] overflow-hidden">
      {/* Background dental image */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none select-none">
        <div className="relative w-[55%] h-full">
          <img
            src="/dental-hero.png"
            alt="Dental aligner"
            className="absolute right-[-5%] top-[10%] w-full h-[80%] object-contain opacity-90"
          />
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 pt-28 pb-8 min-h-screen flex flex-col">
        {/* Main hero content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between">
            {/* Headline area */}
            <div className="max-w-4xl">
              <h1 className="font-[var(--font-playfair)] leading-[0.95] tracking-[-0.03em]">
                <span
                  className="block text-[clamp(3.5rem,8vw,8rem)] font-medium text-black"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  A Better Way
                </span>
                <span className="block text-[clamp(3.5rem,8vw,8rem)] font-medium">
                  <span
                    className="text-teal-600"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    to
                  </span>{" "}
                  <span
                    className="text-black"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    Smile
                  </span>
                </span>
              </h1>
            </div>

            {/* Clinic hours - right side */}
            <div className="hidden lg:flex flex-col items-end text-right mt-4 shrink-0">
              <p className="text-sm text-gray-500 tracking-wide">
                July 10. 2023
              </p>
              <p className="text-sm font-semibold text-black mt-2">
                \\ We&apos;re Open Clinic
              </p>
              <p className="text-sm text-gray-500">8 AM - 8 PM</p>
            </div>
          </div>

          {/* Description text */}
          <p className="max-w-sm text-gray-600 text-base leading-relaxed mt-8 lg:mt-10">
            We are committed to delivering high-quality dental care while prioritizing patient comfort and satisfaction. Our experienced dental team provides personalized treatments using modern technology and advanced techniques.
          </p>

          {/* Book Now button */}
          <div className="mt-8">
            <Button
              variant="outline"
              className="rounded-full px-8 py-6 text-base font-medium border-gray-300 hover:bg-gray-100 gap-3 group"
            >
              Book Now
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div className="flex items-center justify-between pb-6 pt-10">
          {/* Left stat */}
          <div className="flex items-center gap-4">
            <span className="text-4xl lg:text-5xl font-light text-black tracking-tight">
              13
            </span>
            <div>
              <p className="text-xs lg:text-sm text-gray-700 font-medium">
                Achieve Your Dream Smile with
              </p>
              <p className="text-xs lg:text-sm text-gray-500">
                Our Range of Services
              </p>
            </div>
          </div>

          {/* Center scroll indicator */}
          <button
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
            aria-label="Scroll down"
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>

          {/* Right stat */}
          <div className="flex items-center gap-4">
            <span className="text-4xl lg:text-5xl font-light text-black tracking-tight">
              852<span className="text-teal-600">+</span>
            </span>
            <div>
              <p className="text-xs lg:text-sm text-gray-700 font-medium">
                Transforming Healthcare with Telemedicine
              </p>
              <p className="text-xs lg:text-sm text-gray-500">
                Connect, Consult, And Care Remotely
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
