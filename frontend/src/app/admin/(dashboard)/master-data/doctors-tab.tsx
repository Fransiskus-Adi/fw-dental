"use client";

import { AdminDialog } from "@/components/admin-dialog";

import { useAdminAccess } from "@/lib/admin-access-context";
import { staffFetch } from "@/lib/staff-fetch";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MasterDataTable, RecordActions } from "./master-data-table";
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
  const { can } = useAdminAccess();
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
      const res = await staffFetch("/doctors");
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
        ? "/doctors"
        : `/doctors/${selectedId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await staffFetch(url, {
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
      const res = await staffFetch(`/doctors/${doc.id}`, {
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
      const res = await staffFetch(`/doctors/${id}`, {
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
          {can("feat_doctors_write") && (
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Doctor
          </button>
          )}
        </div>
      </div>

      <MasterDataTable
        label="Doctors"
        columns={["Doctor", "Contact", "Schedule", "Appointments", "Rating", "Status"]}
        loading={loading}
        error={error}
        empty={filteredDoctors.length === 0}
        onRetry={fetchDoctors}
      >
        {filteredDoctors.map(doc => (
          <tr role="row" key={doc.id} className="hover:bg-gray-50/60">
            <th role="rowheader" scope="row" className="min-w-40 text-gray-800">
              <div className="font-semibold">{doc.name}</div>
              <div className="mt-0.5 text-xs font-medium text-gray-500">{doc.specialty}</div>
            </th>
            <td role="cell" data-label="Contact" className="whitespace-nowrap">
              <div>{doc.email || "—"}</div>
              {doc.phone && <div className="mt-0.5 text-xs text-gray-500">{doc.phone}</div>}
            </td>
            <td role="cell" data-label="Schedule" className="whitespace-nowrap">
              <div>{formatTimeDisplay(doc.shiftStart)} – {formatTimeDisplay(doc.shiftEnd)}</div>
              <div className="mt-0.5 text-xs text-gray-500">
                {doc.days?.length ? doc.days.map(day => day.slice(0, 3)).join(", ") : "No days set"}
              </div>
            </td>
            <td role="cell" data-label="Appointments" className="tabular-nums">{doc.appointmentsCount ?? "—"}</td>
            <td role="cell" data-label="Rating" className="tabular-nums">{doc.rating == null ? "—" : Number(doc.rating).toFixed(1)}</td>
            <td role="cell" data-label="Status">
              <button
                type="button"
                disabled={!can("feat_doctors_write")}
                  onClick={() => toggleStatus(doc)}
                aria-label={`${doc.status}. Change status for ${doc.name}`}
                className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                  doc.status === "Active"
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {doc.status}
              </button>
            </td>
            <td role="cell" data-label="Actions">
              <RecordActions
                name={doc.name}
                onEdit={can("feat_doctors_write") ? () => handleOpenEditModal(doc) : undefined}
                onDelete={can("feat_doctors_delete") ? () => handleDelete(doc.id, doc.name) : undefined}
              />
            </td>
          </tr>
        ))}
      </MasterDataTable>

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <AdminDialog label="Dentist details" onClose={() => setIsModalOpen(false)} className="admin-overlay fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
        </AdminDialog>
      )}
    </div>
  );
}
