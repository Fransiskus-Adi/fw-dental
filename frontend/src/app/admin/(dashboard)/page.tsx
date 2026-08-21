"use client";

import React, { useState } from "react";
import {
  Users,
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CalendarDays,
  UserCheck
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("1Y");

  // Mock statistics data
  const stats = {
    balance: "Rp 8.876.540.000",
    customers: "423.84K",
    customersGrowth: "+4.5%",
    orders: "622.35K",
    ordersGrowth: "+2.5%",
    earnings: "Rp 9.485.500.000",
  };

  // Mock appointments for a dental clinic context
  const upcomingAppointments = [
    { id: 1, patient: "Sarah Connor", doctor: "Dr. Aris", time: "09:00 AM", treatment: "Teeth Whitening", status: "Confirmed" },
    { id: 2, patient: "John Doe", doctor: "Dr. Brenda", time: "10:30 AM", treatment: "Dental Crown", status: "Pending" },
    { id: 3, patient: "Kyle Reese", doctor: "Dr. Catur", time: "01:00 PM", treatment: "Root Canal", status: "Confirmed" },
    { id: 4, patient: "Ellen Ripley", doctor: "Dr. Aris", time: "03:30 PM", treatment: "General Checkup", status: "Completed" }
  ];

  return (
    <div className="h-full flex flex-col gap-4 font-sans overflow-hidden min-h-0">
      
      {/* Top Cards Row - Fixed height */}
      <div className="flex-none grid grid-cols-1 lg:grid-cols-12 gap-4 h-[115px]">
        
        {/* Welcome Back Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl px-5 py-4 border border-gray-100/50 shadow-sm flex items-center justify-between relative overflow-hidden h-full">
          <div className="space-y-1.5 z-10">
            <h2 className="text-gray-800 text-sm font-bold">
              Welcome back, Emily! 👋
            </h2>
            <div className="space-y-0.5">
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">
                {stats.balance}
              </p>
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">
                Current balance
              </p>
            </div>
          </div>

          {/* Wallet Illustration Graphic - Resized to fit h-[115px] card */}
          <div className="relative size-20 shrink-0 flex items-center justify-center mr-1 select-none">
            <div className="absolute size-18 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-sm border border-amber-300 transform -rotate-6 flex flex-col justify-between p-2">
              {/* Credit Card Graphic peaking out */}
              <div className="absolute -top-2 left-3 w-10 h-6 bg-blue-500 rounded-md shadow-xs transform rotate-12 border border-blue-400 flex items-center justify-between p-1">
                <div className="size-1 bg-yellow-400 rounded-2xs" />
                <div className="w-4 h-0.5 bg-white/50 rounded-2xs" />
              </div>
              <div className="absolute -top-2.5 left-6 w-10 h-6 bg-indigo-600 rounded-md shadow-xs transform rotate-3 flex items-center justify-between p-1">
                <div className="size-1 bg-yellow-400 rounded-2xs" />
                <div className="w-4 h-0.5 bg-white/50 rounded-2xs" />
              </div>
              
              {/* Wallet snap */}
              <div className="w-full flex justify-end mt-2">
                <div className="w-6 h-3 bg-amber-600 rounded-r-sm border-l border-amber-700 flex items-center justify-center">
                  <div className="size-1 bg-yellow-300 rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Coins */}
            <div className="absolute top-8 right-0 size-4.5 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full border border-yellow-250 shadow-xs flex items-center justify-center font-bold text-[5px] text-yellow-800">
              Rp
            </div>
          </div>
        </div>

        {/* Total Customers Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl px-5 py-4 border border-gray-100/50 shadow-sm flex flex-col justify-between h-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-[#e0f5f6] text-[#00a3a6] rounded-full flex items-center justify-center shrink-0">
              <Users className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase truncate">
                Total customers
              </p>
              <p className="text-xl font-extrabold text-gray-800 leading-none mt-1">
                {stats.customers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-50 text-[#10b981] rounded-full">
              {stats.customersGrowth}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              This month
            </span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl px-5 py-4 border border-gray-100/50 shadow-sm flex flex-col justify-between h-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-[#fef5e7] text-[#f59e0b] rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase truncate">
                Total orders
              </p>
              <p className="text-xl font-extrabold text-gray-800 leading-none mt-1">
                {stats.orders}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-50 text-[#10b981] rounded-full">
              {stats.ordersGrowth}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              This month
            </span>
          </div>
        </div>

      </div>

      {/* Large Earnings Chart Card - Responsive Flex */}
      <div className="flex-[1.2] min-h-0 bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col">
        {/* Chart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-none">
          <div>
            <h3 className="text-gray-800 font-bold text-sm leading-none">Earnings</h3>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-[#008080]">
                {stats.earnings}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                Earnings this year
              </span>
            </div>
          </div>
          
          {/* Time Filters */}
          <div className="flex bg-[#f5f6fa] rounded-lg p-0.5 select-none flex-none">
            {["1M", "3M", "6M", "1Y"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-[#008080] text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Line Chart - Automatically stretches using flex-grow */}
        <div className="flex-1 min-h-0 relative w-full flex mt-3">
          {/* Main Chart Area */}
          <div className="flex-1 h-full pr-10 relative min-h-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 900 170"
              preserveAspectRatio="none"
            >
              {/* Gradients */}
              <defs>
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008080" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#008080" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines (Horizontal) */}
              <line x1="0" y1="20" x2="900" y2="20" stroke="#f9fafb" strokeWidth="1" />
              <line x1="0" y1="50" x2="900" y2="50" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="80" x2="900" y2="80" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="110" x2="900" y2="110" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="140" x2="900" y2="140" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />

              {/* Shaded Area Under Curve */}
              <path
                d="
                  M 0 120 
                  C 50 100, 70 85, 100 95
                  C 130 105, 160 120, 200 100
                  C 250 70, 280 85, 310 102
                  C 350 125, 390 100, 420 85
                  C 450 70, 480 100, 520 100
                  C 560 100, 590 70, 620 66
                  C 650 63, 680 90, 720 85
                  C 770 70, 800 50, 840 60
                  C 870 67, 880 53, 900 32
                  L 900 170 L 0 170 Z
                "
                fill="url(#chartAreaGradient)"
              />

              {/* Curve Line */}
              <path
                d="
                  M 0 120 
                  C 50 100, 70 85, 100 95
                  C 130 105, 160 120, 200 100
                  C 250 70, 280 85, 310 102
                  C 350 125, 390 100, 420 85
                  C 450 70, 480 100, 520 100
                  C 560 100, 590 70, 620 66
                  C 650 63, 680 90, 720 85
                  C 770 70, 800 50, 840 60
                  C 870 67, 880 53, 900 32
                "
                fill="none"
                stroke="#008080"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points dots */}
              <circle cx="200" cy="100" r="3.5" fill="#008080" stroke="white" strokeWidth="1.5" />
              <circle cx="420" cy="85" r="3.5" fill="#008080" stroke="white" strokeWidth="1.5" />
              <circle cx="620" cy="66" r="3.5" fill="#008080" stroke="white" strokeWidth="1.5" />
              <circle cx="900" cy="32" r="3.5" fill="#008080" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Y Axis Labels (Right Aligned as in image) */}
          <div className="absolute right-0 top-0 bottom-0 w-8 flex flex-col justify-between text-right text-[9px] text-gray-400 font-bold select-none h-[140px] mt-[10px]">
            <span>100k</span>
            <span>80k</span>
            <span>60k</span>
            <span>40k</span>
            <span>20k</span>
            <span>0k</span>
          </div>
        </div>

        {/* X Axis Labels */}
        <div className="flex justify-between text-[10px] text-gray-400 font-bold px-2 mt-1 select-none pr-10 flex-none border-t border-gray-50 pt-1">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Aug</span>
          <span>Sep</span>
          <span>Oct</span>
          <span>Nov</span>
          <span>Dec</span>
        </div>
      </div>

      {/* Grid of secondary statistics - Resized to fit screen */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Appointments Table - Takes remaining height, scrollable table body */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 flex-none">
            <h4 className="text-gray-800 font-bold text-sm flex items-center gap-1.5">
              <CalendarDays className="size-4.5 text-[#008080]" />
              Today&apos;s Appointments
            </h4>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md">
              {upcomingAppointments.length} Booked
            </span>
          </div>

          {/* Internal scrollable container for Table */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-gray-400 font-semibold border-b border-gray-50 sticky top-0 bg-white">
                  <th className="pb-2 pr-2">Patient</th>
                  <th className="pb-2 px-2">Doctor</th>
                  <th className="pb-2 px-2">Time</th>
                  <th className="pb-2 px-2">Treatment</th>
                  <th className="pb-2 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {upcomingAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2 pr-2 font-bold text-gray-800">{app.patient}</td>
                    <td className="py-2 px-2 text-gray-500 font-medium">{app.doctor}</td>
                    <td className="py-2 px-2 text-gray-500 font-semibold">{app.time}</td>
                    <td className="py-2 px-2 text-gray-500 font-medium">{app.treatment}</td>
                    <td className="py-2 pl-2 text-right">
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                          app.status === "Confirmed"
                            ? "bg-green-50 text-green-600"
                            : app.status === "Completed"
                            ? "bg-[#008080]/10 text-[#008080]"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Clinic Activity Stats */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col justify-between min-h-0">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <h4 className="text-gray-800 font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-gray-100 flex-none">
              <Activity className="size-4.5 text-[#008080]" />
              Clinic Activity
            </h4>

            {/* List block */}
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0 scrollbar-none pt-1">
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="size-7 bg-[#008080]/10 text-[#008080] rounded-lg flex items-center justify-center shrink-0">
                    <UserCheck className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold leading-none">Active Dentists</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 leading-none">5 / 7</p>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-green-500 uppercase leading-none">On duty</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="size-7 bg-[#008080]/10 text-[#008080] rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold leading-none">Occupancy Rate</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 leading-none">82%</p>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-[#008080] uppercase leading-none">+8% vs wk</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-center flex-none">
            <a
              href="/admin/bookings"
              className="text-[10px] text-[#008080] font-bold hover:underline inline-flex items-center gap-1 leading-none"
            >
              Manage all schedules
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
