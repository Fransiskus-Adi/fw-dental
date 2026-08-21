"use client";

import React from "react";
import DoctorsTab from "../doctors-tab";

export default function DoctorsPage() {
  return (
    <div className="space-y-6 font-sans flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Doctors</h2>
        <p className="text-sm text-gray-400 font-medium">Manage dental medical staff and shifts</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <DoctorsTab />
      </div>
    </div>
  );
}
