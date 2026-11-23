"use client";

import { useAdminAccess } from "@/lib/admin-access-context";

import React, { useCallback, useEffect, useState } from "react";
import { staffFetch } from "@/lib/staff-fetch";
import {
  Check,
  Building,
  Save,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const { can } = useAdminAccess();
  const [successMsg, setSuccessMsg] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  // Clinic profile states
  const [clinicName, setClinicName] = useState("FW Dental Clinic");
  const [clinicPhone, setClinicPhone] = useState("+62 21-8888-9999");
  const [clinicEmail, setClinicEmail] = useState("info@fwdental.com");
  const [clinicAddress, setClinicAddress] = useState("Jl. Jenderal Sudirman No. 45, Jakarta, Indonesia");
  

  const load = useCallback((signal?: AbortSignal) => {
    return staffFetch("/settings", { signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (signal?.aborted) return;
        setClinicName((value) => data.clinicName ?? value);
        setClinicPhone((value) => data.clinicPhone ?? value);
        setClinicEmail((value) => data.clinicEmail ?? value);
        setClinicAddress((value) => data.clinicAddress ?? value);
        setReady(true);
      })
      .catch(() => {
        if (!signal?.aborted) setLoadError("Could not load clinic settings.");
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || saving || !can("feat_settings_write")) return;
    setSuccessMsg("");
    setSaveError("");
    setSaving(true);
    try {
      const response = await staffFetch("/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicName, clinicPhone, clinicEmail, clinicAddress }),
      });
      if (!response.ok) throw new Error(response.status === 400 ? "Check the settings values and try again." : "Could not save settings. Try again.");
      setSuccessMsg("Settings saved.");
    } catch (error) {
      setSaveError(error instanceof TypeError ? "Connection interrupted. Try saving again once you reconnect." : (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Settings</h2>
          <p className="text-sm text-gray-400 font-medium">Manage the saved clinic profile.</p>
        </div>
      </div>

      <Card className="bg-white border-none shadow-sm rounded-3xl p-6">
          <CardContent className="p-0">
            {loadError && (
              <p role="alert" className="mb-4 text-sm text-red-800">
                {loadError}{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => {
                    setLoadError("");
                    void load();
                  }}
                >
                  Retry
                </button>
              </p>
            )}
            {!ready && !loadError && <p role="status" className="mb-4 text-sm text-gray-600">Loading settings…</p>}
            {saveError && <p role="alert" className="mb-4 text-sm text-red-800">{saveError}</p>}
            <form onSubmit={handleSave} onChange={() => setSuccessMsg("")}>
              <fieldset disabled={!ready || saving || !can("feat_settings_write")} className="min-w-0 space-y-6">
              
              {/* Success Notification Bar */}
              {successMsg && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-xl border border-green-100 font-bold flex items-center gap-2">
                  <Check className="size-4" />
                  {successMsg}
                </div>
              )}

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-base pb-3 border-b border-gray-100 flex items-center gap-2">
                    <Building className="size-5 text-[#008080]" />
                    Clinic Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Clinic Name</label>
                      <Input
                        required
                        value={clinicName}
                        onChange={e => setClinicName(e.target.value)}
                        className="h-10 border-gray-200 rounded-xl font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          required
                          value={clinicPhone}
                          onChange={e => setClinicPhone(e.target.value)}
                          className="pl-9 h-10 border-gray-200 rounded-xl font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Official Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        type="email"
                        required
                        value={clinicEmail}
                        onChange={e => setClinicEmail(e.target.value)}
                        className="pl-9 h-10 border-gray-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Full Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 size-4 text-gray-400" />
                      <textarea
                        required
                        rows={3}
                        value={clinicAddress}
                        onChange={e => setClinicAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              {can("feat_settings_write") && <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white text-sm font-semibold transition-all shadow-md shadow-teal-100 flex items-center gap-2 select-none cursor-pointer"
                >
                  <Save className="size-4" />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>}
              </fieldset>
            </form>
          </CardContent>
      </Card>
    </div>
  );
}
