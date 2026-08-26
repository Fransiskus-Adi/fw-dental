"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Mail,
  Phone,
  Calendar,
  X,
  Edit2,
  Trash2,
  Lock,
  Loader2,
  UserCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleCode?: string;
  createdAt: string;
}

export default function EmployeesTab() {
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
      const res = await fetch("http://localhost:3001/employees");
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
      const res = await fetch("http://localhost:3001/roles");
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
        ? "http://localhost:3001/employees" 
        : `http://localhost:3001/employees/${selectedId}`;
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

      const res = await fetch(url, {
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
      const res = await fetch(`http://localhost:3001/employees/${id}`, {
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
          <button
            onClick={handleOpenAddModal}
            className="h-10 bg-[#5d5aeb] hover:bg-[#4b48cc] text-white font-semibold rounded-xl px-4 transition-all shadow-md shadow-blue-100 flex items-center gap-2 text-sm select-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Main Listing View */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="size-8 text-[#5d5aeb] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-red-100 text-red-500 font-medium">
          {error}. <button onClick={fetchEmployees} className="underline font-bold text-[#5d5aeb]">Retry</button>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(emp => (
            <Card
              key={emp.id}
              className="bg-white border-none shadow-xs rounded-3xl overflow-hidden hover:shadow-md transition-shadow relative group"
            >
              <CardContent className="p-6 space-y-4">
                {/* Profile Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-[#008080]/10 border border-[#008080]/20 flex items-center justify-center text-[#008080]">
                      <UserCheck className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">{emp.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Staff</p>
                        {emp.roleCode && (
                          <code className="text-[8px] text-[#008080] font-mono font-bold bg-[#008080]/10 px-1.5 py-0.5 rounded">
                            {emp.roleCode}
                          </code>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions (Edit/Delete) */}
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      className="size-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Employee"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="size-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs font-semibold text-gray-500 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-gray-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-gray-400 shrink-0" />
                    <span>{emp.phone || "No phone number"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-gray-400 shrink-0" />
                    <span>Joined: {new Date(emp.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400 font-medium">
          No employees found.
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
        </div>
      )}
    </div>
  );
}
