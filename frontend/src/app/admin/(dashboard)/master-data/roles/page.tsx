"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Shield,
  FileText,
  X,
  Edit2,
  Trash2,
  Loader2,
  Lock,
  Layers,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";

interface Role {
  code: string;
  name: string;
  description?: string;
  enabled: number;
  permissions?: Record<string, boolean>;
}

interface PermissionItem {
  key: string;
  label: string;
  desc: string;
}

interface MenuSection {
  code: string;
  name: string;
  permissions: PermissionItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    code: "DASHBOARD",
    name: "DASHBOARD",
    permissions: [
      { key: "page_dashboard", label: "Dashboard Page Access", desc: "Allow user to open and view the main dashboard overview page." },
      { key: "feat_dashboard_metrics", label: "Dashboard Metrics", desc: "Allow user to view balances, revenues, and statistics metrics." }
    ]
  },
  {
    code: "BOOKINGS",
    name: "BOOKINGS",
    permissions: [
      { key: "page_bookings", label: "Bookings Page Access", desc: "Allow user to access the Bookings page queue." },
      { key: "feat_bookings_create", label: "Create Bookings", desc: "Allow user to create new patient appointments." },
      { key: "feat_bookings_status", label: "Manage Booking Status", desc: "Allow user to approve, cancel, or complete appointments." }
    ]
  },
  {
    code: "TRANSACTIONS",
    name: "TRANSACTIONS",
    permissions: [
      { key: "page_transactions", label: "Transactions Page Access", desc: "Allow user to open and view the transactions history and POS page." },
      { key: "feat_transactions_create", label: "Create Transactions", desc: "Allow user to create new transactions and record POS sales." },
      { key: "feat_transactions_status", label: "Manage Transaction Status", desc: "Allow user to update transaction payment status." },
      { key: "feat_transactions_delete", label: "Delete Transactions", desc: "Allow user to delete transaction records." }
    ]
  },
  {
    code: "SCHEDULES",
    name: "SCHEDULES",
    permissions: [
      { key: "page_schedules", label: "Schedules Page Access", desc: "Allow user to view doctor schedules and timetable calendar grid." }
    ]
  },
  {
    code: "EMPLOYEES",
    name: "EMPLOYEES",
    permissions: [
      { key: "page_employees", label: "Employees Page Access", desc: "Allow user to access Employee Master Data." },
      { key: "feat_employees_write", label: "Write Employees", desc: "Allow user to create and edit employee profiles and passwords." },
      { key: "feat_employees_delete", label: "Delete Employees", desc: "Allow user to delete employee accounts." }
    ]
  },
  {
    code: "DOCTORS",
    name: "DOCTORS",
    permissions: [
      { key: "page_doctors", label: "Doctors Page Access", desc: "Allow user to access Doctor Master Data." },
      { key: "feat_doctors_write", label: "Write Doctors", desc: "Allow user to create/edit dentist profiles and toggle active status." },
      { key: "feat_doctors_delete", label: "Delete Doctors", desc: "Allow user to delete dentist records." }
    ]
  },
  {
    code: "ROLES",
    name: "ROLES",
    permissions: [
      { key: "page_roles", label: "Roles Page Access", desc: "Allow user to access Roles Master Data." },
      { key: "feat_roles_write", label: "Write Roles", desc: "Allow user to create and edit role definitions and permissions." },
      { key: "feat_roles_delete", label: "Delete Roles", desc: "Allow user to delete role configurations." }
    ]
  },
  {
    code: "SETTINGS",
    name: "SETTINGS",
    permissions: [
      { key: "page_settings", label: "Settings Page Access", desc: "Allow user to view the clinic settings panel." },
      { key: "feat_settings_write", label: "Modify Settings", desc: "Allow user to update clinic profile, rules, and preferences." }
    ]
  }
];

const ALL_PERMISSION_ITEMS: PermissionItem[] = MENU_SECTIONS.reduce<PermissionItem[]>((acc, section) => {
  return [...acc, ...section.permissions];
}, []);

const TOTAL_PERMISSIONS_COUNT = ALL_PERMISSION_ITEMS.length;

