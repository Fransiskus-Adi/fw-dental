"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
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
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/services")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load services");
        return res.json();
      })
      .then((data) => setServices(data))
      .catch((err) => console.error("Error loading services:", err));
  }, []);

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
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to schedule appointment");
      }

      alert("Booking submitted successfully! We will contact you shortly.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        serviceId: "",
        date: "",
        time: "",
      });
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
              <select
                value={formData.serviceId}
                onChange={(e) =>
                  setFormData({ ...formData, serviceId: e.target.value })
                }
                className="w-full h-14 rounded-full border border-gray-200 px-6 text-base bg-white text-gray-700 outline-none focus:border-teal-500"
                required
              >
                <option value="" disabled>Select Treatment or Service</option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    placeholder="Select Date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="h-14 rounded-full border-gray-200 pl-12 pr-6 text-base bg-white placeholder:text-gray-400"
                    required
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="time"
                    placeholder="Select Time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="h-14 rounded-full border-gray-200 pl-12 pr-6 text-base bg-white placeholder:text-gray-400"
                    required
                  />
                </div>
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.733518386348!2d106.81185811476949!3d-6.347407000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjAnNTAuNyJTIDEwNsKwNDgnNTAuNiJF!5e0!3m2!1sen!2sid!4v1692451200000!5m2!1sen!2sid"
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
              href="https://share.google/H9R9nFpGj79740GIv"
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
                  Jl. Moch. Kahfi II No. 180, Jagakarsa, Jakarta Selatan
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
