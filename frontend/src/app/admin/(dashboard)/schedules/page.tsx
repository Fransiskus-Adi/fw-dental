"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  HelpCircle,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ScheduleBlock {
  id: string;
  doctorName: string;
  patientName: string;
  treatment: string;
  day: string; // e.g. "Monday", "Tuesday", etc.
  timeSlot: string; // e.g. "09:00 AM", "10:00 AM", etc.
  duration: number; // in hours (for height grid spanning if needed, but for simplicity we keep it 1-hour block aligned)
  color: string;
}

export default function AdminSchedulesPage() {
  const [selectedDoctor, setSelectedDoctor] = useState("All");
  const [doctors, setDoctors] = useState<any[]>([]);

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM", // Lunch break usually
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  useEffect(() => {
    fetch("http://localhost:3001/doctors")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load doctors");
        return res.json();
      })
      .then(data => setDoctors(data))
      .catch(err => console.error(err));
  }, []);

  const colors = [
    "bg-blue-50 border-blue-200 text-blue-700",
    "bg-teal-50 border-teal-200 text-teal-700",
    "bg-yellow-50 border-yellow-200 text-yellow-700",
    "bg-purple-50 border-purple-200 text-purple-700",
    "bg-pink-50 border-pink-200 text-pink-700",
  ];

  const dotColors = [
    "bg-blue-500",
    "bg-teal-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  const getDoctorColorClass = (docName: string) => {
    const idx = doctors.findIndex(d => d.name === docName);
    return colors[idx !== -1 ? idx % colors.length : 0];
  };

  const isDoctorScheduledAtSlot = (doc: any, day: string, slot: string) => {
    if (!doc.days || !doc.days.includes(day)) return false;
    
    const parseTime = (timeStr: string) => {
      const [hStr, mStr] = timeStr.split(":");
      let hour = parseInt(hStr);
      if (timeStr.toLowerCase().includes("pm") && hour !== 12) hour += 12;
      if (timeStr.toLowerCase().includes("am") && hour === 12) hour = 0;
      return hour;
    };
    
    const slotHour = parseTime(slot);
    const startHour = doc.shiftStart ? parseInt(doc.shiftStart.split(":")[0]) : 9;
    const endHour = doc.shiftEnd ? parseInt(doc.shiftEnd.split(":")[0]) : 17;
    
    return slotHour >= startHour && slotHour < endHour;
  };

  const [schedules, setSchedules] = useState<ScheduleBlock[]>([]);

  const fetchBookings = () => {
    fetch("http://localhost:3001/bookings")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load bookings");
        return res.json();
      })
      .then(data => {
        const mapped = data.map((b: any) => {
          const [year, month, day] = b.bookingDate.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayName = weekdays[dateObj.getDay()];

          const parts = b.startTime.split(':');
          const hour = parseInt(parts[0], 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          let displayHour = hour % 12;
          if (displayHour === 0) displayHour = 12;
          const timeSlot = `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;

          return {
            id: b.id,
            doctorName: b.doctor ? b.doctor.name : "Unassigned",
            patientName: b.patient ? b.patient.fullName : "Unknown",
            treatment: b.service ? b.service.name : "Unknown",
            day: dayName,
            timeSlot: timeSlot,
            duration: 1,
            color: "", // Set dynamically below
            status: b.statusCode,
          };
        });

        // Filter out CANCELLED bookings from grid display
        const activeBookings = mapped.filter((item: any) => item.status !== 'CANCELLED');

        // Set colors dynamically based on doctors
        const updatedMapped = activeBookings.map((item: any) => ({
          ...item,
          color: getDoctorColorClass(item.doctorName),
        }));

        setSchedules(updatedMapped);
      })
      .catch(err => console.error("Error loading schedules:", err));
  };

  useEffect(() => {
    if (doctors.length > 0) {
      fetchBookings();
    }
  }, [doctors]);

  const [activeSlotDetails, setActiveSlotDetails] = useState<ScheduleBlock | null>(null);

  // Filter schedules based on doctor choice
  const filteredSchedules = schedules.filter(
    s => selectedDoctor === "All" || s.doctorName === selectedDoctor
  );

  // Helper to find a schedule block in a cell
  const getBlockInCell = (day: string, slot: string) => {
    return filteredSchedules.find(s => s.day === day && s.timeSlot === slot);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Schedules</h2>
          <p className="text-sm text-gray-400 font-medium">Timetable calendar grid for all dental operations</p>
        </div>
        
        {/* Navigation & Controls */}
        <div className="flex items-center gap-3">
          {/* Week Selector Mock */}
          <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-2xs select-none">
            <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 cursor-pointer">
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 py-1 text-xs font-bold text-gray-600 flex items-center">
              Aug 17 - Aug 21, 2026
            </span>
            <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 cursor-pointer">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Overview Cards */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Doctor Filters */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 rounded-xl max-w-fit select-none">
          <button
            onClick={() => setSelectedDoctor("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedDoctor === "All"
                ? "bg-[#008080] text-white shadow-2xs"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            All Dentists
          </button>
          {doctors.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctor(doc.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDoctor === doc.name
                  ? "bg-[#008080] text-white shadow-2xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {doc.name}
            </button>
          ))}
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 select-none">
          {doctors.map((doc, idx) => {
            const dotColor = dotColors[idx % dotColors.length];
            return (
              <div key={doc.id} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${dotColor}`} />
                <span>{doc.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TimeTable Grid Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Grid View */}
        <Card className="lg:col-span-8 bg-white border-none shadow-sm rounded-3xl overflow-hidden p-6">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Grid Header - Days of Week */}
                <div className="grid grid-cols-6 border-b border-gray-100 pb-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
                  <div className="text-left pl-2">Time</div>
                  {weekdays.map(day => {
                    const scheduledDocs = doctors.filter(doc => doc.days && doc.days.includes(day));
                    return (
                      <div key={day} className="flex flex-col items-center">
                        <span className="font-bold text-gray-700">{day}</span>
                        <span className="text-[9px] text-[#008080] font-bold normal-case tracking-normal mt-0.5 max-w-full truncate px-0.5" title={scheduledDocs.map(d => d.name).join(", ")}>
                          {scheduledDocs.length > 0
                            ? scheduledDocs.map(d => d.name.replace("Dr. ", "")).join(", ")
                            : "Off"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grid Body */}
                <div className="divide-y divide-gray-50">
                  {timeSlots.map(slot => (
                    <div key={slot} className="grid grid-cols-6 items-center min-h-[58px] py-1.5">
                      {/* Hour Column */}
                      <div className="text-left font-bold text-[10px] text-gray-400 flex items-center gap-1 pr-2 select-none">
                        <Clock className="size-3 text-gray-300" />
                        {slot}
                      </div>

                      {/* Day Columns */}
                      {weekdays.map(day => {
                        const block = getBlockInCell(day, slot);
                        
                        let cellContent = null;
                        if (block) {
                          const docColorClass = getDoctorColorClass(block.doctorName);
                          cellContent = (
                            <button
                              onClick={() => setActiveSlotDetails(block)}
                              className={`w-full h-full text-left p-2 rounded-xl border text-[10px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-2xs leading-snug flex flex-col justify-between overflow-hidden cursor-pointer ${docColorClass}`}
                            >
                              <span className="font-bold truncate">{block.patientName}</span>
                              <span className="opacity-80 truncate">{block.doctorName} ({block.treatment})</span>
                            </button>
                          );
                        } else if (slot === "12:00 PM") {
                          cellContent = (
                            <div className="w-full h-full rounded-xl bg-gray-50/50 border border-transparent flex items-center justify-center text-[9px] text-gray-300 font-bold uppercase tracking-wider select-none">
                              Lunch
                            </div>
                          );
                        } else {
                          if (selectedDoctor !== "All") {
                            const currentDocObj = doctors.find(d => d.name === selectedDoctor);
                            const isScheduled = currentDocObj ? isDoctorScheduledAtSlot(currentDocObj, day, slot) : false;
                            
                            if (isScheduled) {
                              cellContent = (
                                <button
                                  onClick={() => alert(`Schedule appointment with ${selectedDoctor} on ${day} at ${slot}`)}
                                  className="w-full h-full rounded-xl border border-dashed border-gray-100 hover:border-gray-300 hover:bg-gray-50/50 transition-colors flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-pointer"
                                  title="Schedule slot"
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              );
                            } else {
                              cellContent = (
                                <div className="w-full h-full rounded-xl bg-gray-50/15 border border-transparent flex items-center justify-center text-[9px] text-gray-300 font-medium select-none">
                                  Off
                                </div>
                              );
                            }
                          } else {
                            const anyScheduled = doctors.some(d => isDoctorScheduledAtSlot(d, day, slot));
                            if (anyScheduled) {
                              cellContent = (
                                <button
                                  onClick={() => alert(`Schedule appointment on ${day} at ${slot}`)}
                                  className="w-full h-full rounded-xl border border-dashed border-gray-100 hover:border-gray-300 hover:bg-gray-50/50 transition-colors flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-pointer"
                                  title="Schedule slot"
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              );
                            } else {
                              cellContent = (
                                <div className="w-full h-full rounded-xl bg-gray-50/15 border border-transparent flex items-center justify-center text-[9px] text-gray-300 font-medium select-none">
                                  Off
                                </div>
                              );
                            }
                          }
                        }

                        return (
                          <div key={day} className="px-1 h-full w-full flex">
                            {cellContent}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Slot Information / Details panel */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100/50 shadow-sm space-y-5 min-h-[300px] flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-gray-800 font-bold text-base flex items-center gap-2 pb-4 border-b border-gray-100">
              <FileText className="size-5 text-[#008080]" />
              Slot Information
            </h4>

            {activeSlotDetails ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Patient</span>
                    <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mt-0.5">
                      <User className="size-4 text-gray-400" />
                      {activeSlotDetails.patientName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Doctor Assignment</span>
                    <p className="font-semibold text-gray-700 text-xs mt-0.5">
                      {activeSlotDetails.doctorName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Treatment Required</span>
                    <p className="font-semibold text-gray-600 text-xs mt-0.5">
                      {activeSlotDetails.treatment}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Day</span>
                      <p className="font-bold text-gray-700 text-xs">{activeSlotDetails.day}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Time Slot</span>
                      <p className="font-bold text-gray-700 text-xs">{activeSlotDetails.timeSlot}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (confirm("Cancel this appointment?")) {
                        try {
                          const res = await fetch(`http://localhost:3001/bookings/${activeSlotDetails.id}/status`, {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ status: "CANCELLED" }),
                          });
                          if (!res.ok) throw new Error("Failed to cancel booking");
                          fetchBookings();
                          setActiveSlotDetails(null);
                        } catch (err) {
                          console.error(err);
                          alert("Error cancelling appointment");
                        }
                      }
                    }}
                    className="flex-1 h-9 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => {
                      alert(`Rescheduling patient ${activeSlotDetails.patientName}`);
                    }}
                    className="flex-1 h-9 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center gap-2 select-none">
                <HelpCircle className="size-8 text-gray-300" />
                <p className="text-xs font-semibold">Select any booked block in the timetable grid to inspect booking info.</p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-400 font-semibold leading-relaxed border-t border-gray-50 pt-4 text-center">
            * Lunch hours (12:00 PM - 01:00 PM) are blocked for all dentist staff.
          </div>
        </div>

      </div>
    </div>
  );
}
