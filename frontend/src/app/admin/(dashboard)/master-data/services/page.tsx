"use client";

import React from "react";
import ServicesTab from "../services-tab";

export default function ServicesPage() {
  return (
    <div className="space-y-6 font-sans flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Services</h2>
        <p className="text-sm text-gray-400 font-medium">Manage dental clinic treatments and operational pricing</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <ServicesTab />
      </div>
    </div>
  );
}
