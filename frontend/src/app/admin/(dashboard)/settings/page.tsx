"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Clock,
  Bell,
  Sliders,
  Check,
  Building,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("clinic");
  const [successMsg, setSuccessMsg] = useState("");

  // Clinic profile states
  const [clinicName, setClinicName] = useState("FW Dental Clinic");
  const [clinicPhone, setClinicPhone] = useState("+62 21-8888-9999");
  const [clinicEmail, setClinicEmail] = useState("info@fwdental.com");
  const [clinicAddress, setClinicAddress] = useState("Jl. Jenderal Sudirman No. 45, Jakarta, Indonesia");
  
  // Settings switches
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [whatsappReminders, setWhatsappReminders] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  
  // System variables
  const [slotDuration, setSlotDuration] = useState("60");
  const [maxBookings, setMaxBookings] = useState("15");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("Settings updated successfully!");
    setTimeout(() => {
      setSuccessMsg("");
    }, 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Settings</h2>
          <p className="text-sm text-gray-400 font-medium">Configure dental clinic rules and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Tab Navigation */}
        <Card className="lg:col-span-3 bg-white border-none shadow-sm rounded-3xl overflow-hidden p-4">
          <CardContent className="p-0 flex flex-col gap-1.5 select-none">
            <button
              onClick={() => setActiveTab("clinic")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "clinic"
                  ? "bg-[#008080]/10 text-[#008080]"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <Building className="size-4 shrink-0" />
              Clinic Profile
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "rules"
                  ? "bg-[#008080]/10 text-[#008080]"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <Clock className="size-4 shrink-0" />
              Appointment Rules
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "preferences"
                  ? "bg-[#008080]/10 text-[#008080]"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <Sliders className="size-4 shrink-0" />
              System Preferences
            </button>
          </CardContent>
        </Card>

        {/* Right Side Settings Form */}
        <Card className="lg:col-span-9 bg-white border-none shadow-sm rounded-3xl p-6">
          <CardContent className="p-0">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Success Notification Bar */}
              {successMsg && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-xl border border-green-100 font-bold flex items-center gap-2">
                  <Check className="size-4" />
                  {successMsg}
                </div>
              )}

              {/* TAB 1: Clinic Profile Form */}
              {activeTab === "clinic" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-base pb-3 border-b border-gray-100 flex items-center gap-2">
                    <Building className="size-5 text-[#008080]" />
                    Clinic Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Clinic Name</label>
                      <Input
                        required
                        value={clinicName}
                        onChange={e => setClinicName(e.target.value)}
                        className="h-10 border-gray-200 rounded-xl font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          required
                          value={clinicPhone}
                          onChange={e => setClinicPhone(e.target.value)}
                          className="pl-9 h-10 border-gray-200 rounded-xl font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Official Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        type="email"
                        required
                        value={clinicEmail}
                        onChange={e => setClinicEmail(e.target.value)}
                        className="pl-9 h-10 border-gray-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Full Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 size-4 text-gray-400" />
                      <textarea
                        required
                        rows={3}
                        value={clinicAddress}
                        onChange={e => setClinicAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Appointment Booking Rules */}
              {activeTab === "rules" && (
                <div className="space-y-6">
                  <h3 className="font-bold text-gray-800 text-base pb-3 border-b border-gray-100 flex items-center gap-2">
                    <Clock className="size-5 text-[#008080]" />
                    Appointment Scheduler Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 flex flex-col">
                      <label className="text-xs font-semibold text-gray-500 mb-1">Default Appointment Slot Duration</label>
                      <CustomSelect
                        value={slotDuration}
                        onChange={setSlotDuration}
                        options={[
                          { value: "30", label: "30 Minutes" },
                          { value: "45", label: "45 Minutes" },
                          { value: "60", label: "60 Minutes (1 Hour)" },
                          { value: "90", label: "90 Minutes" }
                        ]}
                        triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Max Bookings Per Dentist Per Day</label>
                      <Input
                        type="number"
                        min="1"
                        value={maxBookings}
                        onChange={e => setMaxBookings(e.target.value)}
                        className="h-10 border-gray-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Switch Toggles */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-sm text-gray-800">Auto-Confirm Online Appointments</p>
                        <p className="text-xs text-gray-400 mt-0.5">Appointments requested online are auto-confirmed if slots are empty.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoConfirm}
                          onChange={e => setAutoConfirm(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008080]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-sm text-gray-800">Send Email Alerts & Reminders</p>
                        <p className="text-xs text-gray-400 mt-0.5">Patients will receive automated email schedules for confirmation.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailReminders}
                          onChange={e => setEmailReminders(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008080]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-sm text-gray-800">Accept Online Deposits / Payments</p>
                        <p className="text-xs text-gray-400 mt-0.5">Require downpayment validation on specific cosmetic treatments.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlinePayments}
                          onChange={e => setOnlinePayments(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008080]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: System Preferences */}
              {activeTab === "preferences" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-base pb-3 border-b border-gray-100 flex items-center gap-2">
                    <Sliders className="size-5 text-[#008080]" />
                    Portal Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 flex flex-col">
                      <label className="text-xs font-semibold text-gray-500 mb-1">Dashboard Theme</label>
                      <CustomSelect
                        value={theme}
                        onChange={setTheme}
                        options={[
                          { value: "light", label: "Light Theme (Default)" },
                          { value: "dark", label: "Dark Theme" },
                          { value: "system", label: "Follow System Preferences" }
                        ]}
                        triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                      />
                    </div>

                    <div className="space-y-1 flex flex-col">
                      <label className="text-xs font-semibold text-gray-500 mb-1">Portal Language</label>
                      <CustomSelect
                        value={language}
                        onChange={setLanguage}
                        options={[
                          { value: "en", label: "English (US)" },
                          { value: "id", label: "Indonesian (ID)" }
                        ]}
                        triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-sm font-semibold transition-all shadow-md shadow-teal-100 flex items-center gap-2 select-none cursor-pointer"
                >
                  <Save className="size-4" />
                  Save Changes
                </button>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
