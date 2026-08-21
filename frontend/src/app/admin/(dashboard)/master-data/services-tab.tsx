"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Clock,
  DollarSign,
  FileText,
  X,
  Edit2,
  Trash2,
  Loader2,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Service {
  id: string;
  code: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  durationMinutes: number;
  priceFrom?: number;
  priceTo?: number;
  imageUrl?: string;
  displayOrder: number;
  enabled: number;
  createdAt: string;
}

export default function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/services");
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading services");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedId(null);
    setName("");
    setCode("");
    setSlug("");
    setShortDescription("");
    setDescription("");
    setDurationMinutes(30);
    setPriceFrom("");
    setPriceTo("");
    setDisplayOrder(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (srv: Service) => {
    setModalMode("edit");
    setSelectedId(srv.id);
    setName(srv.name);
    setCode(srv.code);
    setSlug(srv.slug || "");
    setShortDescription(srv.shortDescription || "");
    setDescription(srv.description || "");
    setDurationMinutes(srv.durationMinutes);
    setPriceFrom(srv.priceFrom ? srv.priceFrom.toString() : "");
    setPriceTo(srv.priceTo ? srv.priceTo.toString() : "");
    setDisplayOrder(srv.displayOrder);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitLoading(true);
    try {
      const payload: any = {
        name,
        durationMinutes: Number(durationMinutes),
        displayOrder: Number(displayOrder),
        shortDescription,
        description,
      };

      if (code.trim()) payload.code = code;
      if (slug.trim()) payload.slug = slug;
      if (priceFrom) payload.priceFrom = Number(priceFrom);
      if (priceTo) payload.priceTo = Number(priceTo);

      const url = modalMode === "add" 
        ? "http://localhost:3001/services" 
        : `http://localhost:3001/services/${selectedId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save service");
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert(err.message || "Failed to save service");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, srvName: string) => {
    if (!confirm(`Are you sure you want to delete service "${srvName}"?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/services/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete service");
      fetchServices();
    } catch (err: any) {
      alert(err.message || "Failed to delete service");
    }
  };

  const formatPrice = (val?: number) => {
    if (val === undefined || val === null) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredServices = services.filter(
    srv =>
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search service by name or code"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-xl text-xs transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-gray-400 font-bold select-none whitespace-nowrap">
            Total Services: {services.length}
          </span>
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Service
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
          {error}. <button onClick={fetchServices} className="underline font-bold text-[#008080]">Retry</button>
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(srv => (
            <Card
              key={srv.id}
              className="bg-white border-none shadow-xs rounded-3xl overflow-hidden hover:shadow-md transition-shadow relative group"
            >
              <CardContent className="p-6 space-y-4">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-[#008080]/10 border border-[#008080]/20 flex items-center justify-center text-[#008080]">
                      <Sparkles className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">{srv.name}</h4>
                      <p className="text-[10px] text-[#008080] font-extrabold uppercase tracking-wider mt-0.5">{srv.code}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(srv)}
                      className="size-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Service"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(srv.id, srv.name)}
                      className="size-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete Service"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Short Description */}
                {srv.shortDescription && (
                  <p className="text-xs text-gray-400 font-medium line-clamp-2">
                    {srv.shortDescription}
                  </p>
                )}

                {/* Details list */}
                <div className="space-y-2.5 text-xs font-semibold text-gray-500 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-gray-400 shrink-0" />
                    <span>Duration: {srv.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-4 text-gray-400 shrink-0" />
                    <span>
                      {srv.priceFrom || srv.priceTo ? (
                        <>
                          {srv.priceFrom ? formatPrice(srv.priceFrom) : "0"} - {srv.priceTo ? formatPrice(srv.priceTo) : "Up"}
                        </>
                      ) : (
                        "Free / Quote Required"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-gray-400 shrink-0" />
                    <span>Order: {srv.displayOrder}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400 font-medium">
          No services found.
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {modalMode === "add" ? "Add New Service" : "Edit Service Details"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Service Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Service Name</label>
                <Input
                  required
                  placeholder="e.g. Scaling & Polishing"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Code & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Service Code (Optional)</label>
                  <Input
                    placeholder="e.g. SRV-SCALE"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">URL Slug (Optional)</label>
                  <Input
                    placeholder="e.g. scaling-polishing"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Short Description</label>
                <textarea
                  placeholder="Brief summary shown on service lists"
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  className="w-full min-h-[60px] max-h-[100px] border border-gray-200 rounded-xl text-sm p-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Full Description</label>
                <textarea
                  placeholder="Detailed information about the treatment procedure"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full min-h-[100px] max-h-[160px] border border-gray-200 rounded-xl text-sm p-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Duration & Display Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Duration (Minutes)</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Display Order</label>
                  <Input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={e => setDisplayOrder(Number(e.target.value))}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Price From & Price To */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Price From (IDR, Optional)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 250000"
                    value={priceFrom}
                    onChange={e => setPriceFrom(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Price To (IDR, Optional)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 500000"
                    value={priceTo}
                    onChange={e => setPriceTo(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                  />
                </div>
              </div>

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
                  {modalMode === "add" ? "Create Service" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
