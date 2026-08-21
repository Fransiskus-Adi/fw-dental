"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Plus,
  User,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Booking {
  id: string | number;
  patientName: string;
  phone: string;
  doctorName: string;
  date: string;
  time: string;
  treatment: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newTreatment, setNewTreatment] = useState("");

  const mapBackendBooking = (b: any): Booking => ({
    id: b.id,
    patientName: b.patient ? b.patient.fullName : "Unknown",
    phone: b.patient ? b.patient.phoneNumber : "",
    doctorName: b.doctor ? b.doctor.name : "Unassigned",
    date: b.bookingDate,
    time: b.startTime,
    treatment: b.service ? b.service.name : "Unknown",
    status: b.statusCode ? (b.statusCode.charAt(0) + b.statusCode.slice(1).toLowerCase()) as any : "Pending",
  });

  const fetchBookings = () => {
    fetch("http://localhost:3001/bookings")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch bookings");
        return res.json();
      })
      .then(data => {
        setBookings(data.map(mapBackendBooking));
      })
      .catch(err => console.error("Error loading bookings:", err));
  };

  useEffect(() => {
    fetchBookings();

    fetch("http://localhost:3001/services")
      .then(res => res.json())
      .then(data => {
        setServices(data);
        if (data.length > 0) {
          setNewTreatment(data[0].id);
        }
      })
      .catch(err => console.error("Error loading services:", err));
  }, []);

  // Booking status changes
  const updateStatus = async (id: string | number, status: Booking["status"]) => {
    try {
      const res = await fetch(`http://localhost:3001/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: status.toUpperCase() }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  // Add booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient || !newPhone || !newDate || !newTime || !newTreatment) return;

    try {
      const res = await fetch("http://localhost:3001/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPatient,
          phone: newPhone,
          serviceId: newTreatment,
          date: newDate,
          time: newTime,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to schedule appointment");
      }

      setIsModalOpen(false);
      fetchBookings();

      // Reset Form
      setNewPatient("");
      setNewPhone("");
      setNewDate("");
      setNewTime("");
      if (services.length > 0) {
        setNewTreatment(services[0].id);
      }
    } catch (err: any) {
      alert(err.message || "Error scheduling appointment");
    }
  };

  // Filters
  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Bookings</h2>
          <p className="text-sm text-gray-400 font-medium">Manage and review dental appointments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
        >
          <Plus className="size-4" />
          Add Booking
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between">
        
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 rounded-xl max-w-fit select-none">
          {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? "bg-[#008080] text-white shadow-2xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, doctor or treatment"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-xl text-xs transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Bookings List Card */}
      <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-100">
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-4">Treatment</th>
                  <th className="py-4 px-4">Dentist</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Patient Info */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{b.patientName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" />
                            {b.phone}
                          </p>
                        </div>
                      </td>
                      
                      {/* Treatment */}
                      <td className="py-4 px-4 text-gray-600 font-medium">{b.treatment}</td>
                      
                      {/* Dentist */}
                      <td className="py-4 px-4 text-gray-600 font-medium">{b.doctorName}</td>
                      
                      {/* Date & Time */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-700">{b.date}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            {b.time}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            b.status === "Confirmed"
                              ? "bg-[#008080]/10 text-[#008080]"
                              : b.status === "Completed"
                              ? "bg-green-50 text-green-600"
                              : b.status === "Cancelled"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {b.status === "Confirmed" && <Check className="size-3" />}
                          {b.status === "Completed" && <CheckCircle className="size-3" />}
                          {b.status === "Cancelled" && <XCircle className="size-3" />}
                          {b.status === "Pending" && <AlertCircle className="size-3" />}
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === "Pending" && (
                            <>
                              <button
                                onClick={() => updateStatus(b.id, "Confirmed")}
                                className="size-8 bg-[#008080]/10 hover:bg-[#008080]/20 text-[#008080] rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                title="Confirm Appointment"
                              >
                                <Check className="size-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(b.id, "Cancelled")}
                                className="size-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                title="Cancel Appointment"
                              >
                                <X className="size-4" />
                              </button>
                            </>
                          )}
                          {b.status === "Confirmed" && (
                            <>
                              <button
                                onClick={() => updateStatus(b.id, "Completed")}
                                className="size-8 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                title="Mark Completed"
                              >
                                <CheckCircle className="size-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(b.id, "Cancelled")}
                                className="size-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                title="Cancel Appointment"
                              >
                                <X className="size-4" />
                              </button>
                            </>
                          )}
                          {(b.status === "Completed" || b.status === "Cancelled") && (
                            <span className="text-xs text-gray-300 select-none pr-2">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                      No bookings found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Booking Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          {/* Modal Container */}
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Add New Appointment</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Patient Name</label>
                  <Input
                    required
                    placeholder="e.g. Clark Kent"
                    value={newPatient}
                    onChange={e => setNewPatient(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Phone Number</label>
                  <Input
                    required
                    placeholder="e.g. +62 8..."
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Dentist Assignment</label>
                  <Input
                    disabled
                    value="Auto-Assigned by Schedule"
                    className="h-10 border-gray-200 rounded-xl bg-gray-50 text-gray-500 select-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Treatment</label>
                  <select
                    value={newTreatment}
                    onChange={e => setNewTreatment(e.target.value)}
                    className="w-full h-10 border border-gray-200 rounded-xl text-sm px-3 bg-transparent outline-none focus:border-[#008080]"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Appointment Date</label>
                  <Input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Appointment Time</label>
                  <Input
                    type="time"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl"
                  />
                </div>
              </div>

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
                  className="h-10 px-5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-sm font-semibold transition-all shadow-md shadow-teal-100 cursor-pointer"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
