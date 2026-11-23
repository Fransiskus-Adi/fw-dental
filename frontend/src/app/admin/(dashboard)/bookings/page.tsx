"use client";

import { AdminDialog } from "@/components/admin-dialog";

import { useAdminAccess } from "@/lib/admin-access-context";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { staffFetch } from "@/lib/staff-fetch";

interface Booking {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  date: string;
  time: string;
  treatment: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  sourceCode: string;
  hasTransaction: boolean;
  patientId: string;
  doctorId: string;
  serviceId: string;
  servicePrice: number;
}

interface BackendBooking {
  id: string;
  patient?: { fullName: string; phoneNumber: string };
  doctor?: { name: string };
  service?: { name: string; priceFrom: string | number };
  bookingDate: string;
  startTime: string;
  statusCode?: string;
  sourceCode?: string;
  transactions?: { deleted: number }[];
  patientId: string;
  doctorId: string;
  serviceId: string;
}

const mapBackendBooking = (b: BackendBooking): Booking => ({
  id: b.id,
  patientName: b.patient ? b.patient.fullName : "Unknown",
  phone: b.patient ? b.patient.phoneNumber : "",
  doctorName: b.doctor ? b.doctor.name : "Unassigned",
  date: b.bookingDate,
  time: b.startTime,
  treatment: b.service ? b.service.name : "Unknown",
  status: b.statusCode ? (b.statusCode.charAt(0) + b.statusCode.slice(1).toLowerCase()) as Booking["status"] : "Pending",
  sourceCode: b.sourceCode || "WEBSITE",
  hasTransaction: b.transactions ? b.transactions.some((tx) => tx.deleted === 0) : false,
  patientId: b.patientId,
  doctorId: b.doctorId,
  serviceId: b.serviceId,
  servicePrice: b.service ? Number(b.service.priceFrom) || 0 : 0,
});

