"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Settings,
  Search,
  Bell,
  Grid,
  LogOut,
  Stethoscope,
  Database,
  Shield,
  ChevronRight,
  Sparkles,
  Receipt,
  UserCheck
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  disabled?: boolean;
}

function SidebarItem({ icon, href, label, isActive, isExpanded, disabled }: SidebarItemProps) {
  return (
    <Link 
      href={disabled ? "#" : href} 
      className={`relative flex items-center w-full py-2.5 transition-all ${
        isExpanded ? "px-4 justify-start gap-3 rounded-xl hover:bg-gray-50/50" : "justify-center group"
      } ${disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}`}
    >
      {/* Active Indicator Bar on Left (only when collapsed) */}
      {isActive && !isExpanded && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#008080] rounded-r-full" />
      )}
      
      {/* Icon Button */}
      <div
        className={`size-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
          isActive
            ? "bg-[#008080]/10 text-[#008080]"
            : "text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-650"
        }`}
        title={isExpanded ? undefined : label}
      >
        {icon}
      </div>

      {/* Label Text */}
      {isExpanded && (
        <span className={`font-bold text-xs select-none animate-in fade-in slide-in-from-left-2 duration-150 ${
          isActive ? "text-[#008080]" : "text-gray-500"
        }`}>
          {label}
        </span>
      )}
    </Link>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const lastCheck = localStorage.getItem("admin_token_timestamp");
    const userStr = localStorage.getItem("admin_user");
    const now = Date.now();

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));

      const isExpired = payload.exp && now >= payload.exp * 1000;
      const is24HoursPassed = lastCheck && now - parseInt(lastCheck) > 24 * 60 * 60 * 1000;

      if (isExpired || is24HoursPassed) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_token_timestamp");
        localStorage.removeItem("admin_user");
        router.push("/admin/login");
        return;
      }

      localStorage.setItem("admin_token_timestamp", now.toString());
      setUserId(payload.sub);

      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (err) {
          // ignore
        }
      } else {
        setCurrentUser({ name: payload.name || "Admin User", email: payload.email || "admin@fwdental.com" });
      }

      setAuthorized(true);
    } catch (e) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_timestamp");
      localStorage.removeItem("admin_user");
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const checkAbsence = () => {
      fetch(`http://localhost:3001/absences/today/${userId}`)
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          setIsClockedIn(!!data);
        })
        .catch((err) => {
          console.error("Failed to check daily absence", err);
          setIsClockedIn(false);
        });
    };

    checkAbsence();

    window.addEventListener('clock-in-success', checkAbsence);
    return () => window.removeEventListener('clock-in-success', checkAbsence);
  }, [userId, pathname]);

  useEffect(() => {
    if (isClockedIn === false && pathname !== "/admin/absence") {
      router.push("/admin/absence");
    }
  }, [isClockedIn, pathname, router]);

  const navigation = [
    { icon: <UserCheck className="size-5" />, href: "/admin/absence", label: "Absence" },
    { icon: <LayoutDashboard className="size-5" />, href: "/admin", label: "Dashboard" },
    { icon: <Calendar className="size-5" />, href: "/admin/bookings", label: "Bookings" },
    { icon: <Receipt className="size-5" />, href: "/admin/transactions", label: "Transactions" },
    { icon: <Database className="size-5" />, href: "/admin/master-data", label: "Master Data" },
    { icon: <Clock className="size-5" />, href: "/admin/schedules", label: "Schedules" },
    { icon: <Settings className="size-5" />, href: "/admin/settings", label: "Settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_token_timestamp");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  if (!authorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8f9fd]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#f8f9fd] font-sans text-gray-800 antialiased overflow-hidden">
      {/* Sidebar - Desktop (Collapsible width transition) */}
      <aside className={`shrink-0 bg-white border-r border-gray-100 flex flex-col justify-between py-6 select-none transition-all duration-300 ${
        isExpanded ? "w-60" : "w-[76px]"
      }`}>
        <div className="w-full flex flex-col gap-8">
          {/* Logo container toggles isExpanded */}
          <div className={`flex items-center w-full ${isExpanded ? "px-5 justify-start gap-3" : "justify-center"}`}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="size-10 bg-[#008080] rounded-xl flex items-center justify-center text-white shadow-md shadow-teal-100 hover:scale-105 transition-all shrink-0 cursor-pointer"
            >
              <Stethoscope className="size-5" />
            </button>
            {isExpanded && (
              <span className="font-extrabold text-sm text-gray-800 tracking-tight animate-in fade-in slide-in-from-left-2 duration-200 whitespace-nowrap">
                FW Dental
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className={`w-full flex flex-col gap-2 ${isExpanded ? "px-3" : "items-center"}`}>
            {navigation.map((item) => {
              const isAbsence = item.href === "/admin/absence";
              const disabled = isClockedIn === false && !isAbsence;

              if (item.label === "Master Data") {
                const isActive = pathname.startsWith("/admin/master-data");
                return (
                  <div key={item.label} className="relative w-full">
                    {!isExpanded ? (
                      // Collapsed Mode: Hover Popover
                      <>
                        <button
                          onClick={() => !disabled && setIsMasterDataOpen(!isMasterDataOpen)}
                          className={`relative flex items-center justify-center w-full py-3 group cursor-pointer ${
                            disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#008080] rounded-r-full" />
                          )}
                          <div
                            className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                              isActive
                                ? "bg-[#008080]/10 text-[#008080]"
                                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }`}
                            title={item.label}
                          >
                            {item.icon}
                          </div>
                        </button>

                        {/* Floating Dropdown Card */}
                        {isMasterDataOpen && !disabled && (
                          <>
                            <div 
                              className="fixed inset-0 z-40 bg-transparent" 
                              onClick={() => setIsMasterDataOpen(false)}
                            />
                            <div className="absolute left-[72px] top-0 bg-white border border-gray-150 rounded-2xl shadow-xl py-3 px-2 w-48 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
                              <div className="px-3 py-1.5 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider select-none border-b border-gray-50 mb-1">
                                Master Data Menu
                              </div>
                              <Link 
                                href="/admin/master-data/employees"
                                onClick={() => setIsMasterDataOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                                  pathname === "/admin/master-data/employees"
                                    ? "bg-[#008080]/10 text-[#008080]"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                }`}
                              >
                                <Users className="size-4" />
                                Employees
                              </Link>
                              <Link 
                                href="/admin/master-data/doctors"
                                onClick={() => setIsMasterDataOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                                  pathname === "/admin/master-data/doctors"
                                    ? "bg-[#008080]/10 text-[#008080]"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                }`}
                              >
                                <Stethoscope className="size-4" />
                                Doctors
                              </Link>
                              <Link 
                                href="/admin/master-data/services"
                                onClick={() => setIsMasterDataOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                                  pathname === "/admin/master-data/services"
                                    ? "bg-[#008080]/10 text-[#008080]"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                }`}
                              >
                                <Sparkles className="size-4" />
                                Services
                              </Link>
                              <Link 
                                href="/admin/master-data/roles"
                                onClick={() => setIsMasterDataOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                                  pathname === "/admin/master-data/roles"
                                    ? "bg-[#008080]/10 text-[#008080]"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                }`}
                              >
                                <Shield className="size-4" />
                                Roles
                              </Link>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      // Expanded Mode: Inline Accordion Dropdown
                      <div className="w-full flex flex-col select-none">
                        <button
                          onClick={() => !disabled && setIsMasterDataOpen(!isMasterDataOpen)}
                          className={`relative flex items-center justify-between w-full py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
                            disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
                          } ${isActive ? "bg-gray-50/50" : "hover:bg-gray-50/50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                isActive ? "bg-[#008080]/10 text-[#008080]" : "text-gray-400"
                              }`}
                            >
                              {item.icon}
                            </div>
                            <span className={`font-bold text-xs ${isActive ? "text-[#008080]" : "text-gray-500"}`}>
                              {item.label}
                            </span>
                          </div>
                          <ChevronRight 
                            className={`size-3.5 text-gray-400 transition-transform duration-200 ${
                              isMasterDataOpen && !disabled ? "rotate-90" : ""
                            }`} 
                          />
                        </button>

                        {/* Inline Accordion Links */}
                        {isMasterDataOpen && !disabled && (
                          <div className="flex flex-col pl-10 pr-2 py-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Link 
                              href="/admin/master-data/employees"
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-[11px] transition-colors ${
                                pathname === "/admin/master-data/employees"
                                  ? "bg-[#008080]/10 text-[#008080]"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              }`}
                            >
                              <Users className="size-3.5" />
                              Employees
                            </Link>
                            <Link 
                              href="/admin/master-data/doctors"
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-[11px] transition-colors ${
                                pathname === "/admin/master-data/doctors"
                                  ? "bg-[#008080]/10 text-[#008080]"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              }`}
                            >
                              <Stethoscope className="size-3.5" />
                              Doctors
                            </Link>
                            <Link 
                              href="/admin/master-data/services"
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-[11px] transition-colors ${
                                pathname === "/admin/master-data/services"
                                  ? "bg-[#008080]/10 text-[#008080]"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              }`}
                            >
                              <Sparkles className="size-3.5" />
                              Services
                            </Link>
                            <Link 
                              href="/admin/master-data/roles"
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-[11px] transition-colors ${
                                pathname === "/admin/master-data/roles"
                                  ? "bg-[#008080]/10 text-[#008080]"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              }`}
                            >
                              <Shield className="size-3.5" />
                              Roles
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Active check: exact match for "/admin", otherwise startswith
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <SidebarItem
                  key={item.href}
                  icon={item.icon}
                  href={item.href}
                  label={item.label}
                  isActive={isActive}
                  isExpanded={isExpanded}
                  disabled={disabled}
                />
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className={`w-full flex flex-col gap-4 ${isExpanded ? "px-5" : "items-center"}`}>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`size-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer ${
              isExpanded ? "self-start ml-2" : ""
            }`}
            title="Log Out"
          >
            <LogOut className="size-5" />
          </button>

          {/* Profile Avatar Card */}
          <div className={`flex items-center w-full ${isExpanded ? "justify-start gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100" : "justify-center"}`}>
            <div className="size-10 rounded-full bg-gradient-to-tr from-teal-400 to-[#008080] p-0.5 shadow-sm border border-white cursor-pointer hover:scale-105 transition-all shrink-0">
              <div className="size-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-[#008080]">
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "AD"}
              </div>
            </div>
            {isExpanded && (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
                <span className="font-bold text-xs text-gray-800 leading-none truncate max-w-[120px]">
                  {currentUser?.name || "Admin User"}
                </span>
                <span className="text-[9px] text-gray-400 font-semibold mt-1 truncate max-w-[120px]">
                  {currentUser?.email || "admin@fwdental.com"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 select-none">
          {/* Search bar */}
          <div className="w-80 relative flex items-center">
            <Search className="absolute left-3 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-10 pl-10 pr-16 bg-[#f5f6fa] border border-transparent rounded-xl text-sm focus:bg-white focus:border-gray-200 outline-none transition-all placeholder:text-gray-400"
            />
            <div className="absolute right-3 flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] text-gray-400 font-semibold shadow-2xs">
              <span>Ctrl</span>
              <span>+</span>
              <span>K</span>
            </div>
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center gap-5">
            {/* Country Flag Flag (US) */}
            <div className="size-8 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 cursor-pointer text-base hover:bg-gray-100 transition-all" title="Language">
              🇺🇸
            </div>

            {/* Notification Bell */}
            <button className="relative size-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
              <Bell className="size-5" />
              {/* Notification Badge Dot */}
              <span className="absolute top-2.5 right-2.5 size-2 bg-orange-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Grid Menu Icon */}
            <button className="size-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
              <Grid className="size-5" />
            </button>

            {/* Settings Gear Icon */}
            <Link
              href={isClockedIn === false ? "#" : "/admin/settings"}
              className={`size-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all ${
                isClockedIn === false ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
              }`}
            >
              <Settings className="size-5" />
            </Link>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-hidden bg-[#f8f9fd] p-6 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
