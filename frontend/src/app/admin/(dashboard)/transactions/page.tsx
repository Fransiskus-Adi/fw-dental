"use client";

import { AdminDialog } from "@/components/admin-dialog";

import { useAdminAccess } from "@/lib/admin-access-context";

import React, { useState, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  Receipt,
  Trash2,
  Printer,
  CheckCircle,
  XCircle,
  CreditCard,
  PlusCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { staffFetch } from "@/lib/staff-fetch";

interface TransactionItem {
  id?: string;
  serviceId?: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice?: number;
}

interface Patient {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  patientCode: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface Service {
  id: string;
  name: string;
  priceFrom: string | number;
  priceTo: string | number;
}

interface Transaction {
  id: string;
  transactionCode: string;
  clinicId?: string;
  bookingId?: string;
  patientId: string;
  doctorId?: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  transactionDate: string;
  notes?: string;
  patient: Patient;
  doctor?: Doctor;
  items: TransactionItem[];
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const { can } = useAdminAccess();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // POS Checkout Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  // New Patient Form States
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");

  // Transaction Form States
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [checkoutItems, setCheckoutItems] = useState<TransactionItem[]>([
    { name: "", price: 0, quantity: 1 }
  ]);

  // View Receipt Modal States
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Patient Search State for Dropdown
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const fetchTransactions = useCallback(() => {
    return staffFetch("/transactions")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load transactions");
        setTransactions(await res.json());
      })
      .catch((err) => {
        console.error("Error fetching transactions:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchInitialData = useCallback(() => {
    return staffFetch("/bookings/patients")
      .then(async (patientsResponse) => {
        if (patientsResponse.ok) setPatients(await patientsResponse.json());

        const doctorsResponse = await staffFetch("/doctors");
        if (doctorsResponse.ok) setDoctors(await doctorsResponse.json());

        const servicesResponse = await fetch("/api/clinic/services");
        if (servicesResponse.ok) setServices(await servicesResponse.json());
      })
      .catch((err) => console.error("Error loading master data for POS:", err));
  }, []);

  useEffect(() => {
    void fetchTransactions();
    void fetchInitialData();
  }, [fetchTransactions, fetchInitialData]);

  // Subtotal Calculation for POS Form
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );
  const netAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(netAmount * 0.11);
  const totalAmount = netAmount + tax;

  // Add Item to Checkout List
  const addCheckoutItem = () => {
    setCheckoutItems([...checkoutItems, { name: "", price: 0, quantity: 1 }]);
  };

  // Remove Item from Checkout List
  const removeCheckoutItem = (index: number) => {
    if (checkoutItems.length === 1) {
      setCheckoutItems([{ name: "", price: 0, quantity: 1 }]);
    } else {
      setCheckoutItems(checkoutItems.filter((_, i) => i !== index));
    }
  };

  // Update specific Checkout Item field
  const updateCheckoutItem = <Field extends keyof TransactionItem>(index: number, field: Field, value: TransactionItem[Field]) => {
    const updated = [...checkoutItems];
    
    if (field === "serviceId") {
      const service = services.find(s => s.id === value);
      if (service) {
        updated[index] = {
          ...updated[index],
          serviceId: service.id,
          name: service.name,
          price: Number(service.priceFrom) || 0,
        };
      } else {
        // If Custom selected
        updated[index] = {
          ...updated[index],
          serviceId: undefined,
          name: "",
          price: 0,
        };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setCheckoutItems(updated);
  };

  // POS Checkout Submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNewPatient && !selectedPatientId) {
      alert("Please select a patient.");
      return;
    }

    if (isNewPatient && (!newPatientName || !newPatientPhone)) {
      alert("Please fill in patient Name and Phone.");
      return;
    }

    // Verify all item rows are filled
    const invalidItem = checkoutItems.find(item => !item.name || item.price < 0 || item.quantity <= 0);
    if (invalidItem) {
      alert("Please ensure all items have a name, non-negative price, and positive quantity.");
      return;
    }

    const payload = {
      patientId: isNewPatient ? undefined : selectedPatientId,
      patient: isNewPatient
        ? {
            fullName: newPatientName,
            phoneNumber: newPatientPhone,
            email: newPatientEmail || undefined,
          }
        : undefined,
      doctorId: selectedDoctorId || undefined,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      paymentMethod,
      paymentStatus,
      transactionDate,
      notes: notes || undefined,
      items: checkoutItems.map(item => ({
        serviceId: item.serviceId || undefined,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      }))
    };

    try {
      const res = await staffFetch("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create transaction");
      }

      setIsCheckoutOpen(false);
      setLoading(true);
      void fetchTransactions();
      fetchInitialData(); // Reload patients list
      resetCheckoutForm();
    } catch (err) {
      alert((err instanceof Error && err.message) || "Error submitting POS transaction.");
    }
  };

  const resetCheckoutForm = () => {
    setSelectedPatientId("");
    setIsNewPatient(false);
    setNewPatientName("");
    setNewPatientPhone("");
    setNewPatientEmail("");
    setSelectedDoctorId("");
    setPaymentMethod("CASH");
    setPaymentStatus("UNPAID");
    setDiscount(0);
    setNotes("");
    setPatientSearch("");
    setCheckoutItems([{ name: "", price: 0, quantity: 1 }]);
    setTransactionDate(new Date().toISOString().split("T")[0]);
  };

  // Update Status of transaction
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await staffFetch(`/transactions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update payment status");
      setLoading(true);
      void fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction ledger record?")) return;
    try {
      const res = await staffFetch(`/transactions/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete transaction");
      setLoading(true);
      void fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Error deleting record");
    }
  };

  // Search filter implementation
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      tx.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || tx.paymentStatus === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Filter patients list for autocomplete search
  const filteredPatients = patients.filter(p =>
    p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phoneNumber.includes(patientSearch)
  );

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans flex-1 flex flex-col overflow-hidden">
      
      {/* Print CSS override */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt-modal, #print-receipt-modal * {
            visibility: visible;
          }
          #print-receipt-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Transactions Ledger</h2>
          <p className="text-sm text-gray-400 font-medium">Manage POS sales, billing receipts, and payments</p>
        </div>
        {can("feat_transactions_create") && (
        <button
          onClick={() => {
            resetCheckoutForm();
            setIsCheckoutOpen(true);
          }}
          className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
        >
          <Plus className="size-4" />
          New Sale (POS)
        </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between shrink-0 no-print">
        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 rounded-xl max-w-fit select-none">
          {["All", "Paid", "Unpaid", "Cancelled"].map(tab => (
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
            aria-label="Search transactions"
            placeholder="Search invoice or patient name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-xl text-xs transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Transactions Table Card */}
      <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden flex-1 flex flex-col min-h-0 no-print">
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="overflow-y-auto flex-1">
            <table role="table" className="mobile-records w-full text-left border-collapse text-sm">
              <thead role="rowgroup">
                <tr role="row" className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-100 sticky top-0 bg-white z-10">
                  <th role="columnheader" scope="col" className="py-4 px-6">Invoice #</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Date</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Patient</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Doctor</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Method</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Total</th>
                  <th role="columnheader" scope="col" className="py-4 px-4">Status</th>
                  <th role="columnheader" scope="col" className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-gray-50/50">
                {loading ? (
                  <tr role="row">
                    <td role="cell" colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map(tx => (
                    <tr role="row" key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Code */}
                      <td role="cell" className="py-4 px-6 font-bold text-gray-800">{tx.transactionCode}</td>
                      
                      {/* Date */}
                      <td role="cell" data-label="Date" className="py-4 px-4 text-gray-600 font-medium">{tx.transactionDate}</td>
                      
                      {/* Patient */}
                      <td role="cell" data-label="Patient" className="py-4 px-4">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{tx.patient?.fullName}</p>
                          <p className="text-xs text-gray-400">{tx.patient?.phoneNumber}</p>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td role="cell" data-label="Doctor" className="py-4 px-4 text-gray-600 font-medium">
                        {tx.doctor?.name || <span className="text-gray-300">None</span>}
                      </td>

                      {/* Payment Method */}
                      <td role="cell" data-label="Method" className="py-4 px-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {tx.paymentMethod?.replace("_", " ") || "CASH"}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td role="cell" data-label="Total" className="py-4 px-4 font-bold text-gray-800">
                        {formatCurrency(tx.totalAmount)}
                      </td>

                      {/* Status */}
                      <td role="cell" data-label="Status" className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            tx.paymentStatus === "PAID"
                              ? "bg-green-50 text-green-600"
                              : tx.paymentStatus === "CANCELLED"
                              ? "bg-red-50 text-red-650"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {tx.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td role="cell" data-label="Actions" className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setIsReceiptOpen(true);
                            }}
                            className="size-8 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            title="Print / View Receipt"
                          >
                            <Printer className="size-4" />
                          </button>
                          {can("feat_transactions_status") && tx.paymentStatus === "UNPAID" && (
                            <>
                              <button
                                onClick={() => updateStatus(tx.id, "PAID")}
                                className="size-8 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="size-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(tx.id, "CANCELLED")}
                                className="size-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                title="Cancel Invoice"
                              >
                                <XCircle className="size-4" />
                              </button>
                            </>
                          )}
                          {can("feat_transactions_delete") && (
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="size-8 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="size-4" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr role="row">
                    <td role="cell" colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                      No transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* POS Checkout Modal */}
      {isCheckoutOpen && (
        <AdminDialog label="New sale" onClose={() => setIsCheckoutOpen(false)} className="admin-overlay fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl overflow-hidden border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-[#008080]" />
                <h3 className="font-bold text-gray-800">New POS Checkout Sale</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Patient Selection Row */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Patient Information</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPatient(!isNewPatient);
                      setSelectedPatientId("");
                      setNewPatientName("");
                      setNewPatientPhone("");
                      setNewPatientEmail("");
                      setPatientSearch("");
                    }}
                    className="text-xs font-bold text-[#008080] hover:text-[#006666] hover:underline cursor-pointer"
                  >
                    {isNewPatient ? "Select Existing Patient" : "+ Register New Patient"}
                  </button>
                </div>

                {!isNewPatient ? (
                  // Existing Patient Autocomplete Search
                  <div className="relative">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Search Patient</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          placeholder="Type patient name or phone number..."
                          value={patientSearch}
                          onChange={e => {
                            setPatientSearch(e.target.value);
                            setShowPatientDropdown(true);
                          }}
                          onFocus={() => setShowPatientDropdown(true)}
                          className="h-10 pl-9 border-gray-200 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    {showPatientDropdown && patientSearch && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPatientDropdown(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 divide-y divide-gray-50">
                          {filteredPatients.length > 0 ? (
                            filteredPatients.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatientId(p.id);
                                  setPatientSearch(`${p.fullName} (${p.phoneNumber})`);
                                  setShowPatientDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                              >
                                <div>
                                  <p className="font-bold text-gray-800">{p.fullName}</p>
                                  <p className="text-gray-400 mt-0.5">{p.phoneNumber}</p>
                                </div>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                                  {p.patientCode}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-xs text-gray-400 font-medium">
                              No patients found. Click Register New Patient above.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // New Patient Input fields
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Full Name *</label>
                      <Input
                        required={isNewPatient}
                        placeholder="e.g. Peter Parker"
                        value={newPatientName}
                        onChange={e => setNewPatientName(e.target.value)}
                        className="h-10 border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Phone Number *</label>
                      <Input
                        required={isNewPatient}
                        placeholder="e.g. +62 812..."
                        value={newPatientPhone}
                        onChange={e => setNewPatientPhone(e.target.value)}
                        className="h-10 border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Email Address (Optional)</label>
                      <Input
                        type="email"
                        placeholder="e.g. peter@parker.com"
                        value={newPatientEmail}
                        onChange={e => setNewPatientEmail(e.target.value)}
                        className="h-10 border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Assigned Doctor (Dentist)</label>
                  <CustomSelect
                    value={selectedDoctorId}
                    onChange={setSelectedDoctorId}
                    options={[
                      { value: "", label: "Select Doctor" },
                      ...doctors.map(d => ({ value: d.id, label: `${d.name} (${d.specialty})` }))
                    ]}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-xs font-medium text-gray-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Transaction Date</label>
                  <Input
                    type="date"
                    required
                    value={transactionDate}
                    onChange={e => setTransactionDate(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1">Initial Payment Status</label>
                  <CustomSelect
                    value={paymentStatus}
                    onChange={setPaymentStatus}
                    options={[
                      { value: "UNPAID", label: "UNPAID (Pending Ledger)" },
                      { value: "PAID", label: "PAID" },
                      { value: "CANCELLED", label: "CANCELLED" }
                    ]}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-xs font-medium text-gray-700"
                  />
                </div>
              </div>

              {/* Itemized Services Checkout Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Services & Treatment Items</span>
                  <button
                    type="button"
                    onClick={addCheckoutItem}
                    className="h-8 bg-[#008080]/10 hover:bg-[#008080]/15 text-[#008080] font-semibold text-xs rounded-lg px-3 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="size-3.5" />
                    Add Service / Item
                  </button>
                </div>

                {/* Items Grid */}
                <div className="space-y-3">
                  {checkoutItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-end gap-3 bg-gray-50/20 p-3 rounded-xl border border-gray-100">
                      
                      {/* Service Dropdown */}
                      <div className="flex-1 space-y-1 flex flex-col">
                        <label className="text-[10px] font-semibold text-gray-400 mb-0.5">Select Clinic Treatment</label>
                        <CustomSelect
                          value={item.serviceId || "custom"}
                          onChange={val => updateCheckoutItem(idx, "serviceId", val)}
                          options={[
                            { value: "custom", label: "-- Custom / Other Item (Medicine, Extra Fee) --" },
                            ...services.map(s => ({
                              value: s.id,
                              label: `${s.name} (Starts: ${formatCurrency(s.priceFrom)})`
                            }))
                          ]}
                          triggerClassName="w-full h-9 border-gray-200 rounded-lg text-xs font-medium text-gray-700 font-sans"
                        />
                      </div>

                      {/* Item Name (Editable if custom) */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400">Item / Service Name</label>
                        <Input
                          required
                          disabled={!!item.serviceId}
                          placeholder="e.g. Paracetamol, Consultation Fee"
                          value={item.name}
                          onChange={e => updateCheckoutItem(idx, "name", e.target.value)}
                          className="h-9 border-gray-200 rounded-lg text-xs bg-white disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      {/* Price */}
                      <div className="w-full md:w-32 space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400">Price (Rp)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.price}
                          onChange={e => updateCheckoutItem(idx, "price", parseFloat(e.target.value) || 0)}
                          className="h-9 border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-full md:w-20 space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400">Qty</label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => updateCheckoutItem(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="h-9 border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>

                      {/* Row Total */}
                      <div className="w-full md:w-28 space-y-1">
                        <span className="block text-[10px] font-semibold text-gray-400">Subtotal</span>
                        <div className="h-9 bg-gray-50 border border-gray-100 rounded-lg px-2.5 flex items-center justify-end text-xs font-bold text-gray-700 select-none">
                          {formatCurrency((item.price || 0) * (item.quantity || 1))}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeCheckoutItem(idx)}
                        className="size-9 bg-red-50 hover:bg-red-100 text-red-655 rounded-lg flex items-center justify-center transition-colors border border-red-100 cursor-pointer mb-0.5 shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom calculations and options */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                {/* Notes and Payment Method */}
                <div className="space-y-4">
                  <div className="space-y-1 flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1">Payment Method</label>
                    <CustomSelect
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={[
                        { value: "CASH", label: "CASH" },
                        { value: "DEBIT_CARD", label: "DEBIT CARD" },
                        { value: "CREDIT_CARD", label: "CREDIT CARD" },
                        { value: "QRIS", label: "QRIS / SCAN MOCK" },
                        { value: "BANK_TRANSFER", label: "BANK TRANSFER" }
                      ]}
                      triggerClassName="w-full h-10 border-gray-200 rounded-xl text-xs font-medium text-gray-700 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Internal Transaction Notes (Staff Only)</label>
                    <textarea
                      placeholder="e.g. Patient paid cash. Patient requested receipt printed."
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:border-[#008080]"
                    />
                  </div>
                </div>

                {/* Summary Totals Calculation */}
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Subtotal Items</span>
                    <span className="font-bold text-gray-700">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Discount (Rp)</label>
                    <Input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-8 w-32 text-right border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 text-xs text-gray-500 font-medium">
                    <span>Tax (11%)</span>
                    <span className="font-bold text-gray-700">{formatCurrency(tax)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-gray-800">Grand Total Amount</span>
                    <span className="text-lg font-extrabold text-[#008080]">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-sm font-semibold transition-all shadow-md shadow-teal-100 cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="size-4" />
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </AdminDialog>
      )}

      {/* Digital Receipt View Modal */}
      {isReceiptOpen && selectedTransaction && (
        <div className="admin-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            
            {/* Modal Actions Header - hidden on print */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-[#008080]" />
                <h3 className="font-bold text-gray-800">Invoice Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="h-8 bg-[#008080] hover:bg-[#006666] text-white rounded-lg px-3 transition-colors flex items-center gap-1 text-xs select-none cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setIsReceiptOpen(false)}
                  className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Print Body */}
            <div id="print-receipt-modal" className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1">
                <h4 className="text-lg font-extrabold text-gray-800 tracking-tight">FW DENTAL CLINIC</h4>
                <p className="text-xs text-gray-400 font-medium">123 Health Ave, Suite 400</p>
                <p className="text-xs text-gray-400 font-medium">Phone: +1 (555) 019-2834 | Email: info@fwdental.com</p>
                <div className="pt-2">
                  <span className="inline-block border-y border-dashed border-gray-250 py-1 px-8 text-sm font-extrabold text-gray-800 uppercase tracking-widest">
                    Receipt Invoice
                  </span>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <p className="text-gray-400 font-semibold">Invoice No:</p>
                  <p className="font-bold text-gray-700">{selectedTransaction.transactionCode}</p>
                  
                  <p className="text-gray-400 font-semibold pt-1">Invoice Date:</p>
                  <p className="font-semibold text-gray-700">{selectedTransaction.transactionDate}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-gray-400 font-semibold">Bill To Patient:</p>
                  <p className="font-bold text-gray-700">{selectedTransaction.patient?.fullName}</p>
                  <p className="text-gray-500 font-medium">{selectedTransaction.patient?.phoneNumber}</p>
                  
                  {selectedTransaction.doctor && (
                    <>
                      <p className="text-gray-400 font-semibold pt-1">Dentist:</p>
                      <p className="font-semibold text-gray-700">{selectedTransaction.doctor.name}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider pb-1">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center w-12">Qty</th>
                      <th className="py-2 text-right w-24">Price</th>
                      <th className="py-2 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedTransaction.items?.map((item, i) => (
                      <tr key={i} className="text-gray-700 font-medium">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-2 text-right">{formatCurrency(Number(item.price) * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Receipt Totals Summary */}
              <div className="border-t border-gray-200 pt-3 text-xs space-y-1.5 flex flex-col items-end">
                <div className="w-60 flex items-center justify-between text-gray-500 font-semibold">
                  <span>Subtotal:</span>
                  <span className="font-bold text-gray-700">{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discount > 0 && (
                  <div className="w-60 flex items-center justify-between text-gray-500 font-semibold">
                    <span>Discount:</span>
                    <span className="font-bold text-red-500">-{formatCurrency(selectedTransaction.discount)}</span>
                  </div>
                )}
                {selectedTransaction.tax > 0 && (
                  <div className="w-60 flex items-center justify-between text-gray-500 font-semibold">
                    <span>Tax / Fee:</span>
                    <span className="font-bold text-gray-700">+{formatCurrency(selectedTransaction.tax)}</span>
                  </div>
                )}
                <div className="w-60 flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-sm font-bold text-gray-800">
                  <span>Total Amount:</span>
                  <span className="text-base font-extrabold text-[#008080]">{formatCurrency(selectedTransaction.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Details Stamp */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <p className="text-gray-400 font-semibold">Payment Method:</p>
                  <p className="font-bold text-gray-700 uppercase">{selectedTransaction.paymentMethod?.replace("_", " ") || "CASH"}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block border-2 font-black text-xs uppercase px-4 py-1.5 rounded-lg select-none transform rotate-3 ${
                      selectedTransaction.paymentStatus === "PAID"
                        ? "border-green-500 text-green-600 bg-green-50/50"
                        : selectedTransaction.paymentStatus === "CANCELLED"
                        ? "border-red-500 text-red-650 bg-red-50/50"
                        : "border-amber-500 text-amber-600 bg-amber-50/50"
                    }`}
                  >
                    {selectedTransaction.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="text-xs bg-gray-50/30 border border-gray-100 p-3 rounded-lg">
                  <p className="text-gray-400 font-semibold pb-1">Notes:</p>
                  <p className="text-gray-600 leading-relaxed font-medium">{selectedTransaction.notes}</p>
                </div>
              )}

              {/* Thank you note */}
              <div className="text-center pt-2">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                  Thank you for choosing FW Dental!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
