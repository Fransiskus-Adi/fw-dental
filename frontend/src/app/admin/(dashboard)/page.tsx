"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CalendarDays,
  UserCheck,
  Loader2
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { useAdminAccess } from "@/lib/admin-access-context";
import { staffFetch } from "@/lib/staff-fetch";

export default function AdminDashboard() {
  const { can } = useAdminAccess();
  const [activeTab, setActiveTab] = useState("1Y");
  const [globalFilter, setGlobalFilter] = useState("year");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await staffFetch("/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load dashboard statistics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num).replace(/\s/g, "");
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  };

  const formatShortAmount = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return Math.round(val).toString();
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border border-gray-150 py-20">
        <Loader2 className="size-10 text-[#008080] animate-spin" />
        <p className="text-sm text-gray-500 font-bold mt-4 select-none">Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-red-100 p-8 text-center">
        <p className="text-red-500 font-semibold mb-2">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-[#008080] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-all animate-scale-up"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Get active statistics source based on globalFilter selection
  const statsSource = data?.[globalFilter] || data?.year || {};

  const stats = {
    balance: formatCurrency(statsSource.balance ?? 0),
    customers: formatNumber(statsSource.customers ?? 0),
    customersGrowth: statsSource.customersGrowth ?? "0.0%",
    orders: formatNumber(statsSource.orders ?? 0),
    ordersGrowth: statsSource.ordersGrowth ?? "0.0%",
    earnings: formatCurrency(statsSource.earnings ?? 0),
  };

  const showMetrics = !!data?.clinicActivity;
  const showAppointments = Array.isArray(data?.upcomingAppointments);
  const upcomingAppointments = data?.upcomingAppointments || [];
  
  // Chart calculation
  const points = data?.chartData?.[activeTab] || [];
  const maxEarnings = Math.max(...points.map((p: any) => p.earnings), 0);
  const divisor = maxEarnings > 0 ? maxEarnings : 1;

  // Generate SVG coordinates (viewBox width: 900, height: 170)
  const coords = points.map((p: any, idx: number) => {
    const x = points.length > 1 ? idx * (900 / (points.length - 1)) : 450;
    const y = 140 - (p.earnings / divisor) * (140 - 20); // Y ranges from 20 to 140
    return { x, y };
  });

  const linePath = coords.length > 0
    ? `M ${coords.map((c: any) => `${c.x} ${c.y}`).join(" L ")}`
    : "";

  const areaPath = coords.length > 0
    ? `M 0 170 L ${coords.map((c: any) => `${c.x} ${c.y}`).join(" L ")} L 900 170 Z`
    : "";

  const yAxisLabels = [
    formatShortAmount(maxEarnings),
    formatShortAmount(maxEarnings * 0.8),
    formatShortAmount(maxEarnings * 0.6),
    formatShortAmount(maxEarnings * 0.4),
    formatShortAmount(maxEarnings * 0.2),
    "0"
  ];

  const getGrowthLabel = () => {
    if (globalFilter === "today") return "vs yesterday";
    if (globalFilter === "week") return "vs last week";
    if (globalFilter === "month") return "vs last month";
    return "vs last year";
  };

  const getBalanceCardTitle = () => {
    if (globalFilter === "today") return "Earnings Today";
    if (globalFilter === "week") return "Earnings This Week";
    if (globalFilter === "month") return "Earnings This Month";
    return "Current Balance";
  };

  return (
    <div className="flex flex-col gap-4 font-sans lg:h-full lg:overflow-hidden min-h-0">
      
      {/* Title Header with Global Filter */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight leading-none">
            Dashboard Home
          </h2>
          <p className="text-[11px] text-gray-400 font-bold mt-1.5 uppercase tracking-wide">
            Real-time clinic metrics & statistics
          </p>
        </div>
        {showMetrics && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider select-none">
              Global Filter:
            </span>
            <CustomSelect
              value={globalFilter}
              onChange={setGlobalFilter}
              options={[
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
                { value: "year", label: "This Year / Overall" }
              ]}
            />
          </div>
        )}
      </div>

      {showMetrics && (<>
        {/* Top Cards Row - Fixed height */}
        <div className="flex-none grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[115px]">

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
                  {getBalanceCardTitle()}
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
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                stats.customersGrowth.startsWith("-")
                  ? "bg-red-50 text-red-550"
                  : "bg-green-50 text-[#10b981]"
              }`}>
                {stats.customersGrowth}
              </span>
              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                {getGrowthLabel()}
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
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                stats.ordersGrowth.startsWith("-")
                  ? "bg-red-50 text-red-550"
                  : "bg-green-50 text-[#10b981]"
              }`}>
                {stats.ordersGrowth}
              </span>
              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                {getGrowthLabel()}
              </span>
            </div>
          </div>

        </div>

        {/* Large Earnings Chart Card - Responsive Flex */}
        <div className="order-2 flex-[1.2] min-h-0 bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col lg:order-none">
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
          <div className="flex-1 min-h-40 lg:min-h-0 relative w-full flex mt-3">
            {/* Main Chart Area */}
            <div className="flex-1 h-full pr-10 relative min-h-0">
              {coords.length > 0 ? (
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
                  <path d={areaPath} fill="url(#chartAreaGradient)" />

                  {/* Curve Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#008080"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Data points dots */}
                  {coords.map((c: any, idx: number) => (
                    <circle
                      key={idx}
                      cx={c.x}
                      cy={c.y}
                      r="3.5"
                      fill="#008080"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-semibold select-none">
                  No transaction data for this period
                </div>
              )}
            </div>

            {/* Y Axis Labels (Right Aligned as in image) */}
            <div className="absolute right-0 top-0 bottom-0 w-8 flex flex-col justify-between text-right text-[9px] text-gray-400 font-bold select-none h-[140px] mt-[10px]">
              {yAxisLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[10px] text-gray-400 font-bold px-2 mt-1 select-none pr-10 flex-none border-t border-gray-50 pt-1">
            {points.map((p: any, idx: number) => {
              const showLabel =
                points.length <= 12 ||
                idx === 0 ||
                idx === points.length - 1 ||
                idx % Math.ceil(points.length / 6) === 0;

              return (
                <span
                  key={idx}
                  className={showLabel ? "text-gray-400" : "invisible"}
                >
                  {p.label}
                </span>
              );
            })}
          </div>
        </div>
      </>)}
      {/* Grid of secondary statistics - Resized to fit screen */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {showAppointments && (<>
          {/* Appointments Table - Takes remaining height, scrollable table body */}
          <div className={`${showMetrics ? "lg:col-span-8" : "lg:col-span-12"} bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col min-h-0`}>
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
              {upcomingAppointments.length > 0 ? (
                <table role="table" className="mobile-records w-full text-left border-collapse text-xs">
                  <thead role="rowgroup">
                    <tr role="row" className="text-gray-400 font-semibold border-b border-gray-50 sticky top-0 bg-white">
                      <th role="columnheader" scope="col" className="pb-2 pr-2">Patient</th>
                      <th role="columnheader" scope="col" className="pb-2 px-2">Doctor</th>
                      <th role="columnheader" scope="col" className="pb-2 px-2">Time</th>
                      <th role="columnheader" scope="col" className="pb-2 px-2">Treatment</th>
                      <th role="columnheader" scope="col" className="pb-2 pl-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup" className="divide-y divide-gray-50/50">
                    {upcomingAppointments.map((app: any) => (
                      <tr role="row" key={app.id} className="hover:bg-gray-50/30 transition-colors">
                        <td role="cell" className="py-2 pr-2 font-bold text-gray-800">{app.patient}</td>
                        <td role="cell" data-label="Doctor" className="py-2 px-2 text-gray-500 font-medium">{app.doctor}</td>
                        <td role="cell" data-label="Time" className="py-2 px-2 text-gray-500 font-semibold">{app.time}</td>
                        <td role="cell" data-label="Treatment" className="py-2 px-2 text-gray-500 font-medium">{app.treatment}</td>
                        <td role="cell" data-label="Status" className="py-2 pl-2 text-right">
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
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-semibold py-8 select-none">
                  No appointments booked for today.
                </div>
              )}
            </div>
          </div>
        </>)}
        {showMetrics && (<>
          {/* Quick Clinic Activity Stats */}
          <div className={`${showAppointments ? "lg:col-span-4" : "lg:col-span-12"} bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col justify-between min-h-0`}>
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
                      <p className="text-sm font-bold text-gray-800 mt-0.5 leading-none">
                        {data?.clinicActivity?.activeDentists ?? 0} / {data?.clinicActivity?.totalDentists ?? 0}
                      </p>
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
                      <p className="text-sm font-bold text-gray-800 mt-0.5 leading-none">
                        {data?.clinicActivity?.occupancyRate ?? 0}%
                      </p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-bold uppercase leading-none ${
                    (data?.clinicActivity?.occupancyRateGrowth ?? "").startsWith("-")
                      ? "text-red-500"
                      : "text-[#008080]"
                  }`}>
                    {data?.clinicActivity?.occupancyRateGrowth ?? "0% vs wk"}
                  </span>
                </div>
              </div>
            </div>

            {can("page_bookings") && <div className="pt-2 border-t border-gray-100 text-center flex-none">
              <a
                href="/admin/bookings"
                className="text-[10px] text-[#008080] font-bold hover:underline inline-flex items-center gap-1 leading-none"
              >
                Manage bookings
                <ArrowUpRight className="size-3" />
              </a>
            </div>}
          </div>
        </>)}
      </div>
    </div>
  );
}
