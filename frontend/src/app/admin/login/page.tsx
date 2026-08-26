"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type LoginMode = "login" | "forgot" | "otp" | "reset-password" | "done";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("login");
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Errors or Messages
  const [error, setError] = useState("");

  // Redirect to dashboard if already logged in with a valid token
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(window.atob(base64));
        if (payload.exp && Date.now() < payload.exp * 1000) {
          router.push("/admin/absence");
        }
      } catch (e) {
        // invalid token in storage, ignore
      }
    }
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
      const res = await fetch("http://localhost:3001/auth/login", {
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

      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_token_timestamp", Date.now().toString());
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      document.cookie = `admin_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/admin/absence");
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email or phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/forgot-password", {
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

      setMode("otp");
    } catch (err: any) {
      setError(err.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Please enter your email or phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend OTP.");
      }

      setOtp("");
      if (email.includes("@")) {
        alert("OTP has been resent to your email.");
      } else {
        alert("OTP has been resent to your phone number.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid OTP code.");
      }

      setNewPassword("");
      setConfirmPassword("");
      setMode("reset-password");
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
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

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setMode("done");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fd] px-4 py-12 font-sans select-none">
      
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

        {/* STATE 2: Forgot Password - Enter Email/Phone */}
        {mode === "forgot" && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Forgot Password
              </h2>
              <p className="text-sm font-medium text-gray-500 px-6">
                Enter your email address or phone number and we will send you a verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="w-full space-y-5">
              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 block">
                  Email or Phone Number
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Email address or phone number"
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
                  "Send OTP"
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

        {/* STATE 3: OTP Input Form */}
        {mode === "otp" && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Verification Code
              </h2>
              <p className="text-sm font-medium text-gray-500 px-6">
                Please enter the 4-digit code sent to <strong className="text-gray-700">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="w-full space-y-5">
              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 block text-center">
                  Verification Code
                </label>
                <div className="flex justify-center">
                  <Input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="0000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-40 h-12 text-center text-xl tracking-[0.5em] font-extrabold border-gray-250 focus:border-blue-500 rounded-xl px-2 text-gray-800 bg-white"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all shadow-md shadow-teal-900/10 disabled:opacity-75 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Submit"
                )}
              </button>
            </form>

            {/* Back to Login / Resend */}
            <div className="mt-6 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-xs text-[#008080] font-bold hover:underline cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                Resend Code
              </button>
              <button
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                Back to Login
              </button>
            </div>
          </>
        )}

        {/* STATE 4: Done / Reset Complete */}
        {mode === "reset-password" && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                New Password
              </h2>
              <p className="text-sm font-medium text-gray-500 px-6">
                Please enter and confirm your new password below.
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