export default function AdminBookingsPage() {
  const { can } = useAdminAccess();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingLoad, setBookingLoad] = useState<"loading" | "ready" | "error">("loading");
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newTreatment, setNewTreatment] = useState("");

  const loadBookings = useCallback(() => {
    staffFetch("/bookings")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch bookings");
        return res.json();
      })
      .then(data => {
        setBookings(data.map(mapBackendBooking));
        setBookingLoad("ready");
      })
      .catch(() => setBookingLoad("error"));
  }, []);

  const fetchBookings = () => {
    setBookingLoad("loading");
    loadBookings();
  };

  useEffect(() => {
    loadBookings();

    fetch("/api/clinic/services")
      .then(res => res.json())
      .then(data => {
        setServices(data);
        if (data.length > 0) {
          setNewTreatment(data[0].id);
        }
      })
      .catch(err => console.error("Error loading services:", err));
  }, [loadBookings]);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [checkoutPrice, setCheckoutPrice] = useState<number>(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("CASH");
  const [checkoutPaymentStatus, setCheckoutPaymentStatus] = useState("PAID");
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  const handleOpenCheckout = (booking: Booking) => {
    setCheckoutBooking(booking);
    setCheckoutPrice(booking.servicePrice);
    setCheckoutPaymentMethod("CASH");
    setCheckoutPaymentStatus("PAID");
    setCheckoutDiscount(0);
    setCheckoutNotes("");
    setCheckoutError("");
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutBooking || submittingCheckout) return;
    setSubmittingCheckout(true);
    setCheckoutError("");

    try {
      const itemPrice = Number(checkoutPrice) || 0;
      const discountVal = Number(checkoutDiscount) || 0;
      const transactionPayload = {
        discount: discountVal,
        paymentMethod: checkoutPaymentMethod,
        paymentStatus: checkoutPaymentStatus,
        transactionDate: new Date().toISOString().split("T")[0],
        notes: checkoutNotes || undefined,
        items: [
          {
            serviceId: checkoutBooking.serviceId,
            name: checkoutBooking.treatment,
            price: itemPrice,
            quantity: 1,
          },
        ],
      };

      const txRes = await staffFetch(`/transactions/booking-checkout/${checkoutBooking.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionPayload),
      });

      if (!txRes.ok) {
        const errData = await txRes.json();
        throw new Error(errData.message || "Failed to create transaction");
      }

      alert("Transaction created and booking completed successfully!");
      setIsCheckoutOpen(false);
      fetchBookings();
    } catch (err) {
      setCheckoutError(err instanceof TypeError
        ? "Connection interrupted. Reconnect and submit again to recover this checkout."
        : err instanceof Error ? err.message : "Could not complete checkout. Please try again.");
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Booking status changes
  const updateStatus = async (id: string | number, status: Booking["status"]) => {
    try {
      const res = await staffFetch(`/bookings/${id}/status`, {
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
      const res = await staffFetch("/bookings/staff", {
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
    } catch (err) {
      alert((err instanceof Error && err.message) || "Error scheduling appointment");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Bookings</h2>
          <p className="text-sm text-gray-400 font-medium">Manage and review dental appointments</p>
        </div>
        {can("feat_bookings_create") && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
        >
          <Plus className="size-4" />
          Add Booking
        </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between">
        
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 rounded-xl max-w-fit select-none">
          {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(tab => (
            <button
              key={tab}
              aria-pressed={statusFilter === tab}
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
            type="search"
            aria-label="Search bookings"
            placeholder="Search name, doctor or treatment"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-xl text-xs transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Bookings List Card */}
      {bookingLoad === "error" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">Could not load bookings. <button type="button" className="font-semibold underline" onClick={fetchBookings}>Retry</button></p>}
      <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table role="table" className="mobile-records w-full text-left border-collapse text-sm">
              <thead role="rowgroup">
                <tr role="row" className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-100">
                  <th role="columnheader" scope="col" className="py-4 px-6">Patient</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Treatment</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Dentist</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Date & Time</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Status</th>
                  <th role="columnheader" scope="col" className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-gray-50/50">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map(b => (
                    <tr role="row" key={b.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Patient Info */}
                      <td role="cell" className="py-4 px-6">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{b.patientName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" />
                            {b.phone}
                          </p>
                        </div>
                      </td>
                      
                      {/* Treatment */}
                      <td role="cell" data-label="Treatment" className="py-4 px-4 text-gray-600 font-medium">{b.treatment}</td>
                      
                      {/* Dentist */}
                      <td role="cell" data-label="Dentist" className="py-4 px-4 text-gray-600 font-medium">{b.doctorName}</td>
                      
                      {/* Date & Time */}
                      <td role="cell" data-label="Date & time" className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-700">{b.date}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            {b.time}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td role="cell" data-label="Status" className="py-4 px-4">
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
                      <td role="cell" data-label="Actions" className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {can("feat_bookings_status") && b.status === "Pending" && (
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
                          {can("feat_bookings_status") && b.status === "Confirmed" && (
                            <>
                              {b.sourceCode === "WEBSITE" && !b.hasTransaction ? (
                                can("feat_transactions_create") && (
                                <button
                                  onClick={() => handleOpenCheckout(b)}
                                  className="size-8 bg-teal-50 hover:bg-teal-100 text-teal-650 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                  title="Checkout & Create Transaction"
                                >
                                  <CreditCard className="size-4" />
                                </button>
                                )
                              ) : (
                                <button
                                  onClick={() => updateStatus(b.id, "Completed")}
                                  className="size-8 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                  title="Mark Completed"
                                >
                                  <CheckCircle className="size-4" />
                                </button>
                              )}
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
                  <tr role="row">
                    <td role="cell" colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                      {bookingLoad === "loading" ? "Loading bookings…" : bookingLoad === "error" ? "Bookings unavailable." : "No bookings found matching filters."}
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
        <AdminDialog label="Add new appointment" onClose={() => setIsModalOpen(false)} className="admin-overlay fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
                <div className="space-y-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Treatment</label>
                  <CustomSelect
                    value={newTreatment}
                    onChange={setNewTreatment}
                    options={services.map(s => ({ value: s.id, label: s.name }))}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                  />
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
        </AdminDialog>
      )}

      {/* Checkout & Complete Booking Modal Backdrop */}
      {isCheckoutOpen && checkoutBooking && (
        <AdminDialog label="Booking checkout" onClose={submittingCheckout ? undefined : () => setIsCheckoutOpen(false)} className="admin-overlay fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          {/* Modal Container */}
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Checkout & Create Transaction</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                disabled={submittingCheckout}
                aria-label="Close checkout"
                className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
              {checkoutError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{checkoutError}</p>}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 font-semibold block">Patient Name</span>
                    <span className="font-bold text-gray-700">{checkoutBooking.patientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Phone Number</span>
                    <span className="font-bold text-gray-700">{checkoutBooking.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Dentist Assignment</span>
                    <span className="font-bold text-gray-700">{checkoutBooking.doctorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Treatment</span>
                    <span className="font-bold text-gray-700">{checkoutBooking.treatment}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Payment Method</label>
                  <CustomSelect
                    value={checkoutPaymentMethod}
                    onChange={setCheckoutPaymentMethod}
                    options={[
                      { value: "CASH", label: "CASH" },
                      { value: "DEBIT_CARD", label: "DEBIT CARD" },
                      { value: "CREDIT_CARD", label: "CREDIT CARD" },
                      { value: "QRIS", label: "QRIS / SCAN MOCK" },
                      { value: "BANK_TRANSFER", label: "BANK TRANSFER" }
                    ]}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-xs font-medium text-gray-700"
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Payment Status</label>
                  <CustomSelect
                    value={checkoutPaymentStatus}
                    onChange={setCheckoutPaymentStatus}
                    options={[
                      { value: "PAID", label: "PAID" },
                      { value: "UNPAID", label: "UNPAID (Pending Ledger)" }
                    ]}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-xs font-medium text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Price (IDR)</label>
                  <Input
                    type="number"
                    min="0"
                    value={checkoutPrice}
                    onChange={(e) =>
                      setCheckoutPrice(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="h-10 border-gray-200 rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Discount (Rp)</label>
                  <Input
                    type="number"
                    min="0"
                    value={checkoutDiscount}
                    onChange={(e) =>
                      setCheckoutDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="h-10 border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Internal Notes</label>
                <textarea
                  placeholder="e.g. Patient paid via QRIS. Happy with the service."
                  rows={2}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:border-[#008080]"
                />
              </div>

              {/* Totals Summary */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(checkoutPrice)}
                  </span>
                </div>
                {checkoutDiscount > 0 && (
                  <div className="flex items-center justify-between text-red-500">
                    <span>Discount</span>
                    <span className="font-bold">
                      -
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(checkoutDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-500">
                  <span>Tax (11%)</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(
                      Math.round(Math.max(0, checkoutPrice - checkoutDiscount) * 0.11),
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 font-bold text-gray-800">
                  <span>Grand Total</span>
                  <span className="text-[#008080] font-extrabold text-sm">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(
                      Math.max(0, checkoutPrice - checkoutDiscount) +
                        Math.round(
                          Math.max(0, checkoutPrice - checkoutDiscount) * 0.11,
                        ),
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100 mt-6 font-semibold">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm font-semibold cursor-pointer"
                  disabled={submittingCheckout}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-sm font-semibold transition-all shadow-md shadow-teal-100 cursor-pointer flex items-center gap-2"
                  disabled={submittingCheckout}
                >
                  {submittingCheckout ? "Processing..." : "Complete & Pay"}
                </button>
              </div>
            </form>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