// Custom switch component - Light Mode (using brand teal #008080)
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#008080]" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(1);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Authority panel states
  const [activeMenuCode, setActiveMenuCode] = useState<string>("DASHBOARD");
  const [authoritySearchTerm, setAuthoritySearchTerm] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/roles");
      if (!res.ok) throw new Error("Failed to load roles");
      const data = await res.json();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading roles");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedCode(null);
    setCode("");
    setName("");
    setDescription("");
    setEnabled(1);
    setActiveMenuCode("DASHBOARD");
    setAuthoritySearchTerm("");
    
    // Initialize permissions to false
    const initialPerms: Record<string, boolean> = {};
    ALL_PERMISSION_ITEMS.forEach(p => {
      initialPerms[p.key] = false;
    });
    setPermissions(initialPerms);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setModalMode("edit");
    setSelectedCode(role.code);
    setCode(role.code);
    setName(role.name);
    setDescription(role.description || "");
    setEnabled(role.enabled);
    setActiveMenuCode("DASHBOARD");
    setAuthoritySearchTerm("");
    
    // Load permissions from role or default to false
    const rolePerms = role.permissions || {};
    const initialPerms: Record<string, boolean> = {};
    ALL_PERMISSION_ITEMS.forEach(p => {
      initialPerms[p.key] = !!rolePerms[p.key];
    });
    setPermissions(initialPerms);
    setIsModalOpen(true);
  };

  const handlePermissionChange = (key: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const getMenuEnabledCount = (menu: MenuSection) => {
    return menu.permissions.filter(p => !!permissions[p.key]).length;
  };

  const totalEnabledPermissions = Object.values(permissions).filter(Boolean).length;

  const isAllActionsEnabled = totalEnabledPermissions === TOTAL_PERMISSIONS_COUNT;

  const handleToggleAllActions = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_PERMISSION_ITEMS.forEach(p => {
      updated[p.key] = checked;
    });
    setPermissions(updated);
  };

  // Check if all permissions under current section are selected
  const getActiveSectionPermissions = (): PermissionItem[] => {
    if (authoritySearchTerm.trim() !== "") {
      return ALL_PERMISSION_ITEMS.filter(
        p => 
          p.label.toLowerCase().includes(authoritySearchTerm.toLowerCase()) || 
          p.desc.toLowerCase().includes(authoritySearchTerm.toLowerCase()) ||
          p.key.toLowerCase().includes(authoritySearchTerm.toLowerCase())
      );
    }
    const currentSection = MENU_SECTIONS.find(m => m.code === activeMenuCode);
    return currentSection ? currentSection.permissions : [];
  };

  const activeSectionPermissions = getActiveSectionPermissions();
  const activeSectionEnabledCount = activeSectionPermissions.filter(p => !!permissions[p.key]).length;
  const isSectionAllEnabled = activeSectionPermissions.length > 0 && activeSectionEnabledCount === activeSectionPermissions.length;

  const handleToggleSectionAll = (checked: boolean) => {
    setPermissions(prev => {
      const updated = { ...prev };
      activeSectionPermissions.forEach(p => {
        updated[p.key] = checked;
      });
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    setSubmitLoading(true);
    try {
      const url = modalMode === "add" 
        ? "http://localhost:3001/roles" 
        : `http://localhost:3001/roles/${selectedCode}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const payload = {
        code: code.trim().toUpperCase().replace(/\s+/g, "_"),
        name: name.trim(),
        description: description.trim(),
        enabled: Number(enabled),
        permissions
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save role");
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      alert(err.message || "Failed to save role");
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleStatus = async (role: Role) => {
    const newEnabled = role.enabled === 1 ? 0 : 1;
    try {
      const res = await fetch(`http://localhost:3001/roles/${role.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      setRoles(prev =>
        prev.map(r => (r.code === role.code ? { ...r, enabled: newEnabled } : r))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (roleCode: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleCode}"?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/roles/${roleCode}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete role");
      fetchRoles();
    } catch (err: any) {
      alert(err.message || "Failed to delete role");
    }
  };

  const getActivePermsCount = (role: Role) => {
    if (!role.permissions) return 0;
    return Object.values(role.permissions).filter(Boolean).length;
  };

  const filteredRoles = roles.filter(
    role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Roles</h2>
        <p className="text-sm text-gray-400 font-medium">Manage employee access control roles</p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search role by name or code"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-150 focus:bg-white focus:border-gray-250 outline-none rounded-xl text-xs transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-gray-400 font-bold select-none whitespace-nowrap">
            Total Roles: {roles.length}
          </span>
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Role
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
            <Loader2 className="size-8 text-[#008080] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-red-100 text-red-500 font-medium">
            {error}. <button onClick={fetchRoles} className="underline font-bold text-[#008080]">Retry</button>
          </div>
        ) : filteredRoles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {filteredRoles.map(role => (
              <Card
                key={role.code}
                className="bg-white border-none shadow-xs rounded-3xl overflow-hidden hover:shadow-md transition-shadow relative group"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-[#008080]/10 border border-[#008080]/20 flex items-center justify-center text-[#008080]">
                        <Shield className="size-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-base">{role.name}</h4>
                        <code className="text-[10px] text-[#008080] font-mono font-semibold bg-[#008080]/10 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                          {role.code}
                        </code>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleStatus(role)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all select-none cursor-pointer ${
                        role.enabled === 1
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : "bg-red-50 text-red-500 hover:bg-red-100"
                      }`}
                      title="Click to toggle status"
                    >
                      {role.enabled === 1 ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 text-xs text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div className="flex items-start gap-2">
                      <FileText className="size-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 leading-relaxed">
                        {role.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Permissions count badge */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-extrabold uppercase tracking-wider bg-gray-50/55 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Layers className="size-3.5 text-[#008080]" />
                      <span>Role Permissions</span>
                    </div>
                    <span className="bg-[#008080]/10 text-[#008080] px-2 py-0.5 rounded-full font-mono">
                      {getActivePermsCount(role)} / {TOTAL_PERMISSIONS_COUNT} Active
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-50 flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(role)}
                      className="size-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Role"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.code)}
                      className="size-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400 font-medium">
            No roles found.
          </div>
        )}
      </div>

      {/* Add / Edit Role Modal - Light theme matching clinical dashboard colors */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Shield className="size-5 text-[#008080]" />
                {modalMode === "add" ? "Create New Role" : "Edit Role Details"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-200/50 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              
              {/* Basic Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Role Code</label>
                  <Input
                    required
                    disabled={modalMode === "edit"}
                    placeholder="e.g. CLINIC_STAFF"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="h-10 bg-white border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl focus:border-[#008080] focus:ring-[#008080] uppercase font-mono disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Display Name</label>
                  <Input
                    required
                    placeholder="e.g. Clinic Staff"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-10 bg-white border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl focus:border-[#008080] focus:ring-[#008080]"
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                  <CustomSelect
                    value={enabled.toString()}
                    onChange={(val) => setEnabled(Number(val))}
                    options={[
                      { value: "1", label: "Enabled" },
                      { value: "0", label: "Disabled" }
                    ]}
                    triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Describe the permissions or purpose of this role..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full min-h-[50px] max-h-[80px] border border-gray-200 bg-white focus:border-[#008080] focus:ring-1 focus:ring-[#008080] outline-none rounded-xl text-sm p-3 placeholder-gray-400 text-gray-800"
                />
              </div>

              {/* AUTHORITIES SECTION */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                
                {/* Authorities Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 tracking-tight">Authorities</h4>
                    <p className="text-xs text-gray-500">
                      Click a menu to configure authority. <strong className="text-gray-850">{totalEnabledPermissions} permission(s) enabled</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-semibold select-none">All actions</span>
                    <Switch
                      checked={isAllActionsEnabled}
                      onChange={handleToggleAllActions}
                    />
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menus, widgets, buttons, or authority codes..."
                    value={authoritySearchTerm}
                    onChange={e => setAuthoritySearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 focus:border-[#008080] outline-none rounded-xl text-xs text-gray-800 placeholder-gray-400 transition-all focus:ring-1 focus:ring-[#008080]"
                  />
                </div>

                {/* Main Split Layout Panel */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[340px] select-none">
                  
                  {/* Left Column: Menus List */}
                  <div className="md:col-span-5 bg-gray-50/50 border border-gray-150 rounded-2xl p-3 flex flex-col gap-2 overflow-y-auto min-h-0 h-full pr-1.5 scrollbar-thin">
                    <div className="px-2 pb-1.5 text-[9px] text-gray-400 font-extrabold uppercase tracking-wider flex justify-between">
                      <span>Menus</span>
                      <span>{totalEnabledPermissions}/{TOTAL_PERMISSIONS_COUNT}</span>
                    </div>

                    {MENU_SECTIONS.map(menu => {
                      const enabledCount = getMenuEnabledCount(menu);
                      const totalCount = menu.permissions.length;
                      const isSelected = activeMenuCode === menu.code && authoritySearchTerm.trim() === "";
                      const percent = totalCount > 0 ? (enabledCount / totalCount) * 100 : 0;

                      return (
                        <div
                          key={menu.code}
                          onClick={() => {
                            setActiveMenuCode(menu.code);
                            setAuthoritySearchTerm("");
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                            isSelected
                              ? "bg-[#008080]/5 border-[#008080]/30 text-[#008080]"
                              : "bg-white hover:bg-gray-100/50 border-gray-150 text-gray-500"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <ChevronRight className={`size-3.5 transition-transform ${isSelected ? "rotate-90 text-[#008080]" : "text-gray-405"}`} />
                              <span className="font-bold text-[11px] uppercase tracking-wider">{menu.name}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-gray-700">
                              {enabledCount}/{totalCount}
                            </span>
                          </div>
                          
                          {/* Custom Progress Bar (gradient matches fw-logo) */}
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-0.5">
                            <div 
                              className="h-full bg-gradient-to-r from-[#008080] to-[#0fd2d6] rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Permission Details Cards */}
                  <div className="md:col-span-7 bg-gray-50/50 border border-gray-150 rounded-2xl p-4 flex flex-col gap-3.5 overflow-y-auto min-h-0 h-full scrollbar-thin">
                    <div className="flex items-center justify-between shrink-0">
                      <h5 className="text-[10px] text-gray-450 font-extrabold uppercase tracking-wider">
                        {authoritySearchTerm.trim() !== ""
                          ? `Search Results (${activeSectionPermissions.length})`
                          : `${activeMenuCode} - Operations Permissions`}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Select all</span>
                        <Switch
                          checked={isSectionAllEnabled}
                          onChange={handleToggleSectionAll}
                        />
                      </div>
                    </div>

                    {/* Permissions list container */}
                    <div className="flex flex-col gap-2.5 pr-0.5">
                      {activeSectionPermissions.length > 0 ? (
                        activeSectionPermissions.map(p => {
                          const isChecked = !!permissions[p.key];
                          return (
                            <div 
                              key={p.key}
                              className="bg-white border border-gray-150 p-3.5 rounded-xl flex items-center justify-between gap-4 shadow-2xs"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <ChevronRight className="size-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-gray-800 text-xs leading-tight">{p.label}</span>
                                  <span className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">
                                    {p.desc}
                                  </span>
                                  <code className="text-[8px] text-[#008080] font-mono mt-1 font-bold">
                                    {p.key}
                                  </code>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono text-[10px] text-gray-405 font-bold">
                                  {isChecked ? "1/1" : "0/1"}
                                </span>
                                <Switch
                                  checked={isChecked}
                                  onChange={(checked) => handlePermissionChange(p.key, checked)}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-450 font-medium text-xs">
                          {authoritySearchTerm.trim() !== "" 
                            ? "No matching permissions found." 
                            : "Select a menu on the left to configure permissions."}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-250 hover:bg-gray-55 text-gray-505 text-sm font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#008080] to-[#0fd2d6] hover:opacity-90 text-white text-sm font-bold transition-all shadow-md shadow-teal-900/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {submitLoading && <Loader2 className="size-4 animate-spin" />}
                  {modalMode === "add" ? "Create Role" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
