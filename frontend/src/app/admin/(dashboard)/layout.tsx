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
  UserCheck,
  X
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: string; permissions?: Record<string, boolean> } | null>(null);
  const [isClockedOut, setIsClockedOut] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

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
        document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
      document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
          setIsClockedOut(!!data?.clockOut);
        })
        .catch((err) => {
          console.error("Failed to check daily absence", err);
          setIsClockedIn(false);
          setIsClockedOut(false);
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

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Ding (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Dong (E5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.error("Failed to play chime:", e);
    }
  };

  useEffect(() => {
    if (!authorized) return;

    const saved = localStorage.getItem("admin_notifications");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {}
    }

    const eventSource = new EventSource("/api/notifications/sse");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: eventName, payload, timestamp } = data;

        let shouldNotify = false;
        let title = "";
        let message = "";
        let redirectUrl = "";

        if (eventName === "BOOKING_CREATED") {
          shouldNotify = true;
          title = "New Booking Appointment!";
          message = `${payload.patientName} booked ${payload.serviceName} at ${payload.time} (${payload.date})`;
          redirectUrl = "/admin/bookings";
        } else if (eventName === "CLOCK_IN_REMINDER") {
          if (isClockedIn === false) {
            shouldNotify = true;
            title = "Clock In Reminder";
            message = payload.message || "Please clock in to start your shift!";
            redirectUrl = "/admin/absence";
          }
        } else if (eventName === "CLOCK_OUT_REMINDER") {
          if (isClockedIn === true && !isClockedOut) {
            shouldNotify = true;
            title = "Clock Out Reminder";
            message = payload.message || "Don't forget to clock out before you leave!";
            redirectUrl = "/admin/absence";
          }
        }

        if (shouldNotify) {
          playNotificationSound();

          const newNotif = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: eventName,
            title,
            message,
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            redirectUrl,
          };

          setNotifications((prev) => {
            const updated = [newNotif, ...prev].slice(0, 50);
            localStorage.setItem("admin_notifications", JSON.stringify(updated));
            return updated;
          });

          setToasts((prev) => [...prev, newNotif]);
        }
      } catch (err) {
        console.error("Error parsing SSE notification:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [authorized, isClockedIn, isClockedOut]);

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem("admin_notifications");
  };

  const handleNotificationClick = (notif: any) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
      localStorage.setItem("admin_notifications", JSON.stringify(updated));
      return updated;
    });

    setIsNotificationMenuOpen(false);
    
    if (notif.redirectUrl) {
      router.push(notif.redirectUrl);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navigation = [
    { icon: <UserCheck className="size-5" />, href: "/admin/absence", label: "Absence" },
    { icon: <LayoutDashboard className="size-5" />, href: "/admin", label: "Dashboard" },
    { icon: <Calendar className="size-5" />, href: "/admin/bookings", label: "Bookings" },
    { icon: <Receipt className="size-5" />, href: "/admin/transactions", label: "Transactions" },
    { icon: <Database className="size-5" />, href: "/admin/master-data", label: "Master Data" },
    { icon: <Clock className="size-5" />, href: "/admin/schedules", label: "Schedules" },
    { icon: <Settings className="size-5" />, href: "/admin/settings", label: "Settings" },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (item.href === "/admin/absence") return true;

    const permissions = currentUser?.permissions;
    if (!permissions) return false;

    if (item.href === "/admin") return !!permissions.page_dashboard;
    if (item.href === "/admin/bookings") return !!permissions.page_bookings;
    if (item.href === "/admin/transactions") return !!permissions.page_transactions;
    if (item.href === "/admin/schedules") return !!permissions.page_schedules;
    if (item.href === "/admin/settings") return !!permissions.page_settings;
    
    if (item.href === "/admin/master-data") {
      return !!(permissions.page_employees || permissions.page_doctors || permissions.page_roles);
    }
    
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_token_timestamp");
    localStorage.removeItem("admin_user");
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
            {filteredNavigation.map((item) => {
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
                              {currentUser?.permissions?.page_employees && (
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
                              )}
                              {currentUser?.permissions?.page_doctors && (
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
                              )}
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
                              {currentUser?.permissions?.page_roles && (
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
                              )}
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
                            {currentUser?.permissions?.page_employees && (
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
                            )}
                            {currentUser?.permissions?.page_doctors && (
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
                            )}
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
                            {currentUser?.permissions?.page_roles && (
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
                            )}
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
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
                className="relative size-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all cursor-pointer animate-in fade-in duration-205"
              >
                <Bell className="size-5" />
                {/* Notification Badge Dot */}
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 size-2 bg-orange-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {isNotificationMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-45 bg-transparent"
                    onClick={() => setIsNotificationMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl py-3 px-4 w-80 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between min-w-0">
                      <span className="font-bold text-xs text-gray-800 leading-normal">
                        Notifications ({unreadCount} new)
                      </span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={clearNotifications}
                          className="text-[10px] text-[#008080] hover:underline font-semibold cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="h-px bg-gray-100 -mx-4" />

                    <div className="max-h-60 overflow-y-auto flex flex-col gap-2 -mx-2 px-2">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400 font-medium">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-start text-left ${
                              notif.read 
                                ? 'bg-white border-gray-50 hover:bg-gray-50/50' 
                                : 'bg-[#008080]/5 border-[#008080]/10 hover:bg-[#008080]/10'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              notif.type === 'BOOKING_CREATED' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {notif.type === 'BOOKING_CREATED' ? <Calendar className="size-3.5" /> : <Clock className="size-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[11px] text-gray-800 leading-tight">
                                {notif.title}
                              </p>
                              <p className="text-[10px] text-gray-500 font-medium leading-snug mt-0.5 whitespace-normal break-words">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="size-10 rounded-full bg-gradient-to-tr from-teal-400 to-[#008080] p-0.5 shadow-sm border border-white cursor-pointer hover:scale-105 transition-all shrink-0 flex items-center justify-center"
              >
                <div className="size-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-[#008080]">
                  {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "AD"}
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl py-3 px-4 w-56 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-gray-800 leading-normal truncate">
                        {currentUser?.name || "Admin User"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">
                        {currentUser?.email || "admin@fwdental.com"}
                      </span>
                    </div>

                    <div className="h-px bg-gray-100 -mx-4" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 w-full py-2 px-3 rounded-xl font-bold text-xs text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="size-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-hidden bg-[#f8f9fd] p-6 flex flex-col">
          {children}
        </main>
      </div>

      {/* Floating Toast Alerts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-gray-150 p-4 flex gap-3.5 items-start animate-in slide-in-from-bottom-5 fade-in duration-300"
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              toast.type === 'BOOKING_CREATED' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {toast.type === 'BOOKING_CREATED' ? <Calendar className="size-5" /> : <Clock className="size-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-gray-800 leading-none text-left">
                {toast.title}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold leading-normal mt-1 text-left">
                {toast.message}
              </p>
              <div className="flex gap-2.5 mt-2 justify-start">
                <button
                  onClick={() => {
                    handleNotificationClick(toast);
                    setToasts(prev => prev.filter(t => t.id !== toast.id));
                  }}
                  className="px-2.5 py-1 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  View
                </button>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0 mt-0.5"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
