"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Mail,
  Phone,
  Clock,
  Star,
  X,
  Stethoscope,
  Edit2,
  Trash2,
  Loader2,
  CalendarDays
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  shiftStart: string;
  shiftEnd: string;
  status: string;
  appointmentsCount: number;
  rating: number;
  days?: string[];
}

export default function DoctorsTab() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("Orthodontist Specialist");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [status, setStatus] = useState("Active");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/doctors");
      if (!res.ok) throw new Error("Failed to load doctors");
      const data = await res.json();
      setDoctors(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedId(null);
    setName("");
    setSpecialty("Orthodontist Specialist");
    setEmail("");
    setPhone("");
    setShiftStart("09:00");
    setShiftEnd("17:00");
    setStatus("Active");
    setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: Doctor) => {
    setModalMode("edit");
    setSelectedId(doc.id);
    setName(doc.name);
    setSpecialty(doc.specialty);
    setEmail(doc.email);
    setPhone(doc.phone);
    setShiftStart(doc.shiftStart);
    setShiftEnd(doc.shiftEnd);
    setStatus(doc.status);
    setSelectedDays(doc.days || []);
    setIsModalOpen(true);
  };

  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [hourStr, minStr] = timeStr.split(":");
      const hours = parseInt(hourStr);
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, "0")}:${minStr} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    setSubmitLoading(true);
    try {
      const formattedName = name.startsWith("Dr. ") ? name : `Dr. ${name}`;
      const payload = {
        name: formattedName,
        specialty,
        email,
        phone,
        shiftStart,
        shiftEnd,
        status,
        days: selectedDays
      };

      const url = modalMode === "add" 
        ? "http://localhost:3001/doctors" 
        : `http://localhost:3001/doctors/${selectedId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save doctor");
      }

      setIsModalOpen(false);
      fetchDoctors();
    } catch (err: any) {
      alert(err.message || "Failed to save doctor");
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleStatus = async (doc: Doctor) => {
    const newStatus = doc.status === "Active" ? "On Leave" : "Active";
    try {
      const res = await fetch(`http://localhost:3001/doctors/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      setDoctors(prev =>
        prev.map(d => (d.id === doc.id ? { ...d, status: newStatus } : d))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete doctor "${docName}"?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/doctors/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete doctor");
      fetchDoctors();
    } catch (err: any) {
      alert(err.message || "Failed to delete doctor");
    }
  };

  const filteredDoctors = doctors.filter(
    d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctor by name or specialty"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-xl text-xs transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-gray-400 font-bold select-none whitespace-nowrap">
            Total Doctors: {doctors.length}
          </span>
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Main Listing View */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="size-8 text-[#008080] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-red-100 text-red-500 font-medium">
          {error}. <button onClick={fetchDoctors} className="underline font-bold text-[#008080]">Retry</button>
        </div>
      ) : filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doc => (
            <Card
              key={doc.id}
              className="bg-white border-none shadow-xs rounded-3xl overflow-hidden hover:shadow-md transition-shadow relative group"
            >
              <CardContent className="p-6 space-y-5">
                {/* Header Profile */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-[#008080]/10 border border-[#008080]/20 flex items-center justify-center text-[#008080]">
                      <Stethoscope className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">{doc.name}</h4>
                      <p className="text-xs text-[#008080] font-semibold mt-0.5">{doc.specialty}</p>
                    </div>
                  </div>
                  
                  {/* Status toggle button */}
                  <button
                    onClick={() => toggleStatus(doc)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all select-none cursor-pointer ${
                      doc.status === "Active"
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-red-50 text-red-500 hover:bg-red-100"
                    }`}
                    title="Click to toggle status"
                  >
                    {doc.status}
                  </button>
                </div>

                {/* Rating / Appts */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/50 rounded-2xl">
                  <div className="text-center border-r border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Appointments</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">{doc.appointmentsCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating</p>
                    <p className="text-lg font-bold text-gray-800 mt-1 flex items-center justify-center gap-1">
                      {parseFloat(doc.rating.toString()).toFixed(1)}
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    </p>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-2.5 text-xs font-semibold text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-gray-400 shrink-0" />
                    <span>Shift: {formatTimeDisplay(doc.shiftStart)} - {formatTimeDisplay(doc.shiftEnd)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-gray-400 shrink-0" />
                    <span className="truncate">
                      Days: {doc.days && doc.days.length > 0
                        ? doc.days.map(d => d.slice(0, 3)).join(", ")
                        : "None"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-gray-400 shrink-0" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-gray-400 shrink-0" />
                    <span>{doc.phone}</span>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-semibold">Available for booking</span>
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(doc)}
                      className="size-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Doctor"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="size-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete Doctor"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400 font-medium">
          No doctors found.
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {modalMode === "add" ? "Register New Dentist" : "Edit Dentist Details"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Doctor Full Name</label>
                <Input
                  required
                  placeholder="e.g. Brenda Lestari"
                  value={name.replace(/^Dr\.\s+/, "")} // Strip Dr. prefix from editing input for cleanliness
                  onChange={e => setName(e.target.value)}
                  className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Specialty & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Specialization</label>
                  <CustomSelect
                    value={specialty}
                    onChange={setSpecialty}
                    options={[
                      { value: "Orthodontist Specialist", label: "Orthodontist Specialist" },
                      { value: "Pediatric Dentist", label: "Pediatric Dentist" },
                      { value: "Oral & Maxillofacial Surgeon", label: "Oral & Maxillofacial Surgeon" },
                      { value: "Periodontist (Gum Specialist)", label: "Periodontist (Gum Specialist)" },
                      { value: "General Dentist", label: "General Dentist" }
                    ]}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Phone Contact</label>
                  <Input
                    required
                    placeholder="e.g. +62 812-4444-2222"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Email Address</label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. brenda@fwdental.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Working Days */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Working Days</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setSelectedDays(prev =>
                            prev.includes(day)
                              ? prev.filter(d => d !== day)
                              : [...prev, day]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#008080] text-white border-[#008080] shadow-xs"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shift hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Shift Start</label>
                  <Input
                    type="time"
                    required
                    value={shiftStart}
                    onChange={e => setShiftStart(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Shift End</label>
                  <Input
                    type="time"
                    required
                    value={shiftEnd}
                    onChange={e => setShiftEnd(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Selector (If Editing) */}
              {modalMode === "edit" && (
                <div className="space-y-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Status</label>
                  <CustomSelect
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "Active", label: "Active" },
                      { value: "On Leave", label: "On Leave" }
                    ]}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="h-10 px-5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-sm font-semibold transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {submitLoading && <Loader2 className="size-4 animate-spin" />}
                  {modalMode === "add" ? "Register Dentist" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
