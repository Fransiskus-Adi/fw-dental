"use client";

import { AdminDialog } from "@/components/admin-dialog";

import { useAdminAccess } from "@/lib/admin-access-context";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  Lock,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MasterDataTable, RecordActions } from "./master-data-table";
import { CustomSelect } from "@/components/ui/custom-select";
import { staffFetch } from "@/lib/staff-fetch";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleCode?: string;
  createdAt: string;
}

export default function EmployeesTab() {
  const { canAdminister } = useAdminAccess();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await staffFetch("/employees");
      if (!res.ok) throw new Error("Failed to load employees");
      const data = await res.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await staffFetch("/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setSelectedId(null);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRoleCode("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setModalMode("edit");
    setSelectedId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone || "");
    setPassword(""); // Keep blank to not change password
    setRoleCode(emp.roleCode || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    if (modalMode === "add" && !password) {
      alert("Password is required for new employees.");
      return;
    }

    setSubmitLoading(true);
    try {
      const url = modalMode === "add" 
        ? "/employees"
        : `/employees/${selectedId}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      
      const payload: any = { name, email, phone };
      if (password) {
        payload.password = password;
      }
      if (roleCode) {
        payload.roleCode = roleCode;
      } else {
        payload.roleCode = null;
      }

      const res = await staffFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save employee");
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to save employee");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (!confirm(`Are you sure you want to delete employee "${empName}"?`)) return;

    try {
      const res = await staffFetch(`/employees/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete employee");
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to delete employee");
    }
  };

  const filteredEmployees = employees.filter(
    emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee by name or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-xl text-xs transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-gray-400 font-bold select-none whitespace-nowrap">
            Total Employees: {employees.length}
          </span>
          {canAdminister("feat_employees_write") && (
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#5d5aeb] hover:bg-[#4b48cc] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-blue-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Employee
          </button>
          )}
        </div>
      </div>

      <MasterDataTable
        label="Employees"
        columns={["Name", "Role", "Email", "Phone", "Joined"]}
        loading={loading}
        error={error}
        empty={filteredEmployees.length === 0}
        onRetry={fetchEmployees}
      >
        {filteredEmployees.map(emp => (
          <tr role="row" key={emp.id} className="hover:bg-gray-50/60">
            <th role="rowheader" scope="row" className="min-w-36 font-semibold text-gray-800">{emp.name}</th>
            <td role="cell" data-label="Role"><code className="whitespace-nowrap">{emp.roleCode || "—"}</code></td>
            <td role="cell" data-label="Email" className="whitespace-nowrap">{emp.email}</td>
            <td role="cell" data-label="Phone" className="whitespace-nowrap">{emp.phone || "—"}</td>
            <td role="cell" data-label="Joined" className="whitespace-nowrap">
              {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }) : "—"}
            </td>
            <td role="cell" data-label="Actions">
              <RecordActions
                name={emp.name}
                onEdit={canAdminister("feat_employees_write") ? () => handleOpenEditModal(emp) : undefined}
                onDelete={canAdminister("feat_employees_delete") ? () => handleDelete(emp.id, emp.name) : undefined}
              />
            </td>
          </tr>
        ))}
      </MasterDataTable>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <AdminDialog label="Employee details" onClose={() => setIsModalOpen(false)} className="admin-overlay fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {modalMode === "add" ? "Add New Employee" : "Edit Employee Details"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Employee Full Name</label>
                <Input
                  required
                  placeholder="e.g. Frans Sebastian"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Email Address (Login ID)</label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. frans@fwdental.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Phone Contact (Optional)</label>
                <Input
                  placeholder="e.g. +62 812-3456-7890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-10 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* Role Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Role Assignment</label>
                <CustomSelect
                  value={roleCode}
                  onChange={(val) => setRoleCode(val)}
                  options={[
                    { value: "", label: "No Role / Default Access" },
                    ...roles.map(r => ({ value: r.code, label: `${r.name} (${r.code})` }))
                  ]}
                  triggerClassName="w-full h-10 border-gray-200 rounded-xl text-sm font-medium text-gray-700"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-500">
                    {modalMode === "add" ? "Login Password" : "Reset Password (Optional)"}
                  </label>
                  {modalMode === "edit" && (
                    <span className="text-[10px] text-gray-400 font-medium">Leave blank to keep current</span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    required={modalMode === "add"}
                    placeholder={modalMode === "add" ? "Set login password" : "Enter new password if resetting"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-10 border-gray-200 rounded-xl focus:border-blue-500 pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {modalMode === "add" ? "Register Employee" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
