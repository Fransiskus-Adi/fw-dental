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
  const { can } = useAdminAccess();
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
      const res = await staffFetch("/services/staff");
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
        ? "/services"
        : `/services/${selectedId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await staffFetch(url, {
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
      const res = await staffFetch(`/services/${id}`, {
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
          {can("feat_services_write") && (
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Service
          </button>
          )}
        </div>
      </div>

      <MasterDataTable
        label="Services"
        columns={["Service", "Code", "Description", "Duration", "Price", "Display order", "Status"]}
        loading={loading}
        error={error}
        empty={filteredServices.length === 0}
        onRetry={fetchServices}
      >
        {filteredServices.map(srv => (
          <tr role="row" key={srv.id} className="hover:bg-gray-50/60">
            <th role="rowheader" scope="row" className="min-w-36 font-semibold text-gray-800">{srv.name}</th>
            <td role="cell" data-label="Code"><code className="whitespace-nowrap">{srv.code}</code></td>
            <td role="cell" data-label="Description" className="min-w-40">{srv.shortDescription || "—"}</td>
            <td role="cell" data-label="Duration" className="whitespace-nowrap tabular-nums">{srv.durationMinutes} min</td>
            <td role="cell" data-label="Price" className="whitespace-nowrap tabular-nums">
              {srv.priceFrom != null || srv.priceTo != null
                ? `${formatPrice(srv.priceFrom ?? 0)} – ${srv.priceTo == null ? "Up" : formatPrice(srv.priceTo)}`
                : "Free / Quote Required"}
            </td>
            <td role="cell" data-label="Display order" className="tabular-nums">{srv.displayOrder}</td>
            <td role="cell" data-label="Status">
              <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                srv.enabled === 1 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {srv.enabled === 1 ? "Enabled" : "Disabled"}
              </span>
            </td>
            <td role="cell" data-label="Actions">
              <RecordActions
                name={srv.name}
                onEdit={can("feat_services_write") ? () => handleOpenEditModal(srv) : undefined}
                onDelete={can("feat_services_delete") ? () => handleDelete(srv.id, srv.name) : undefined}
              />
            </td>
          </tr>
        ))}
      </MasterDataTable>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <AdminDialog label="Service details" onClose={() => setIsModalOpen(false)} className="admin-overlay fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
        </AdminDialog>
      )}
    </div>
  );
}
