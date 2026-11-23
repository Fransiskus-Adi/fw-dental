"use client";

import { AdminDialog } from "@/components/admin-dialog";

import { useAdminAccess } from "@/lib/admin-access-context";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Shield,
  X,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MasterDataTable, RecordActions } from "../master-data-table";
import { CustomSelect } from "@/components/ui/custom-select";
import { staffFetch } from "@/lib/staff-fetch";

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
    code: "ABSENCE",
    name: "ABSENCE",
    permissions: [
      { key: "page_absence", label: "Absence Page Access", desc: "Open Absence and see your current clock-in and clock-out status." },
      { key: "feat_absence_history", label: "View Own Attendance History", desc: "View your past clock-in and clock-out records and recorded locations." },
      { key: "feat_absence_clock_in", label: "Clock In", desc: "Record the start and location of your shift. This also enables the portal?s clock-in requirement." },
      { key: "feat_absence_clock_out", label: "Clock Out", desc: "Record the end and location of your shift after clocking in." },
      { key: "feat_absence_employee_logs", label: "View Employee Attendance Logs", desc: "View attendance records, shift times, and recorded locations for all employees." },
    ],
  },
  {
    code: "DASHBOARD",
    name: "DASHBOARD",
    permissions: [
      { key: "page_dashboard", label: "Dashboard Page Access", desc: "Allow user to open and view the main dashboard overview page." },
      { key: "feat_dashboard_metrics", label: "Dashboard Metrics", desc: "View balances, revenue charts, customer and order totals, and clinic activity." },
      { key: "feat_dashboard_appointments", label: "View Today?s Appointments", desc: "View today?s appointments on the dashboard, including patient names, treatments, and booking status." }
    ]
  },
  {
    code: "BOOKINGS",
    name: "BOOKINGS",
    permissions: [
      { key: "page_bookings", label: "Bookings Page Access", desc: "Allow user to access the Bookings page queue." },
      { key: "feat_bookings_create", label: "Create Bookings", desc: "Create patient appointments from the staff Bookings page." },
      { key: "feat_bookings_status", label: "Manage Booking Status", desc: "Confirm, cancel, or complete appointments from Bookings. Checkout also requires Create Transactions." }
    ]
  },
  {
    code: "TRANSACTIONS",
    name: "TRANSACTIONS",
    permissions: [
      { key: "page_transactions", label: "Transactions Page Access", desc: "View transaction history and open or print receipts." },
      { key: "feat_transactions_create", label: "Create Transactions", desc: "Record POS sales from Transactions or create an invoice during booking checkout." },
      { key: "feat_transactions_status", label: "Manage Transaction Status", desc: "Allow user to update transaction payment status." },
      { key: "feat_transactions_delete", label: "Delete Transactions", desc: "Allow user to delete transaction records." }
    ]
  },
  {
    code: "SCHEDULES",
    name: "SCHEDULES",
    permissions: [
      { key: "page_schedules", label: "Schedules Page Access", desc: "View doctor schedules and appointment details in the timetable." },
      { key: "feat_schedules_cancel", label: "Cancel Scheduled Appointments", desc: "Cancel a booking directly from the Schedules timetable." }
    ]
  },
  {
    code: "EMPLOYEES",
    name: "EMPLOYEES",
    permissions: [
      { key: "page_employees", label: "Employees Page Access", desc: "Allow user to access Employee Master Data." },
      { key: "feat_employees_write", label: "Write Employees", desc: "Create or edit employee accounts, set passwords, and assign roles. Requires the built-in Administrator role." },
      { key: "feat_employees_delete", label: "Delete Employees", desc: "Delete employee accounts. Requires the built-in Administrator role." }
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
    code: "SERVICES",
    name: "SERVICES",
    permissions: [
      { key: "page_services", label: "Services Page Access", desc: "Open Services in Master Data and view the clinic?s service catalog." },
      { key: "feat_services_write", label: "Add and Edit Services", desc: "Create services and edit treatment names, descriptions, prices, durations, and availability." },
      { key: "feat_services_delete", label: "Delete Services", desc: "Remove services from the clinic?s service catalog." },
    ],
  },
  {
    code: "ROLES",
    name: "ROLES",
    permissions: [
      { key: "page_roles", label: "Roles Page Access", desc: "Allow user to access Roles Master Data." },
      { key: "feat_roles_write", label: "Write Roles", desc: "Create roles, edit their permissions, and enable or disable roles. Requires the built-in Administrator role." },
      { key: "feat_roles_delete", label: "Delete Roles", desc: "Delete roles. Requires the built-in Administrator role." }
    ]
  },
  {
    code: "SETTINGS",
    name: "SETTINGS",
    permissions: [
      { key: "page_settings", label: "Settings Page Access", desc: "Allow user to view the clinic settings panel." },
      { key: "feat_settings_write", label: "Modify Settings", desc: "Edit the clinic profile, booking rules, and preferences in the Settings form." }
    ]
  },
  {
    code: "NOTIFICATIONS",
    name: "NOTIFICATIONS",
    permissions: [
      { key: "feat_notifications_view", label: "View Portal Notifications", desc: "Open the notification bell and receive booking alerts and attendance reminders for accessible pages." },
    ],
  },
];

