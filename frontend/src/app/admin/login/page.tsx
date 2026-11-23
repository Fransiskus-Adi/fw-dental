"use client";

import { adminLandingPage } from "@/lib/admin-access";
import type { AdminSession } from "@/lib/admin-access";
import { staffFetch } from "@/lib/staff-fetch";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type LoginMode = "login" | "forgot" | "reset-sent" | "reset-password" | "done";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("login");
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const resetLinkOpened = useRef(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Errors or Messages
  const [error, setError] = useState("");

  useEffect(() => {
    if (resetLinkOpened.current) return;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("reset");
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
      resetLinkOpened.current = true;
      window.history.replaceState(null, "", window.location.pathname);
      setResetToken(token);
      setMode("reset-password");
      return;
    }
    // Remove credentials left by app versions that stored them in the browser.
    try {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_timestamp");
      localStorage.removeItem("admin_user");
      document.cookie = "admin_token=; path=/; max-age=0; SameSite=Lax";
    } catch {
      // Session verification can still use the server-managed cookie.
    }
    const controller = new AbortController();
    void staffFetch("/auth/session", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) return;
        const session: AdminSession = await response.json();
        if (!controller.signal.aborted) router.replace(adminLandingPage(session.permissions));
      })
      .catch(() => {
        // The login form remains available if the previous session cannot be loaded.
      });
    return () => controller.abort();
  }, [router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await staffFetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials. Please try again.");
      }

      window.location.replace(adminLandingPage(data.user.permissions));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/clinic/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to request password reset.");
      }

      setMode("reset-sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please enter all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if ([...newPassword].length < 15 || new TextEncoder().encode(newPassword).length > 72) {
      setError("Use at least 15 characters and at most 72 UTF-8 bytes.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/clinic/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setResetToken("");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login min-h-dvh flex flex-col items-center justify-center bg-[#f8f9fd] font-sans">
      
      {/* Login Card Wrapper */}
      <div className="w-full max-w-lg bg-white border border-gray-150 rounded-2xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img
            src="/fw-dental-logo.png"
            alt="FW Dental Logo"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* STATE 1: Standard Login Form */}
        {mode === "login" && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome to FW Dental
              </h2>
              <p className="text-sm font-medium text-gray-500">
                Your Gateway to Clinic Management
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="w-full space-y-5">
              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 block">
                  Email
                </label>
                <Input
                  type="email"
                  aria-label="Email"
                  autoComplete="username"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 border-gray-200 focus:border-blue-500 rounded-xl px-4 text-gray-800 placeholder:text-gray-400 bg-white"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 block">
                  Password
                </label>
                <Input
                  type="password"
                  aria-label="Password"
                  autoComplete="current-password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 border-gray-200 focus:border-blue-500 rounded-xl px-4 text-gray-800 placeholder:text-gray-400 bg-white"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all shadow-md shadow-teal-900/10 disabled:opacity-75 flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>

            {/* Forgot Password trigger link */}
            <div className="mt-6 text-center">
              <span
                onClick={() => {
                  setError("");
                  setMode("forgot");
                }}
                className="text-sm font-bold text-gray-500 cursor-pointer hover:text-gray-800 hover:underline"
              >
                Forgot password?
              </span>
            </div>
          </>
        )}

        {/* Password reset request */}
        {mode === "forgot" && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Forgot Password
              </h2>
              <p className="text-sm font-medium text-gray-500 px-6">
                Enter your staff email address to request a password reset link.
              </p>
            </div>

            <form onSubmit={handleSendReset} className="w-full space-y-5">
              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 block">
                  Email address
                </label>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 border-gray-200 focus:border-blue-500 rounded-xl px-4 text-gray-800 placeholder:text-gray-400 bg-white"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all shadow-md shadow-teal-900/10 disabled:opacity-75 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            {/* Back to Login link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                Back to Login
              </button>
            </div>
          </>
        )}

        {mode === "reset-sent" && (
          <div className="text-center space-y-4" role="status">
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-600">
              If an eligible account uses that address, you will receive a link that expires in 30 minutes.
            </p>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-sm font-bold text-teal-700 hover:underline"
            >
              Request another link
            </button>
          </div>
        )}
        {/* New password */}
        {mode === "reset-password" && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                New Password
              </h2>
              <p className="text-sm font-medium text-gray-500 px-6">
                Use at least 15 characters.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="w-full space-y-5">
              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 block">
                  New Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="New password"
                  minLength={15}
                  aria-label="New password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 border-gray-200 focus:border-blue-500 rounded-xl px-4 text-gray-800 placeholder:text-gray-400 bg-white"
                  disabled={loading}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 block">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Confirm password"
                  aria-label="Confirm password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 border-gray-200 focus:border-blue-500 rounded-xl px-4 text-gray-800 placeholder:text-gray-400 bg-white"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all shadow-md shadow-teal-900/10 disabled:opacity-75 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>

            {/* Back to Login link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                Back to Login
              </button>
            </div>
          </>
        )}

        {/* STATE 5: Done / Reset Complete */}
        {mode === "done" && (
          <>
            <div className="text-center space-y-4 my-4 flex flex-col items-center">
              <div className="size-16 rounded-full bg-green-50 border border-green-150 flex items-center justify-center text-green-500 mb-2 shadow-[0_4px_12px_rgba(34,197,94,0.1)]">
                <CheckCircle2 className="size-10" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Password Reset Complete
              </h2>
              <p className="text-sm font-medium text-gray-500 px-6">
                Your password has been successfully reset. You can now login with your new password.
              </p>
            </div>

            <div className="w-full space-y-3 mt-6">
              <button
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
                className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all flex items-center justify-center text-sm cursor-pointer shadow-md"
              >
                Go to Login
              </button>
            </div>
          </>
        )}

      </div>

      {/* Footer Legal Agreements */}
      <div className="w-full max-w-lg mt-8 text-center text-xs text-gray-400 font-semibold leading-relaxed px-4">
        By clicking &quot;Submit&quot;, you agree to FW Dental&apos;s{" "}
        <a href="#" className="text-gray-600 hover:underline underline-offset-2">
          User Agreement
        </a>
        , and{" "}
        <a href="#" className="text-gray-600 hover:underline underline-offset-2">
          Privacy Policy
        </a>
        . We prioritize your privacy and trust, guiding you through clinic operations while safeguarding your personal information.
      </div>

    </div>
  );
}
