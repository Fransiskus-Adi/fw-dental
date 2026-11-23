"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { signOutStaff } from "@/lib/staff-fetch";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fd] px-4 py-12 font-sans select-none">
      <div className="w-full max-w-md bg-white border border-gray-150 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
        {/* Shield Icon */}
        <div className="size-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
          <ShieldAlert className="size-9" />
        </div>

        {/* Text Details */}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
          Access Denied
        </h2>
        <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
          You do not have the required authorities to access this page. If you believe this is an error, please contact your system administrator.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push("/admin/absence")}
            className="w-full h-11 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md shadow-teal-950/10"
          >
            <ArrowLeft className="size-4" />
            Go to Absence Page
          </button>
          
          <button
            onClick={signOutStaff}
            className="w-full h-11 bg-white border border-gray-250 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <LogOut className="size-4 text-gray-400" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
