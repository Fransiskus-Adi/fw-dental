"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "#about" },
  { label: "Our Services", href: "#services" },
  { label: "Our Clinics", href: "#clinics" },
  { label: "Location", href: "#location" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="public-navigation fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 lg:px-10 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/fw-dental-logo.png" width={32} height={32} alt="FW Dental" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tight text-black">
            FW Dental
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Book Online Button */}
        <div className="hidden md:block">
          <Button className="rounded-full bg-teal-700 text-white hover:bg-teal-800 px-5 gap-2">
            <Calendar className="w-4 h-4" />
            Book Online
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button className="w-full rounded-full bg-teal-700 text-white hover:bg-teal-800 mt-2 gap-2">
            <Calendar className="w-4 h-4" />
            Book Online
          </Button>
        </div>
      )}
    </nav>
  );
}
