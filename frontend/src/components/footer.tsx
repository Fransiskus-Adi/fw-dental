import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Top Row */}
        <div className="py-10 flex flex-col lg:flex-row justify-between gap-8">
          {/* Logo + Description */}
          <div className="max-w-md">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/fw-dental-logo.png" alt="FW Dental" className="h-6 w-auto" />
              <span className="text-lg font-bold tracking-tight text-black">
                FW Dental
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              We are dedicated to providing exceptional dental care with a focus
              on patient comfort and satisfaction. Our experienced team of
              dentists is committed to delivering personalized treatments using
              advanced technology and techniques.
            </p>
          </div>

          {/* Contact Info */}
          <div className="flex gap-12 lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.1em] uppercase text-gray-500 mb-2">
                PHONE NUMBER
              </p>
              <p className="text-sm font-medium text-black">(808) 555-0111</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.1em] uppercase text-gray-500 mb-2">
                EMAIL
              </p>
              <p className="text-sm font-medium text-black">
                info@dentalhappy.co
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Bottom Row */}
        <div className="py-10 flex flex-col lg:flex-row justify-between gap-8">
          {/* Clinic Hours */}
          <div>
            <p className="text-xs font-semibold tracking-[0.1em] uppercase text-gray-500 mb-4">
              CLINIC HOURS
            </p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <p>
                <span className="font-medium">Monday - Friday:</span> 8:00 AM -
                3:00 PM
              </p>
              <p>
                <span className="font-medium">Saturday:</span> 8:00 AM - 1:00
                PM
              </p>
              <p>
                <span className="font-medium">Sunday:</span> Closed
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              Copyright © 2023 FW Dental. All rights reserved.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-3 gap-x-12 lg:gap-x-20 gap-y-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <Link
                href="#about"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                ABOUT US
              </Link>
              <Link
                href="#services"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                OUR SERVICES
              </Link>
              <Link
                href="#clinics"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                OUR CLINICS
              </Link>
              <Link
                href="#clinics"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                DENTISTS
              </Link>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <Link
                href="#location"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                LOCATION
              </Link>
              <Link
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                CAREER
              </Link>
              <Link
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                PRIVACY POLICY
              </Link>
              <Link
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                TERMS OF SERVICE
              </Link>
            </div>

            {/* Column 3 - Social */}
            <div className="space-y-4">
              <Link
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                INSTAGRAM
              </Link>
              <Link
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                TWITTER
              </Link>
              <Link
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                THREADS
              </Link>
              <Link
                href="#"
                className="block text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                TIKTOK
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
