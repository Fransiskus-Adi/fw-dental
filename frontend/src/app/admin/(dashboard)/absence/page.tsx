"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  History,
  Info,
  LogIn,
  LogOut,
  MapIcon,
  Timer,
  CalendarCheck,
  Fingerprint,
  CircleDot,
  Navigation,
  Loader2,
  X,
  LocateFixed,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Absence {
  id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInLocation: string | null;
  clockOutLocation: string | null;
  status: string; // 'PRESENT' or 'LATE'
  createdAt: string;
}

type GpsModalMode = "clock-in" | "clock-out" | null;
type GpsStep = "confirm" | "loading" | "success" | "error";

export default function AdminAbsencePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [todayAbsence, setTodayAbsence] = useState<Absence | null>(null);
  const [history, setHistory] = useState<Absence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [location, setLocation] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // GPS Modal states
  const [gpsModalMode, setGpsModalMode] = useState<GpsModalMode>(null);
  const [gpsStep, setGpsStep] = useState<GpsStep>("confirm");
  const [gpsError, setGpsError] = useState<string>("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>("");
  const [reverseGeocoding, setReverseGeocoding] = useState<boolean>(false);
  const [gpsPermissionGranted, setGpsPermissionGranted] = useState<boolean>(false);

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Retrieve userId from local storage token/user
    const token = localStorage.getItem("admin_token");
    const userStr = localStorage.getItem("admin_user");
    if (!token) return;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      setUserId(payload.sub);

      if (userStr) {
        const u = JSON.parse(userStr);
        setUserName(u.name || "User");
      }
    } catch (e) {
      console.error("Error retrieving user info", e);
    }
  }, []);

  const fetchData = async (uid: string) => {
    setLoading(true);
    try {
      // 1. Fetch today's status
      const todayRes = await fetch(`http://localhost:3001/absences/today/${uid}`);
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setTodayAbsence(todayData || null);
      }

      // 2. Fetch history
      const historyRes = await fetch(`http://localhost:3001/absences/history/${uid}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      console.error("Error fetching absence data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData(userId);
    }
  }, [userId]);

  const handleClockIn = async (loc: string) => {
    if (!userId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:3001/absences/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          location: loc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to clock in.");
      }

      setSuccess("Successfully clocked in today!");
      setTodayAbsence(data);

      // Dispatch success event to let layout know we are clocked in
      window.dispatchEvent(new Event("clock-in-success"));

      // Refresh history
      fetchData(userId);
    } catch (err: any) {
      setError(err.message || "Error checking in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async (loc: string) => {
    if (!userId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:3001/absences/clock-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          location: loc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to clock out.");
      }

      setSuccess("Successfully clocked out today! Have a great evening!");
      setTodayAbsence(data);

      // Refresh history
      fetchData(userId);
    } catch (err: any) {
      setError(err.message || "Error checking out");
    } finally {
      setSubmitting(false);
    }
  };

  // Open GPS confirmation modal
  const openGpsModal = (mode: GpsModalMode) => {
    setGpsModalMode(mode);
    setGpsStep("confirm");
    setGpsError("");
    setGpsCoords(null);
    setGpsAddress("");
    setReverseGeocoding(false);
  };

  // Silently get GPS and perform clock-out (skip modal when permission already granted)
  const silentGpsAndProcess = async (mode: "clock-in" | "clock-out") => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    // Open modal in loading state directly (no confirm step)
    setGpsModalMode(mode);
    setGpsStep("loading");
    setGpsError("");
    setGpsCoords(null);
    setGpsAddress("");
    setReverseGeocoding(false);

    if (!navigator.geolocation) {
      // Fallback to modal error
      setGpsStep("error");
      setGpsError("Geolocation is not supported by your browser.");
      setSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });

        setReverseGeocoding(true);
        const placeName = await reverseGeocode(latitude, longitude);
        setGpsAddress(placeName);
        setLocation(placeName);
        setReverseGeocoding(false);

        // Close modal and proceed directly
        setGpsModalMode(null);
        setGpsStep("confirm");

        if (mode === "clock-out") {
          await handleClockOut(placeName);
        } else {
          await handleClockIn(placeName);
        }
      },
      () => {
        // If silent GPS fails, fall back to showing the full modal
        setGpsStep("error");
        setGpsError("Could not get your location. Please try again or enter manually.");
        setGpsPermissionGranted(false);
        setSubmitting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const closeGpsModal = () => {
    setGpsModalMode(null);
    setGpsStep("confirm");
    setGpsError("");
    setGpsCoords(null);
    setGpsAddress("");
    setReverseGeocoding(false);
  };

  // Reverse geocode coordinates to a place name using OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (!res.ok) throw new Error("Geocoding failed");
      const data = await res.json();

      if (data.display_name) {
        // Build a cleaner, shorter address from the address parts
        const addr = data.address || {};
        const parts: string[] = [];

        // Try to build a concise address: road/building, neighbourhood, city
        if (addr.building || addr.amenity || addr.shop) {
          parts.push(addr.building || addr.amenity || addr.shop);
        }
        if (addr.road) parts.push(addr.road);
        if (addr.neighbourhood || addr.suburb) {
          parts.push(addr.neighbourhood || addr.suburb);
        }
        if (addr.city || addr.town || addr.village || addr.municipality) {
          parts.push(addr.city || addr.town || addr.village || addr.municipality);
        }
        if (addr.state) parts.push(addr.state);

        if (parts.length > 0) {
          return parts.join(", ");
        }
        return data.display_name;
      }
      return `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } catch {
      // Fallback to coordinates if geocoding fails
      return `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }
  };

  // Request GPS location from browser
  const requestGpsLocation = useCallback(() => {
    setGpsStep("loading");
    setGpsError("");
    setGpsAddress("");
    setReverseGeocoding(false);

    if (!navigator.geolocation) {
      setGpsStep("error");
      setGpsError("Geolocation is not supported by your browser. Please use a modern browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });

        // Reverse geocode to get the actual place name
        setReverseGeocoding(true);
        const placeName = await reverseGeocode(latitude, longitude);
        setGpsAddress(placeName);
        setLocation(placeName);
        setReverseGeocoding(false);
        setGpsPermissionGranted(true);
        setGpsStep("success");
      },
      (err) => {
        setGpsStep("error");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError(
              "Location permission denied. Please enable location access in your browser settings and try again."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError(
              "Location information is unavailable. Please check your device's GPS settings."
            );
            break;
          case err.TIMEOUT:
            setGpsError(
              "Location request timed out. Please ensure GPS is enabled and try again."
            );
            break;
          default:
            setGpsError("An unknown error occurred while retrieving your location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  // Proceed after GPS success → actually clock in/out
  const handleGpsConfirmProceed = async () => {
    closeGpsModal();
    if (gpsModalMode === "clock-in") {
      await handleClockIn(location);
    } else if (gpsModalMode === "clock-out") {
      await handleClockOut(location);
    }
  };

  // Use manual/mock location instead (fallback)
  const handleUseManualLocation = async () => {
    const manualLoc = location || "Manual Entry";
    closeGpsModal();
    if (gpsModalMode === "clock-in") {
      await handleClockIn(manualLoc);
    } else if (gpsModalMode === "clock-out") {
      await handleClockOut(manualLoc);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status: string) => {
    if (status === "PRESENT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-600 uppercase tracking-wider">
          <span className="size-1.5 rounded-full bg-green-500" />
          On Time
        </span>
      );
    } else if (status === "LATE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 uppercase tracking-wider">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Late
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-50 text-gray-600 uppercase tracking-wider">
        {status}
      </span>
    );
  };

  // Quick helper to fill in current mock GPS coordinates
  const fillMockGps = () => {
    setLocation(`FW Dental HQ Office (lat: -6.2088, lng: 106.8456)`);
  };

  const todayDateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const liveTimeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (loading && !userId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 font-sans overflow-hidden min-h-0">

      {/* ======= GPS CONFIRMATION MODAL ======= */}
      {gpsModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={gpsStep !== "loading" ? closeGpsModal : undefined}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[420px] mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Close Button */}
            {gpsStep !== "loading" && (
              <button
                onClick={closeGpsModal}
                className="absolute top-4 right-4 size-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all cursor-pointer z-10"
              >
                <X className="size-4" />
              </button>
            )}

            {/* === STEP: Confirm (Ask for GPS permission) === */}
            {gpsStep === "confirm" && (
              <div className="p-6 flex flex-col items-center text-center gap-4">
                {/* Icon */}
                <div className="size-16 bg-[#e0f5f6] rounded-2xl flex items-center justify-center">
                  <Navigation className="size-7 text-[#008080]" />
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Enable Location Access
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[320px]">
                    We need your GPS location to accurately record your{" "}
                    {gpsModalMode === "clock-in" ? "clock-in" : "clock-out"} position.
                    Please allow location access when prompted by your browser.
                  </p>
                </div>

                {/* Info Banner */}
                <div className="w-full bg-[#f0fafa] rounded-xl p-3 flex gap-2.5 border border-[#008080]/10 text-left">
                  <LocateFixed className="size-4 text-[#008080] shrink-0 mt-0.5" />
                  <div className="text-[10px] text-gray-600 font-medium leading-relaxed">
                    <p className="font-bold text-[11px] text-[#008080]">Why do we need this?</p>
                    <p>Your exact location is recorded for attendance verification and compliance purposes. The data is only used internally.</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="w-full flex flex-col gap-2 mt-1">
                  <Button
                    onClick={requestGpsLocation}
                    className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Navigation className="size-4" />
                    Allow &amp; Get My Location
                  </Button>
                  <button
                    onClick={handleUseManualLocation}
                    className="w-full h-9 text-[11px] text-gray-400 hover:text-gray-600 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    type="button"
                  >
                    <MapIcon className="size-3" />
                    Skip &amp; use manual location instead
                  </button>
                </div>
              </div>
            )}

            {/* === STEP: Loading (Getting GPS) === */}
            {gpsStep === "loading" && (
              <div className="p-8 flex flex-col items-center text-center gap-4">
                {/* Animated GPS Pulse */}
                <div className="relative size-16 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#008080]/10 rounded-full animate-ping" />
                  <div className="absolute inset-2 bg-[#008080]/20 rounded-full animate-pulse" />
                  <div className="relative size-10 bg-[#e0f5f6] rounded-full flex items-center justify-center">
                    <Loader2 className="size-5 text-[#008080] animate-spin" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    {reverseGeocoding ? "Resolving your address..." : "Getting your location..."}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {reverseGeocoding
                      ? "Converting GPS coordinates to your exact address."
                      : "Please wait while we acquire your GPS coordinates."}
                  </p>
                </div>
              </div>
            )}

            {/* === STEP: Success (GPS obtained) === */}
            {gpsStep === "success" && gpsCoords && (
              <div className="p-6 flex flex-col items-center text-center gap-4">
                {/* Success Icon */}
                <div className="size-16 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
                  <CheckCircle className="size-7 text-green-500" />
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Location Acquired!
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Your location has been identified successfully.
                  </p>
                </div>

                {/* Place Name Display */}
                <div className="w-full bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-1.5">
                  <div className="flex items-start gap-2 justify-center">
                    <MapPin className="size-4 text-[#008080] shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-gray-800 leading-snug">
                      {gpsAddress}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium tabular-nums">
                    {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                  </p>
                </div>

                {/* Action */}
                <Button
                  onClick={handleGpsConfirmProceed}
                  disabled={submitting}
                  className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  {gpsModalMode === "clock-in" ? (
                    <>
                      <LogIn className="size-4" />
                      {submitting ? "Clocking in..." : "Confirm & Clock In"}
                    </>
                  ) : (
                    <>
                      <LogOut className="size-4" />
                      {submitting ? "Clocking out..." : "Confirm & Clock Out"}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* === STEP: Error (GPS failed) === */}
            {gpsStep === "error" && (
              <div className="p-6 flex flex-col items-center text-center gap-4">
                {/* Error Icon */}
                <div className="size-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                  <ShieldAlert className="size-7 text-rose-500" />
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Location Access Failed
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[320px]">
                    {gpsError}
                  </p>
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-2 mt-1">
                  <Button
                    onClick={requestGpsLocation}
                    className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Navigation className="size-4" />
                    Try Again
                  </Button>
                  <button
                    onClick={handleUseManualLocation}
                    className="w-full h-9 text-[11px] text-gray-400 hover:text-gray-600 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    type="button"
                  >
                    <MapIcon className="size-3" />
                    Use manual location instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Row — Live Clock + Quick Stats */}
      <div className="flex-none grid grid-cols-1 lg:grid-cols-12 gap-4 h-[115px]">

        {/* Welcome + Live Clock Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl px-5 py-4 border border-gray-100/50 shadow-sm flex items-center justify-between relative overflow-hidden h-full">
          <div className="space-y-1.5 z-10">
            <h2 className="text-gray-800 text-sm font-bold">
              Good {currentTime.getHours() < 12 ? "Morning" : currentTime.getHours() < 17 ? "Afternoon" : "Evening"}, {userName || "there"}! 👋
            </h2>
            <div className="space-y-0.5">
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none tabular-nums">
                {liveTimeStr}
              </p>
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">
                {todayDateStr}
              </p>
            </div>
          </div>

          {/* Clock Illustration */}
          <div className="relative size-20 shrink-0 flex items-center justify-center mr-1 select-none">
            <div className="absolute size-18 bg-gradient-to-br from-[#008080] to-[#006666] rounded-xl shadow-sm border border-teal-400/30 transform -rotate-6 flex items-center justify-center">
              <Fingerprint className="size-9 text-white/80" />
            </div>
            <div className="absolute -top-1 -right-1 size-6 bg-white rounded-lg shadow-xs border border-gray-100 flex items-center justify-center">
              <CircleDot className="size-3.5 text-[#008080]" />
            </div>
          </div>
        </div>

        {/* Today Status Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl px-5 py-4 border border-gray-100/50 shadow-sm flex flex-col justify-between h-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-[#e0f5f6] text-[#00a3a6] rounded-full flex items-center justify-center shrink-0">
              <CalendarCheck className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase truncate">
                Today&apos;s Status
              </p>
              {todayAbsence ? (
                <p className="text-sm font-extrabold text-gray-800 leading-none mt-1">
                  Clocked In ✓
                </p>
              ) : (
                <p className="text-sm font-extrabold text-rose-600 leading-none mt-1">
                  Not Clocked In
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            {todayAbsence ? (
              getStatusBadge(todayAbsence.status)
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-full">
                Pending
              </span>
            )}
            {todayAbsence && (
              <span className="text-[10px] text-gray-400 font-medium">
                at {formatTime(todayAbsence.clockIn)}
              </span>
            )}
          </div>
        </div>

        {/* Clock Out Status Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl px-5 py-4 border border-gray-100/50 shadow-sm flex flex-col justify-between h-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-[#fef5e7] text-[#f59e0b] rounded-full flex items-center justify-center shrink-0">
              <Timer className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase truncate">
                Clock Out
              </p>
              <p className="text-sm font-extrabold text-gray-800 leading-none mt-1">
                {todayAbsence?.clockOut ? formatTime(todayAbsence.clockOut) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            {todayAbsence?.clockOut ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full">
                Completed
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full">
                {todayAbsence ? "Awaiting" : "N/A"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Row — Clock In/Out Action + History Table */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Clock In / Out Action Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col min-h-0">

          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 flex-none">
            <h4 className="text-gray-800 font-bold text-sm flex items-center gap-1.5">
              <Clock className="size-4.5 text-[#008080]" />
              Record Attendance
            </h4>
          </div>

          {/* Action Content */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4">

            {/* Rules Banner — Compact */}
            <div className="bg-[#f0fafa] rounded-xl p-3 flex gap-2.5 border border-[#008080]/10">
              <Info className="size-4 text-[#008080] shrink-0 mt-0.5" />
              <div className="space-y-1 text-[10px] text-gray-600 font-medium leading-relaxed">
                <p className="font-bold text-[11px] text-[#008080]">Reminders</p>
                <p>Clock In: <strong>8:00 AM</strong> &nbsp;·&nbsp; Tolerance: <strong>8:20 AM</strong></p>
                <p>Clock Out: <strong>5:00 PM</strong> &nbsp;·&nbsp; Record location</p>
                <p className="text-[9px] text-gray-400">You must clock in to access other menus.</p>
              </div>
            </div>

            {/* Error or Success Toast */}
            {error && (
              <div className="p-2.5 text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 font-medium">
                <AlertTriangle className="size-3.5 shrink-0 text-red-500" />
                {error}
              </div>
            )}
            {success && (
              <div className="p-2.5 text-[10px] text-green-600 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle className="size-3.5 shrink-0 text-green-500" />
                {success}
              </div>
            )}

            {/* Clocked-in Summary */}
            {todayAbsence && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="size-7 bg-[#008080]/10 text-[#008080] rounded-lg flex items-center justify-center shrink-0">
                      <LogIn className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold leading-none">Clock In</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5 leading-none">{formatTime(todayAbsence.clockIn)}</p>
                    </div>
                  </div>
                  {getStatusBadge(todayAbsence.status)}
                </div>

                {todayAbsence.clockOut && (
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="size-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
                        <LogOut className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 font-semibold leading-none">Clock Out</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5 leading-none">{formatTime(todayAbsence.clockOut)}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-green-500 uppercase leading-none">Done</span>
                  </div>
                )}

                {/* Location info */}
                {todayAbsence.clockInLocation && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50/50 rounded-lg">
                    <MapPin className="size-3 text-gray-400 shrink-0" />
                    <span className="text-[9px] text-gray-400 font-medium truncate" title={todayAbsence.clockInLocation}>
                      {todayAbsence.clockInLocation}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Location Input + Action Button */}
            {(!todayAbsence || !todayAbsence.clockOut) && (
              <div className="space-y-3 mt-auto">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider">
                      <MapPin className="size-3 text-[#008080]" />
                      Location
                    </label>
                    <button
                      onClick={fillMockGps}
                      className="text-[9px] text-[#008080] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      type="button"
                    >
                      <MapIcon className="size-2.5" />
                      Mock GPS
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="Location will be filled via GPS"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 border-gray-200 focus:border-[#008080] rounded-xl px-3 text-xs bg-[#f5f6fa] text-gray-800 placeholder:text-gray-400"
                    disabled={submitting}
                  />
                </div>

                {!todayAbsence ? (
                  <Button
                    onClick={() => openGpsModal("clock-in")}
                    disabled={submitting}
                    className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <LogIn className="size-4" />
                    {submitting ? "Clocking in..." : "Clock In"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => gpsPermissionGranted ? silentGpsAndProcess("clock-out") : openGpsModal("clock-out")}
                    disabled={submitting}
                    className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    {submitting ? "Clocking out..." : "Clock Out"}
                  </Button>
                )}
              </div>
            )}

            {/* Completed State */}
            {todayAbsence && todayAbsence.clockOut && (
              <div className="text-center p-3 text-xs bg-green-50/50 border border-green-100 rounded-xl text-green-700 font-bold mt-auto">
                🎉 Attendance completed for today!
              </div>
            )}
          </div>
        </div>

        {/* Attendance History Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col min-h-0">

          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 flex-none">
            <h4 className="text-gray-800 font-bold text-sm flex items-center gap-1.5">
              <History className="size-4.5 text-[#008080]" />
              Attendance History
            </h4>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md">
              {history.length} Records
            </span>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="size-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <History className="size-5 text-gray-300" />
                </div>
                <p className="text-xs font-bold text-gray-400">No attendance logs found</p>
                <p className="text-[10px] text-gray-300 font-medium mt-1">Records will appear here after you clock in.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-gray-400 font-semibold border-b border-gray-50 sticky top-0 bg-white">
                    <th className="pb-2 pr-2">Date</th>
                    <th className="pb-2 px-2">Clock In</th>
                    <th className="pb-2 px-2">Clock Out</th>
                    <th className="pb-2 px-2">Location</th>
                    <th className="pb-2 pl-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-2.5 pr-2 font-bold text-gray-800 whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-2.5 px-2 text-gray-500 font-semibold tabular-nums">
                        {formatTime(row.clockIn)}
                      </td>
                      <td className="py-2.5 px-2 text-gray-500 font-semibold tabular-nums">
                        {formatTime(row.clockOut)}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-[10px] text-gray-400 font-medium truncate max-w-[180px] block" title={row.clockInLocation || ""}>
                          {row.clockInLocation || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
