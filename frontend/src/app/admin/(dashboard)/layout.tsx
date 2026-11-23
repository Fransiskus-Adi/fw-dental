"use client";

import { getAdminPagePermission, needsClockIn } from "@/lib/admin-access";
import type { AdminSession } from "@/lib/admin-access";
import { AdminAccessContext } from "@/lib/admin-access-context";
import { signOutStaff, staffFetch } from "@/lib/staff-fetch";

import React, { useState, useEffect, useRef } from "react";
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
  LogOut,
  Stethoscope,
  Database,
  Shield,
  ChevronRight,
  Sparkles,
  Receipt,
  UserCheck,
  Menu,
  X
} from "lucide-react";

const mobilePrimaryRoutes = ["/admin/absence", "/admin", "/admin/bookings", "/admin/transactions", "/admin/schedules"];

interface StaffNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  redirectUrl: string;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  disabled?: boolean;
  onNavigate?: () => void;
}

function SidebarItem({ icon, href, label, isActive, isExpanded, disabled, onNavigate }: SidebarItemProps) {
  return (
    <Link 
      href={disabled ? "#" : href} 
      onNavigate={onNavigate}
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
        <span className={`font-bold text-xs whitespace-nowrap select-none animate-in fade-in slide-in-from-left-2 duration-150 ${
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
  const [sessionError, setSessionError] = useState(false);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mobileNavigation = useRef<HTMLDialogElement>(null);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const masterDataButton = useRef<HTMLButtonElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
  const isMasterDataExpanded = isMasterDataOpen && isClockedIn !== false;
  const isExpanded = isSidebarOpen || isMasterDataExpanded;
  const [currentUser, setCurrentUser] = useState<AdminSession | null>(null);
  const userId = currentUser?.id;
  const pagePermission = getAdminPagePermission(pathname);
  const allowedPage = !pagePermission || currentUser?.permissions[pagePermission] === true;
  const authorized = currentUser !== null;
  const clockInRequired = needsClockIn(currentUser?.permissions);
  const canViewNotifications = currentUser?.permissions?.feat_notifications_view === true;
  const notificationStorageKey = `admin_notifications:${userId}`;
  const [isClockedOut, setIsClockedOut] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [toasts, setToasts] = useState<StaffNotification[]>([]);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

  useEffect(() => {
    let request: AbortController | undefined;

    const loadSession = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;

      try {
        setSessionError(false);
        const response = await staffFetch("/auth/session", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          setCurrentUser(null);
          router.replace("/admin/login");
          return;
        }
        if (response.status === 403) {
          setCurrentUser(null);
          router.replace("/admin/access-denied");
          return;
        }
        if (!response.ok) throw new Error("Could not load staff session");

        const session: AdminSession = await response.json();
        if (controller.signal.aborted) return;
        setCurrentUser(session);
      } catch {
        if (!controller.signal.aborted) setSessionError(true);
      }
    };

    void loadSession();
    window.addEventListener("focus", loadSession);
    return () => {
      request?.abort();
      window.removeEventListener("focus", loadSession);
    };
  }, [router, sessionAttempt]);

  useEffect(() => {
    if (authorized && !allowedPage) router.replace("/admin/access-denied");
  }, [authorized, allowedPage, router]);

  useEffect(() => {
    if (!userId || !clockInRequired) return;

    const checkAbsence = () => {
      staffFetch(`/absences/today/${userId}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Could not verify clock-in status");
          const body = await res.text();
          return body ? JSON.parse(body) : null;
        })
        .then((data) => {
          setIsClockedIn(!!data);
          setIsClockedOut(!!data?.clockOut);
        })
        .catch((err) => {
          console.error("Failed to check daily absence", err);
          setIsClockedIn(null);
          setIsClockedOut(false);
        });
    };

    checkAbsence();

    window.addEventListener('clock-in-success', checkAbsence);
    return () => window.removeEventListener('clock-in-success', checkAbsence);
  }, [userId, pathname, clockInRequired]);

  useEffect(() => {
    if (allowedPage && clockInRequired && isClockedIn === false && pathname !== "/admin/absence") {
      router.push("/admin/absence");
    }
  }, [allowedPage, clockInRequired, isClockedIn, pathname, router]);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
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
    if (!authorized || !userId || !canViewNotifications) return;

    const saved = localStorage.getItem(notificationStorageKey);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Local storage is only available after hydration.
        setNotifications(JSON.parse(saved));
      } catch {
        // Ignore an invalid saved notification list.
      }
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
          shouldNotify = currentUser?.permissions?.page_bookings === true;
          title = "New Booking Appointment!";
          message = "Open the booking queue to view the appointment.";
          redirectUrl = "/admin/bookings";
        } else if (eventName === "CLOCK_IN_REMINDER") {
          if (isClockedIn === false) {
            shouldNotify = true;
            title = "Clock In Reminder";
            message = payload.message || "Please clock in to start your shift!";
            redirectUrl = "/admin/absence";
          }
        } else if (eventName === "CLOCK_OUT_REMINDER") {
          if (isClockedIn === true && !isClockedOut && currentUser?.permissions?.feat_absence_clock_out === true) {
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
            localStorage.setItem(notificationStorageKey, JSON.stringify(updated));
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
  }, [authorized, userId, canViewNotifications, notificationStorageKey, currentUser, isClockedIn, isClockedOut]);

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
    localStorage.removeItem(notificationStorageKey);
  };

  const handleNotificationClick = (notif: StaffNotification) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
      localStorage.setItem(notificationStorageKey, JSON.stringify(updated));
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

  const masterDataLinks = [
    { slug: "employees", label: "Employees", icon: Users, visible: currentUser?.permissions?.page_employees },
    { slug: "doctors", label: "Doctors", icon: Stethoscope, visible: currentUser?.permissions?.page_doctors },
    { slug: "services", label: "Services", icon: Sparkles, visible: currentUser?.permissions?.page_services },
    { slug: "roles", label: "Roles", icon: Shield, visible: currentUser?.permissions?.page_roles },
  ].filter((link) => link.visible);

  const filteredNavigation = navigation.filter(({ href }) =>
    href === "/admin/master-data"
      ? masterDataLinks.length > 0
      : currentUser?.permissions[getAdminPagePermission(href) ?? ""] === true
  );

  const closeMasterData = () => setIsMasterDataOpen(false);
  const mobileLinks = filteredNavigation.flatMap((item) => item.href === "/admin/master-data"
    ? masterDataLinks.map(({ slug, label, icon: Icon }) => ({ href: `${item.href}/${slug}`, label, icon: <Icon className="size-5" /> }))
    : [item]);
  const availableMobileLinks = mobileLinks.filter(({ href }) => isClockedIn !== false || href === "/admin/absence");
  const primaryMobileLinks = availableMobileLinks.filter(({ href }) => mobilePrimaryRoutes.includes(href));
  const otherMobileLinks = availableMobileLinks.filter(({ href }) => !mobilePrimaryRoutes.includes(href));

  if (!authorized || !allowedPage) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8f9fd]">
        {sessionError ? (
          <div className="text-center text-sm text-gray-700" role="alert">
            <p>Could not load your staff session.</p>
            <button
              type="button"
              onClick={() => setSessionAttempt(attempt => attempt + 1)}
              className="mt-2 font-semibold text-teal-700 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div role="status" aria-label="Loading staff session" className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]" />
        )}
      </div>
    );
  }

  return (
    <div className="admin-shell flex min-h-dvh bg-[#f8f9fd] font-sans text-gray-800 antialiased">
      {/* Sidebar - Desktop (Collapsible width transition) */}
      <aside className={`hidden shrink-0 bg-white border-r border-gray-100 lg:flex flex-col py-6 select-none transition-[width] duration-300 motion-reduce:transition-none ${
        isExpanded ? "w-52 sm:w-60" : "w-[76px]"
      }`}>
        <div className="w-full min-h-0 flex flex-col gap-8">
          <div className={`flex shrink-0 items-center w-full overflow-hidden ${isExpanded ? "px-5 justify-start gap-3" : "justify-center"}`}>
            <button
              type="button"
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={isExpanded}
              aria-controls="admin-navigation"
              onClick={() => {
                setIsSidebarOpen(!isExpanded);
                closeMasterData();
              }}
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
          <nav id="admin-navigation" aria-label="Admin navigation" className={`w-full min-h-0 flex flex-col gap-2 overflow-x-hidden overflow-y-auto ${isExpanded ? "px-3" : "items-center"}`}>
            {filteredNavigation.map((item) => {
              const isAbsence = item.href === "/admin/absence";
              const disabled = isClockedIn === false && !isAbsence;

              if (item.href === "/admin/master-data") {
                const isActive = pathname.startsWith(item.href);
                const isHighlighted = isActive || isMasterDataExpanded;

                return (
                  <div
                    key={item.href}
                    className="w-full"
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && isMasterDataExpanded) {
                        closeMasterData();
                        masterDataButton.current?.focus();
                      }
                    }}
                  >
                    <button
                      ref={masterDataButton}
                      type="button"
                      aria-label={item.label}
                      aria-expanded={isMasterDataExpanded}
                      aria-controls="master-data-links"
                      title={isExpanded ? undefined : item.label}
                      disabled={disabled}
                      onClick={() => setIsMasterDataOpen((open) => !open)}
                      className={`group relative flex w-full cursor-pointer items-center py-2.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isExpanded ? "gap-3 rounded-xl px-4 hover:bg-gray-50/50" : "justify-center"
                      } ${isMasterDataExpanded ? "bg-[#008080]/5" : ""}`}
                    >
                      {isActive && !isExpanded && (
                        <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-[#008080]" />
                      )}
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isHighlighted ? "bg-[#008080]/10 text-[#008080]" : "text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-600"
                      }`}>
                        {item.icon}
                      </span>
                      {isExpanded && (
                        <>
                          <span className={`whitespace-nowrap text-xs font-bold ${isHighlighted ? "text-[#008080]" : "text-gray-500"}`}>
                            {item.label}
                          </span>
                          <ChevronRight
                            aria-hidden="true"
                            className={`ml-auto size-3.5 shrink-0 text-gray-400 transition-transform motion-reduce:transition-none ${
                              isMasterDataExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>
                    <ul id="master-data-links" hidden={!isMasterDataExpanded} className="my-1 ml-9 space-y-1 border-l border-teal-100 pl-2">
                      {masterDataLinks.map(({ slug, label, icon: Icon }) => {
                        const href = `${item.href}/${slug}`;
                        const isCurrentPage = pathname === href;

                        return (
                          <li key={slug}>
                            <Link
                              href={href}
                              aria-current={isCurrentPage ? "page" : undefined}
                              onNavigate={closeMasterData}
                              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                                isCurrentPage ? "bg-[#008080]/10 text-[#008080]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              }`}
                            >
                              <Icon aria-hidden="true" className="size-4 shrink-0" />
                              {label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
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
                  onNavigate={closeMasterData}
                />
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="admin-header sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-gray-100 bg-white select-none lg:static lg:min-h-[72px]">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            {otherMobileLinks.length > 0 && (
              <button type="button" aria-label="More menus" aria-haspopup="dialog" className="grid size-11 shrink-0 place-items-center rounded-xl text-teal-800 hover:bg-teal-50" onClick={() => mobileNavigation.current?.showModal()}>
                <Menu className="size-6" />
              </button>
            )}
            <span className="truncate text-sm font-bold">{mobileLinks.find(({ href }) => href === pathname)?.label ?? "FW Dental"}</span>
          </div>
          {/* Search bar */}
          <div className="relative hidden w-80 items-center lg:flex">
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
          <div className="flex shrink-0 items-center gap-2 lg:gap-5">
            {/* Notification Bell */}
            {canViewNotifications && <div className="relative">
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
                    <div className="admin-notifications mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl py-3 px-4 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
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
            </div>}

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
                        void signOutStaff();
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
        <main className="admin-content flex min-w-0 flex-1 flex-col bg-[#f8f9fd]">
          <AdminAccessContext.Provider value={currentUser}>
            {children}
          </AdminAccessContext.Provider>
        </main>
      </div>

      {/* Floating Toast Alerts Container */}
      {primaryMobileLinks.length > 0 && (
        <nav aria-label="Main staff menus" className="admin-bottom-nav fixed inset-x-0 bottom-0 z-20 flex justify-center border-t border-gray-200 bg-white lg:hidden print:hidden">
          {primaryMobileLinks.map(({ href, icon, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className="flex min-h-14 min-w-0 max-w-32 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-center text-[10px] leading-none font-semibold text-gray-600 hover:bg-gray-50 aria-[current=page]:bg-teal-50 aria-[current=page]:text-teal-800 sm:text-xs">
              {icon}<span>{label}</span>
            </Link>
          ))}
        </nav>
      )}
      <dialog ref={mobileNavigation} aria-labelledby="mobile-navigation-title" className="admin-drawer fixed left-0 top-0 m-0 h-dvh max-h-none w-72 max-w-[88vw] overflow-y-auto bg-white shadow-xl backdrop:bg-black/40">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="mobile-navigation-title" className="font-bold text-teal-900">More menus</h2>
          <button type="button" aria-label="Close navigation" className="grid size-11 place-items-center rounded-xl hover:bg-gray-100" onClick={() => mobileNavigation.current?.close()}><X className="size-5" /></button>
        </div>
        <nav aria-label="Additional staff menus" className="flex flex-col gap-1">
          {otherMobileLinks.map(({ href, icon, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 aria-[current=page]:bg-teal-50 aria-[current=page]:text-teal-800" onClick={() => mobileNavigation.current?.close()}>
              {icon}{label}
            </Link>
          ))}
        </nav>
      </dialog>
      <div className="admin-toasts fixed z-40 flex max-w-sm flex-col gap-3 pointer-events-none">
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
