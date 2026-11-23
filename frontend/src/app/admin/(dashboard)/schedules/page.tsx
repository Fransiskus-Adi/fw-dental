"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminAccess } from "@/lib/admin-access-context";
import { staffFetch } from "@/lib/staff-fetch";

interface Doctor {
  id: string;
  name: string;
  days?: string[];
  shiftStart?: string;
  shiftEnd?: string;
}

interface Appointment {
  id: string;
  bookingDate: string;
  startTime: string;
  statusCode: string;
  doctorId?: string;
  doctor?: Doctor;
  patient?: { fullName: string };
  service?: { name: string };
}

const weekdays = new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" });
const weekLabels = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const clinicDate = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
const asDate = (date: string) => new Date(date + "T12:00:00Z");

function addDays(date: string, days: number) {
  const result = asDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export default function AdminSchedulesPage() {
  const { can } = useAdminAccess();
  const [date, setDate] = useState(clinicDate);
  const [doctorId, setDoctorId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    return Promise.all([
      staffFetch("/doctors", { signal }),
      staffFetch("/bookings", { signal }),
    ])
      .then(async ([doctorResponse, bookingResponse]) => {
        if (!doctorResponse.ok || !bookingResponse.ok) throw new Error("Could not load the schedule.");
        const [doctorData, bookingData] = await Promise.all([doctorResponse.json(), bookingResponse.json()]);
        if (!signal?.aborted) {
          setDoctors(doctorData);
          setAppointments(bookingData);
        }
      })
      .catch(() => {
        if (!signal?.aborted) setLoadError("Could not load the schedule. Check your connection and try again.");
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const monday = addDays(date, -((asDate(date).getUTCDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, day) => addDays(monday, day));
  const visible = (appointments ?? []).filter((appointment) =>
    appointment.statusCode !== "CANCELLED" && (!doctorId || appointment.doctorId === doctorId),
  );
  const appointmentsOn = (day: string) => visible.filter((appointment) => appointment.bookingDate === day)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
  const daily = appointmentsOn(date);
  const selected = visible.find((appointment) => appointment.id === selectedId && week.includes(appointment.bookingDate));
  const workingToday = doctors.filter((doctor) =>
    (!doctorId || doctor.id === doctorId) && doctor.days?.includes(weekdays.format(asDate(date))),
  );
  const hours = Array.from(new Set([
    ...Array.from({ length: 10 }, (_, hour) => hour + 8),
    ...visible.filter((appointment) => week.includes(appointment.bookingDate))
      .map((appointment) => Number(appointment.startTime.slice(0, 2))),
  ])).sort((left, right) => left - right);

  async function cancelAppointment(appointment: Appointment) {
    if (cancelling || !confirm("Cancel this appointment?")) return;
    setCancelError("");
    setCancelling(appointment.id);
    try {
      const response = await staffFetch(`/bookings/${appointment.id}/cancel`, { method: "PATCH" });
      if (!response.ok) throw new Error();
      setAppointments((current) => current?.filter(({ id }) => id !== appointment.id) ?? null);
      setSelectedId(null);
    } catch {
      setCancelError("Could not cancel the appointment. Check your connection and try again.");
    } finally {
      setCancelling(null);
    }
  }

  const dateButton = "grid size-11 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-teal-800 hover:bg-teal-50";
  const field = "min-h-11 min-w-0 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-800";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Schedules</h2>
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 items-end gap-2">
          <button type="button" aria-label="Previous day" className={dateButton + " xl:hidden"} onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label="Previous week" className={dateButton + " hidden xl:grid"} onClick={() => setDate(addDays(date, -7))}><ChevronLeft className="size-5" /></button>
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-gray-700">
            Date
            <input type="date" className={field} value={date} onChange={(event) => event.target.value && setDate(event.target.value)} />
          </label>
          <button type="button" aria-label="Next day" className={dateButton + " xl:hidden"} onClick={() => setDate(addDays(date, 1))}><ChevronRight className="size-5" /></button>
          <button type="button" aria-label="Next week" className={dateButton + " hidden xl:grid"} onClick={() => setDate(addDays(date, 7))}><ChevronRight className="size-5" /></button>
        </div>
        <label className="grid min-w-0 gap-1 text-sm font-semibold text-gray-700 sm:w-60">
          Doctor
          <select className={field} value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
            <option value="">All doctors</option>
            {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
          </select>
        </label>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
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
      {cancelError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{cancelError}</p>}
      {!appointments && !loadError && <p role="status" className="text-sm text-gray-600">Loading schedule…</p>}

      {appointments && (
        <>
          <section className="space-y-3 xl:hidden" aria-label="Daily agenda">
            <h3 className="font-bold text-gray-800">{weekLabels.format(asDate(date))}</h3>
            {workingToday.length > 0 && (
              <ul aria-label="Doctors on shift" className="flex flex-wrap gap-2">
                {workingToday.map((doctor) => <li key={doctor.id} className="rounded-lg bg-teal-50 px-2 py-1 text-xs text-teal-900">{doctor.name} {doctor.shiftStart?.slice(0, 5)}–{doctor.shiftEnd?.slice(0, 5)}</li>)}
              </ul>
            )}
            {daily.length === 0 ? <p className="rounded-xl bg-white p-4 text-sm text-gray-600">No appointments for this date.</p> : (
              <ul className="space-y-2">
                {daily.map((appointment) => (
                  <li key={appointment.id} className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-start gap-3">
                      <time className="shrink-0 font-bold text-teal-800">{appointment.startTime.slice(0, 5)}</time>
                      <div className="min-w-0 break-words text-sm">
                        <p className="font-semibold text-gray-900">{appointment.patient?.fullName ?? "Unknown patient"}</p>
                        <p className="text-gray-600">{appointment.doctor?.name ?? "Unassigned"} · {appointment.service?.name ?? "Unknown treatment"}</p>
                      </div>
                    </div>
                    {can("feat_schedules_cancel") && appointment.statusCode !== "COMPLETED" && (
                      <button type="button" className="min-h-11 rounded-lg px-2 text-sm font-semibold text-red-700 hover:bg-red-50" disabled={cancelling !== null} onClick={() => void cancelAppointment(appointment)}>Cancel booking</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Weekly schedule" className="hidden space-y-3 xl:block">
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-3">
              <table className="w-full min-w-[700px] table-fixed text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="w-16 px-1 py-2">Time</th>
                    {week.map((day) => <th scope="col" key={day} className="px-1 py-2">{weekLabels.format(asDate(day))}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hour) => (
                    <tr key={hour} className="border-b border-gray-100 align-top">
                      <th scope="row" className="p-1 pt-3 font-medium text-gray-600">{String(hour).padStart(2, "0")}:00</th>
                      {week.map((day) => (
                        <td key={day} className="h-12 p-1">
                          {appointmentsOn(day).filter((appointment) => Number(appointment.startTime.slice(0, 2)) === hour).map((appointment) => (
                            <button type="button" key={appointment.id} aria-pressed={selectedId === appointment.id} className="mb-1 w-full rounded-lg border border-teal-100 bg-teal-50 p-2 text-left text-xs text-teal-950 hover:bg-teal-100 aria-pressed:border-teal-700" onClick={() => setSelectedId(appointment.id)}>
                              <span className="block font-semibold">{appointment.startTime.slice(0, 5)} · {appointment.patient?.fullName ?? "Unknown patient"}</span>
                              <span className="block break-words">{appointment.doctor?.name ?? "Unassigned"}</span>
                            </button>
                          ))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm"><strong>{selected.patient?.fullName}</strong> · {selected.service?.name} · {selected.doctor?.name} · {selected.startTime.slice(0, 5)}</p>
                {can("feat_schedules_cancel") && selected.statusCode !== "COMPLETED" && (
                  <button type="button" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" disabled={cancelling !== null} onClick={() => void cancelAppointment(selected)}>Cancel booking</button>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
