"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Calendar, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BookingSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    serviceId: "",
    date: "",
    time: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/services")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load services");
        return res.json();
      })
      .then((data) => setServices(data))
      .catch((err) => console.error("Error loading services:", err));
  }, []);

  // Fetch slots based on date/service change
  useEffect(() => {
    if (!formData.date || !formData.serviceId) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    fetch(
      `http://localhost:3001/bookings/available-slots?date=${formData.date}&serviceId=${formData.serviceId}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load slots");
        return res.json();
      })
      .then((data) => {
        setAvailableSlots(data);
        if (formData.time && !data.includes(formData.time)) {
          setFormData((prev) => ({ ...prev, time: "" }));
        }
      })
      .catch((err) => {
        console.error("Error loading slots:", err);
        setAvailableSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [formData.date, formData.serviceId]);

  // Generate selectable dates (next 14 days, excluding Sundays)
  const getSelectableDates = () => {
    const list = [];
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let current = new Date();
    for (let i = 0; list.length < 14 && i < 30; i++) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0) {
        // Exclude Sunday
        const dateStr = current.toISOString().split("T")[0]; // YYYY-MM-DD
        const label = `${weekdays[dayOfWeek]}, ${months[current.getMonth()]} ${current.getDate()}`;
        list.push({ value: dateStr, label });
      }
      current.setDate(current.getDate() + 1);
    }
    return list;
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      serviceId: e.target.value,
      time: "", // Reset time
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      date: e.target.value,
      time: "", // Reset time
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.serviceId || !formData.date || !formData.time) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone,
          serviceId: formData.serviceId,
          date: formData.date,
          time: formData.time,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to schedule appointment");
      }

      setIsSuccessModalOpen(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        serviceId: "",
        date: "",
        time: "",
      });
      setHoneypot("");
    } catch (err: any) {
      alert(err.message || "An error occurred while booking. Please try again.");
    }
  };

  return (
    <section id="location" className="bg-white py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left - Form */}
          <div>
            <h2
              className="text-5xl lg:text-7xl font-medium tracking-tight leading-[1.05] mb-12"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Book Online
              <br />
              Now
              <span className="text-teal-600">.</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot field (hidden visually and from screen readers to attract spam bots) */}
              <div className="sr-only" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <Input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-14 rounded-full border-gray-200 px-6 text-base bg-white placeholder:text-gray-400"
                required
              />
              <Input
                type="email"
                placeholder="Email Address (Optional)"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="h-14 rounded-full border-gray-200 px-6 text-base bg-white placeholder:text-gray-400"
              />
              <Input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="h-14 rounded-full border-gray-200 px-6 text-base bg-white placeholder:text-gray-400"
                required
              />
            <div className="relative">
              <select
                value={formData.serviceId}
                onChange={handleServiceChange}
                className={`w-full h-14 rounded-full border border-gray-200 px-6 pr-12 text-base bg-white outline-none focus:border-teal-500 appearance-none transition-all cursor-pointer ${
                  formData.serviceId ? "text-gray-700 font-medium" : "text-gray-400"
                }`}
                required
              >
                <option value="" disabled>Select Treatment or Service</option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id} className="text-gray-700 font-medium">
                    {srv.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={formData.date}
                  onChange={handleDateChange}
                  className={`w-full h-14 rounded-full border border-gray-200 pl-12 pr-12 text-base bg-white outline-none focus:border-teal-500 appearance-none transition-all cursor-pointer ${
                    formData.date ? "text-gray-700 font-medium" : "text-gray-400"
                  }`}
                  required
                >
                  <option value="" disabled>Select Appointment Date</option>
                  {getSelectableDates().map((d) => (
                    <option key={d.value} value={d.value} className="text-gray-700 font-medium">
                      {d.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

                {formData.serviceId && formData.date && (
                  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-3">
                    <span className="text-xs font-bold text-gray-550 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-650" />
                      Select Appointment Hour
                    </span>
                    {loadingSlots ? (
                      <p className="text-sm text-gray-400 font-medium">Loading available hours...</p>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {availableSlots.map((slot) => {
                          const isSelected = formData.time === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setFormData({ ...formData, time: slot })}
                              className={`h-11 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-teal-700 text-white shadow-md shadow-teal-100"
                                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-500 hover:text-teal-700"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-red-500 font-bold">
                        No dentist is available on this date. Please choose another date.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="rounded-full bg-teal-700 text-white hover:bg-teal-800 px-8 py-6 text-base font-medium gap-3 group"
                >
                  Book Now
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </form>
          </div>

          {/* Right - Map */}
          <div className="relative rounded-2xl overflow-hidden min-h-[500px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.4517298169962!2d106.80426067478471!3d-6.335482961988188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69efab404d829d%3A0x37f2dbf1f7e2704b!2sFW%20Dental%20Jagakarsa!5e0!3m2!1sen!2sid!4v1787578652697!5m2!1sen!2sid"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
              title="Clinic Location"
            />
            {/* Location overlay */}
            <a
              href="https://share.google/sbW3B8z1EzAnC1hak"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border border-transparent hover:border-gray-100 group"
            >
              <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <svg
                    className="w-8 h-8 text-teal-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] uppercase text-gray-500 mb-1">
                  OUR LOCATION
                </p>
                <p className="text-sm font-bold text-black group-hover:text-teal-700 transition-colors">
                  FW Dental Jagakarsa
                </p>
                <p className="text-sm text-gray-500">
                  Ruko Kahfi Signature, Jl. Moh. Kahfi 1 No.10I, RT.7/RW.2, Ciganjur, Kec. Jagakarsa, Kota Jakarta Selatan, DKI Jakarta 12630
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-teal-600 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            
            <h3
              className="text-2xl font-semibold text-gray-800 mb-3"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Booking Submitted!
            </h3>
            
            <p className="text-gray-500 text-base mb-8 leading-relaxed">
              Booking submitted successfully!
              <br />
              Our team will contact you directly.
            </p>

            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-full transition-all cursor-pointer shadow-md shadow-teal-100"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