const ALL_PERMISSION_ITEMS: PermissionItem[] = MENU_SECTIONS.reduce<PermissionItem[]>((acc, section) => {
  return [...acc, ...section.permissions];
}, []);

const TOTAL_PERMISSIONS_COUNT = ALL_PERMISSION_ITEMS.length;

// Custom switch component - Light Mode (using brand teal #008080)
const Switch = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008080]"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none flex h-6 w-full items-center rounded-full p-0.5 transition-colors duration-200 ${
          checked ? "bg-[#008080]" : "bg-gray-200"
        }`}
      >
        <span
          className={`size-5 shrink-0 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
};

export default function RolesPage() {
  const { canAdminister } = useAdminAccess();
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
      const res = await staffFetch("/roles");
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
    const initialPerms: Record<string, boolean> = { ...rolePerms };
    ALL_PERMISSION_ITEMS.forEach(p => {
      initialPerms[p.key] = rolePerms[p.key] === true;
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

  const totalEnabledPermissions = ALL_PERMISSION_ITEMS.filter(({ key }) => permissions[key] === true).length;

  const isAllActionsEnabled = totalEnabledPermissions === TOTAL_PERMISSIONS_COUNT;

  const handleToggleAllActions = (checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      ...Object.fromEntries(ALL_PERMISSION_ITEMS.map(({ key }) => [key, checked])),
    }));
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
        ? "/roles"
        : `/roles/${selectedCode}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const payload = {
        code: code.trim().toUpperCase().replace(/\s+/g, "_"),
        name: name.trim(),
        description: description.trim(),
        enabled: Number(enabled),
        permissions
      };

      const res = await staffFetch(url, {
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
      const res = await staffFetch(`/roles/${role.code}`, {
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
      const res = await staffFetch(`/roles/${roleCode}`, {
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
    return ALL_PERMISSION_ITEMS.filter(({ key }) => role.permissions?.[key] === true).length;
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
          {canAdminister("feat_roles_write") && (
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-teal-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Role
          </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MasterDataTable
          label="Roles"
          columns={["Role", "Code", "Description", "Permissions", "Status"]}
          loading={loading}
          error={error}
          empty={filteredRoles.length === 0}
          onRetry={fetchRoles}
        >
          {filteredRoles.map(role => (
            <tr role="row" key={role.code} className="hover:bg-gray-50/60">
              <th role="rowheader" scope="row" className="min-w-32 font-semibold text-gray-800">{role.name}</th>
              <td role="cell" data-label="Code"><code className="whitespace-nowrap">{role.code}</code></td>
              <td role="cell" data-label="Description" className="min-w-40">{role.description || "—"}</td>
              <td role="cell" data-label="Permissions" className="whitespace-nowrap tabular-nums">{getActivePermsCount(role)} / {TOTAL_PERMISSIONS_COUNT} active</td>
              <td role="cell" data-label="Status">
                <button
                  type="button"
                  disabled={!canAdminister("feat_roles_write")}
                  onClick={() => toggleStatus(role)}
                  aria-label={`${role.enabled === 1 ? "Enabled" : "Disabled"}. Change status for ${role.name}`}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                    role.enabled === 1
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  {role.enabled === 1 ? "Enabled" : "Disabled"}
                </button>
              </td>
              <td role="cell" data-label="Actions">
                <RecordActions
                  name={role.name}
                  onEdit={canAdminister("feat_roles_write") ? () => handleOpenEditModal(role) : undefined}
                  onDelete={canAdminister("feat_roles_delete") ? () => handleDelete(role.code) : undefined}
                />
              </td>
            </tr>
          ))}
        </MasterDataTable>
      </div>

      {/* Add / Edit Role Modal - Light theme matching clinical dashboard colors */}
      {isModalOpen && (
        <AdminDialog label="Role details and permissions" onClose={() => setIsModalOpen(false)} className="admin-overlay fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
                      Select a section to view its permissions. <strong className="text-gray-850">{totalEnabledPermissions} permission(s) enabled</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-semibold select-none">All permissions</span>
                    <Switch
                      label="All permissions"
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
                    placeholder="Search permissions, descriptions, or codes?"
                    value={authoritySearchTerm}
                    onChange={e => setAuthoritySearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 focus:border-[#008080] outline-none rounded-xl text-xs text-gray-800 placeholder-gray-400 transition-all focus:ring-1 focus:ring-[#008080]"
                  />
                </div>

                {/* Main Split Layout Panel */}
                <div className="grid grid-cols-1 gap-4 lg:h-[340px] lg:grid-cols-12">
                  <label className="grid gap-1 text-sm font-semibold text-gray-700 lg:hidden">
                    Permission group
                    <select className="min-h-11 rounded-xl border border-gray-200 bg-white px-3" value={authoritySearchTerm.trim() ? "" : activeMenuCode} onChange={(event) => {
                      setActiveMenuCode(event.target.value);
                      setAuthoritySearchTerm("");
                    }}>
                      {authoritySearchTerm.trim() && <option value="" disabled>Search results</option>}
                      {MENU_SECTIONS.map((menu) => <option key={menu.code} value={menu.code}>{menu.name} ({getMenuEnabledCount(menu)}/{menu.permissions.length})</option>)}
                    </select>
                  </label>
                  
                  {/* Left Column: Menus List */}
                  <div className="hidden lg:col-span-5 bg-gray-50/50 border border-gray-150 rounded-2xl p-3 lg:flex flex-col gap-2 lg:overflow-y-auto min-h-0 pr-1.5 scrollbar-thin">
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
                        <button
                          key={menu.code}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            setActiveMenuCode(menu.code);
                            setAuthoritySearchTerm("");
                          }}
                          className={`shrink-0 p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
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
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Permission Details Cards */}
                  <div className="lg:col-span-7 bg-gray-50/50 border border-gray-150 rounded-2xl p-4 flex flex-col gap-3.5 lg:overflow-y-auto min-h-0 scrollbar-thin">
                    <div className="flex items-center justify-between shrink-0">
                      <h5 className="text-[10px] text-gray-450 font-extrabold uppercase tracking-wider">
                        {authoritySearchTerm.trim() !== ""
                          ? `Search Results (${activeSectionPermissions.length})`
                          : `${activeMenuCode} - Operations Permissions`}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Select all</span>
                        <Switch
                          label="Select all visible permissions"
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
                                  label={p.label}
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
        </AdminDialog>
      )}
    </div>
  );
}
