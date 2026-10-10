import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageFrame from "../components/PageFrame";
import Modal from "../components/Modal";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import { patientsListPath } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import type { Appointment, Doctor, Patient } from "../utils/types";
import SearchablePatientSelect from "../components/SearchablePatientSelect";
import { patientIdentifier, patientTypeLabel } from "../utils/patient";

const CANCELLABLE_STATUSES = new Set(["unassigned", "pending", "confirmed", "needs_reassignment"]);
const FORM_FIELDS = [
  "patientId",
  "doctorId",
  "appointmentDate",
  "reason",
  "notes",
  "durationMinutes",
  "cancellationReason",
];

const emptyScheduleForm = {
  patientId: "",
  doctorId: "",
  date: "",
  time: "",
  reason: "",
};

const emptyRescheduleForm = {
  doctorId: "",
  date: "",
  time: "",
  reason: "",
  notes: "",
  durationMinutes: "30",
};

function localDateKey(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function localDateTimeParts(value: string): { date: string; time: string } {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function appointmentDate(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

function doctorIdValue(doctor: Doctor | string | null | undefined): string {
  return doctor && typeof doctor === "object" ? doctor._id : doctor ?? "";
}

function patientName(patient: Patient | string | null): string {
  if (patient && typeof patient === "object") {
    return `${patient.firstName} ${patient.lastName}`;
  }
  return patient ? String(patient) : "Unknown patient";
}

function doctorName(doctor: Doctor | string | null | undefined): string {
  if (doctor && typeof doctor === "object") return doctor.name;
  return doctor ? String(doctor) : "Unassigned";
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

const statusTone: Record<string, string> = {
  unassigned: "bg-amber-100 text-amber-800",
  pending: "bg-slate-100 text-slate-700",
  needs_reassignment: "bg-orange-100 text-orange-800",
  confirmed: "bg-slate-950 text-white",
  checked_in: "bg-violet-100 text-violet-700",
  cancelled: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700",
};

function AppointmentsPage({ embedded = false }: { embedded?: boolean }) {
  const { role, can } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canManage = can("manageAppointments");
  const canAssignDoctor = can("selectDoctorForAppointment");
  const isDoctor = role === "doctor";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [submittedDate, setSubmittedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(canManage);
  const [error, setError] = useState("");
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [saving, setSaving] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState(emptyRescheduleForm);
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [checkingInId, setCheckingInId] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [declineTarget, setDeclineTarget] = useState<Appointment | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const {
    formError,
    fieldErrors,
    applyError,
    reset: resetFormErrors,
    clearField,
    unmatchedFieldErrors,
  } = useFormErrors();

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchAppointments = async (
    requestedPage = page,
    query = submittedSearch,
    date = submittedDate,
  ) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: String(limit),
      });
      if (query) params.set("search", query);
      if (date) params.set("date", date);
      const response = await api.get<Appointment[]>(`/appointments?${params}`);
      setAppointments(response.data);
      setTotal(response.pagination?.total ?? response.data.length);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load appointments",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAppointments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, submittedDate, submittedSearch]);

  useEffect(() => {
    if (!canManage) {
      setOptionsLoading(false);
      return;
    }

    const patientsPath = patientsListPath(role);
    if (!patientsPath) {
      setOptionsLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all([
      api.getAll<Patient>(patientsPath),
      canAssignDoctor
        ? api.get<Doctor[]>("/users/doctors")
        : Promise.resolve({ data: [] as Doctor[] }),
    ])
      .then(([patientResponse, doctorResponse]) => {
        if (cancelled) return;
        setPatients(patientResponse.data);
        setDoctors(doctorResponse.data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load students and doctors",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canAssignDoctor, canManage, role]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    setPage(1);
    if (query === submittedSearch && dateFilter === submittedDate) {
      void fetchAppointments(1, query, dateFilter);
    } else {
      setSubmittedSearch(query);
      setSubmittedDate(dateFilter);
    }
  };

  const applyDateFilter = (date: string) => {
    const query = search.trim();
    setDateFilter(date);
    setSubmittedDate(date);
    setSubmittedSearch(query);
    setPage(1);
  };

  const clearAppointmentFilters = () => {
    setSearch("");
    setSubmittedSearch("");
    setDateFilter("");
    setSubmittedDate("");
    setPage(1);
  };

  const setScheduleField = (field: keyof typeof scheduleForm, value: string) => {
    setScheduleForm((current) => ({ ...current, [field]: value }));
    clearField(field === "date" || field === "time" ? "appointmentDate" : field);
  };

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    resetFormErrors();
    try {
      const response = await api.post("/appointments", {
        patientId: scheduleForm.patientId,
        ...(canAssignDoctor && scheduleForm.doctorId
          ? { doctorId: scheduleForm.doctorId }
          : {}),
        appointmentDate: appointmentDate(scheduleForm.date, scheduleForm.time),
        reason: scheduleForm.reason,
        durationMinutes: 30,
      });
      showToast(response.message);
      setScheduleForm(emptyScheduleForm);
      setPage(1);
      await fetchAppointments(1, submittedSearch);
    } catch (requestError: unknown) {
      applyError(requestError, "Unable to schedule appointment");
    } finally {
      setSaving(false);
    }
  };

  const openReschedule = (item: Appointment) => {
    const parts = localDateTimeParts(item.appointmentDate);
    setRescheduleTarget(item);
    setRescheduleForm({
      doctorId: doctorIdValue(item.doctorId),
      date: parts.date,
      time: parts.time,
      reason: item.reason,
      notes: item.notes ?? "",
      durationMinutes: String(item.durationMinutes ?? 30),
    });
    resetFormErrors();
  };

  const setRescheduleField = (
    field: keyof typeof rescheduleForm,
    value: string,
  ) => {
    setRescheduleForm((current) => ({ ...current, [field]: value }));
    clearField(field === "date" || field === "time" ? "appointmentDate" : field);
  };

  const handleReschedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduling(true);
    resetFormErrors();
    try {
      const response = await api.put(`/appointments/${rescheduleTarget._id}`, {
        ...(canAssignDoctor && rescheduleForm.doctorId
          ? { doctorId: rescheduleForm.doctorId }
          : {}),
        appointmentDate: appointmentDate(rescheduleForm.date, rescheduleForm.time),
        reason: rescheduleForm.reason,
        notes: rescheduleForm.notes || undefined,
        durationMinutes: Number(rescheduleForm.durationMinutes),
      });
      showToast(response.message);
      setRescheduleTarget(null);
      await fetchAppointments(page);
    } catch (requestError: unknown) {
      applyError(requestError, "Unable to reschedule appointment");
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (cancellationReason.trim().length < 3) {
      setCancellationError("Please enter a short reason for the cancellation.");
      return;
    }
    setCancelling(true);
    try {
      const response = await api.put(`/appointments/${cancelTarget._id}`, {
        status: "cancelled",
        cancellationReason: cancellationReason.trim(),
      });
      showToast(response.message);
      setCancelTarget(null);
      setCancellationReason("");
      setCancellationError("");
      await fetchAppointments(page);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel appointment",
      );
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckIn = async (item: Appointment) => {
    setCheckingInId(item._id);
    setError("");
    try {
      const response = await api.post(`/appointments/${item._id}/check-in`, {});
      showToast(response.message);
      await fetchAppointments(page);
      navigate(embedded ? "/dashboard?view=visits" : "/patient-queue");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error ? requestError.message : "Check-in failed",
      );
    } finally {
      setCheckingInId("");
    }
  };

  const handleDoctorConfirm = async (item: Appointment) => {
    setConfirmingId(item._id);
    setError("");
    try {
      const response = await api.put(`/appointments/${item._id}/confirm`, {});
      showToast(response.message);
      await fetchAppointments(page);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to confirm appointment",
      );
    } finally {
      setConfirmingId("");
    }
  };

  const handleDoctorDecline = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!declineTarget) return;
    setDeclining(true);
    setError("");
    try {
      const response = await api.put(`/appointments/${declineTarget._id}/decline`, {
        reason: declineReason.trim(),
      });
      showToast(response.message);
      setDeclineTarget(null);
      setDeclineReason("");
      await fetchAppointments(page, submittedSearch);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to decline appointment");
    } finally {
      setDeclining(false);
    }
  };

  const selectedPatient = patients.find(
    (patient) => patient._id === scheduleForm.patientId,
  );
  const selectedDoctor = doctors.find(
    (doctor) => doctor._id === scheduleForm.doctorId,
  );
  const scheduleComplete = Boolean(
    selectedPatient &&
    (!canAssignDoctor || selectedDoctor) &&
    scheduleForm.date &&
    scheduleForm.time &&
    scheduleForm.reason.trim(),
  );

  return (
    <PageFrame embedded={embedded}>
      <div className="space-y-5">
        {!embedded && (
          <div>
            <p className="text-sm text-slate-500">School Clinic Management</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Appointments
            </h2>
          </div>
        )}

        {canManage && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="text-lg font-semibold text-slate-900">
              {canAssignDoctor ? "Schedule New Appointment" : "Request New Appointment"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {canAssignDoctor
                ? "Choose an available doctor. The doctor will confirm or return the appointment for reassignment."
                : "Enter the request details. A nurse will assign an available doctor."}
            </p>
            <form onSubmit={handleSchedule} className="mt-6 space-y-4">
              {formError && (
                <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {formError}
                </p>
              )}
              <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    <span className="mr-2 text-blue-600">1.</span>Patient
                  </label>
                  <SearchablePatientSelect
                    patients={patients}
                    value={scheduleForm.patientId}
                    onChange={(patientId) => setScheduleField("patientId", patientId)}
                    disabled={optionsLoading}
                  />
                  <FieldError message={fieldErrors.patientId} />
                </div>

                {canAssignDoctor && <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    <span className="mr-2 text-blue-600">2.</span>Assigned Doctor
                  </label>
                  <select
                    value={scheduleForm.doctorId}
                    onChange={(event) =>
                      setScheduleField("doctorId", event.target.value)
                    }
                    disabled={optionsLoading}
                    required
                    className={`input w-full ${fieldErrors.doctorId ? "input-error" : ""}`}
                  >
                    <option value="" disabled>
                      {optionsLoading ? "Loading doctors..." : "Select doctor..."}
                    </option>
                    {doctors
                      .filter((doctor) => doctor.isAvailable !== false)
                      .map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name}
                          {doctor.scheduleNotes ? ` — ${doctor.scheduleNotes}` : ""}
                        </option>
                      ))}
                  </select>
                  <FieldError message={fieldErrors.doctorId} />
                </div>}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    <span className="mr-2 text-blue-600">{canAssignDoctor ? "3." : "2."}</span>Date
                  </label>
                  <input
                    type="date"
                    min={localDateKey()}
                    value={scheduleForm.date}
                    onChange={(event) => setScheduleField("date", event.target.value)}
                    required
                    className={`input w-full ${fieldErrors.appointmentDate ? "input-error" : ""}`}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    <span className="mr-2 text-blue-600">{canAssignDoctor ? "3." : "2."}</span>Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(event) => setScheduleField("time", event.target.value)}
                    required
                    className={`input w-full ${fieldErrors.appointmentDate ? "input-error" : ""}`}
                  />
                </div>
              </div>
              <FieldError message={fieldErrors.appointmentDate} />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                  <span className="mr-2 text-blue-600">{canAssignDoctor ? "4." : "3."}</span>Reason for Visit
                </label>
                <input
                  value={scheduleForm.reason}
                  onChange={(event) =>
                    setScheduleField("reason", event.target.value)
                  }
                  placeholder="Reason for appointment..."
                  required
                  className={`input w-full ${fieldErrors.reason ? "input-error" : ""}`}
                />
                <FieldError message={fieldErrors.reason} />
              </div>

              {scheduleComplete && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Appointment summary</p>
                  <p className="mt-1">
                    {selectedPatient?.firstName} {selectedPatient?.lastName}{" "}
                    {selectedDoctor ? `with ${selectedDoctor.name} ` : ""}on{" "}
                    {new Date(
                      `${scheduleForm.date}T${scheduleForm.time}`,
                    ).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    Status after sending: {canAssignDoctor ? "Pending doctor confirmation" : "Waiting for nurse assignment"}
                  </p>
                  <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                    The patient will receive scheduling and doctor-confirmation emails when a valid email address is saved in their record.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || optionsLoading}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : canAssignDoctor
                    ? "Send Appointment to Doctor"
                    : "Submit Appointment Request"}
              </button>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <h3 className="text-lg font-semibold text-slate-900">
              Upcoming Appointments
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Review scheduled visits and manage appointment changes.
            </p>
            <form onSubmit={handleSearch} className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, ID, doctor, reason, or status..."
                aria-label="Search appointments"
                className="input min-w-0 flex-1"
              />
              <label className="relative">
                <span className="sr-only">Filter appointments by date</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => applyDateFilter(event.target.value)}
                  aria-label="Filter appointments by date"
                  className="input w-full sm:w-44"
                />
              </label>
              <button
                type="button"
                onClick={() => applyDateFilter(localDateKey())}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  submittedDate === localDateKey()
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Today
              </button>
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Apply Filters
              </button>
              {(submittedSearch || submittedDate) && (
                <button
                  type="button"
                  onClick={clearAppointmentFilters}
                  className="text-left text-sm font-medium text-slate-500 hover:text-slate-800 sm:col-start-1"
                >
                  Clear all filters
                </button>
              )}
            </form>
            {submittedDate && (
              <p className="mt-2 text-xs text-slate-500">
                Showing appointments on <strong className="text-slate-700">{new Date(`${submittedDate}T00:00:00`).toLocaleDateString([], { dateStyle: "long" })}</strong>
                {submittedSearch ? " matching your search" : ""}.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span><strong className="text-slate-700">Unassigned:</strong> waiting for a nurse</span>
              <span><strong className="text-slate-700">Pending:</strong> waiting for doctor confirmation</span>
              <span><strong className="text-slate-700">Confirmed:</strong> accepted by the doctor</span>
              <span><strong className="text-slate-700">Checked in:</strong> student has arrived</span>
            </div>
          </div>

          {error && (
            <p className="mx-5 mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 sm:mx-7">
              {error}
            </p>
          )}

          {loading ? (
            <p className="px-7 py-12 text-center text-sm text-slate-500">
              Loading appointments...
            </p>
          ) : appointments.length === 0 ? (
            <p className="px-7 py-12 text-center text-sm text-slate-500">
              {submittedSearch || submittedDate
                ? "No appointments match the selected filters."
                : "No appointments have been scheduled yet."}
            </p>
          ) : (
            <div className="overflow-x-auto px-5 pb-5 sm:px-7 sm:pb-7">
              <table className="mt-3 w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Time</th>
                    <th className="px-2 py-3 font-medium">Patient</th>
                    <th className="px-2 py-3 font-medium">Doctor</th>
                    <th className="px-2 py-3 font-medium">Reason</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                    {(canManage || isDoctor) && (
                      <th className="px-2 py-3 font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((item) => {
                    const startsAt = new Date(item.appointmentDate);
                    const canCheckIn =
                      item.status === "confirmed" &&
                      localDateKey(startsAt) === localDateKey();
                    const canReschedule =
                      item.status !== "checked_in" && item.status !== "completed";
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-2 py-4">
                          {startsAt.toLocaleDateString("en-CA")}
                        </td>
                        <td className="whitespace-nowrap px-2 py-4 font-medium">
                          {startsAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-2 py-4">
                          <p className="font-medium text-slate-900">
                            {patientName(item.patientId)}
                          </p>
                          {item.patientId && typeof item.patientId === "object" && (
                            <p className="mt-0.5 font-mono text-xs text-slate-400">
                              {patientIdentifier(item.patientId)} · {patientTypeLabel(item.patientId)}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-4 text-slate-600">
                          {doctorName(item.doctorId)}
                        </td>
                        <td className="max-w-xs px-2 py-4 text-slate-700">
                          {item.reason}
                        </td>
                        <td className="px-2 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                              statusTone[item.status] ?? "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabel(item.status)}
                          </span>
                          {item.declineReason && (
                            <p className="mt-1 max-w-48 whitespace-normal text-xs text-rose-600">
                              Doctor: {item.declineReason}
                            </p>
                          )}
                        </td>
                        {(canManage || isDoctor) && (
                          <td className="whitespace-nowrap px-2 py-4">
                            <div className="flex items-center gap-2">
                              {canManage && canReschedule && (
                                <button
                                  type="button"
                                  onClick={() => openReschedule(item)}
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
                                >
                                  {canAssignDoctor && (item.status === "unassigned" || item.status === "needs_reassignment")
                                    ? "Assign Doctor"
                                    : "Reschedule"}
                                </button>
                              )}
                              {canManage && CANCELLABLE_STATUSES.has(item.status) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelTarget(item);
                                    setCancellationReason("");
                                    setCancellationError("");
                                  }}
                                  className="px-2 py-2 text-xs font-medium text-rose-600 hover:text-rose-700"
                                >
                                  Cancel
                                </button>
                              )}
                              {canManage && canCheckIn && (
                                <button
                                  type="button"
                                  onClick={() => handleCheckIn(item)}
                                  disabled={checkingInId === item._id}
                                  className="px-2 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                >
                                  {checkingInId === item._id
                                    ? "Checking in..."
                                    : "Check In"}
                                </button>
                              )}
                              {canManage && item.status === "checked_in" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      embedded
                                        ? "/dashboard?view=visits"
                                        : "/patient-queue",
                                    )
                                  }
                                  className="px-2 py-2 text-xs font-medium text-violet-600"
                                >
                                  View Queue
                                </button>
                              )}
                              {isDoctor && item.status === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDoctorConfirm(item)}
                                    disabled={confirmingId === item._id}
                                    className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                                  >
                                    {confirmingId === item._id ? "Confirming..." : "Confirm"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setDeclineTarget(item); setDeclineReason(""); }}
                                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              {isDoctor && item.status === "confirmed" && (
                                <span className="text-xs font-medium text-emerald-700">
                                  Ready for appointment
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm sm:px-7">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      {rescheduleTarget && (
        <Modal
          title={`Reschedule ${patientName(rescheduleTarget.patientId)}`}
          onClose={() => setRescheduleTarget(null)}
          closeDisabled={rescheduling}
        >
          <form onSubmit={handleReschedule} className="space-y-4">
            {formError && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {formError}
              </p>
            )}
            <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />

            {canAssignDoctor && <div>
              <label className="mb-1 block text-sm font-medium">Doctor</label>
              <select
                value={rescheduleForm.doctorId}
                onChange={(event) =>
                  setRescheduleField("doctorId", event.target.value)
                }
                required
                className={`input w-full ${fieldErrors.doctorId ? "input-error" : ""}`}
              >
                <option value="" disabled>Select doctor...</option>
                {doctors
                  .filter(
                    (doctor) =>
                      doctor.isAvailable !== false ||
                      doctor._id === rescheduleForm.doctorId,
                  )
                  .map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name}
                    </option>
                  ))}
              </select>
              <FieldError message={fieldErrors.doctorId} />
            </div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  min={localDateKey()}
                  value={rescheduleForm.date}
                  onChange={(event) =>
                    setRescheduleField("date", event.target.value)
                  }
                  required
                  className={`input w-full ${fieldErrors.appointmentDate ? "input-error" : ""}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Time</label>
                <input
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(event) =>
                    setRescheduleField("time", event.target.value)
                  }
                  required
                  className={`input w-full ${fieldErrors.appointmentDate ? "input-error" : ""}`}
                />
              </div>
            </div>
            <FieldError message={fieldErrors.appointmentDate} />

            <div>
              <label className="mb-1 block text-sm font-medium">Reason</label>
              <input
                value={rescheduleForm.reason}
                onChange={(event) =>
                  setRescheduleField("reason", event.target.value)
                }
                required
                className={`input w-full ${fieldErrors.reason ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.reason} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={rescheduleForm.durationMinutes}
                onChange={(event) =>
                  setRescheduleField("durationMinutes", event.target.value)
                }
                required
                className={`input w-full ${fieldErrors.durationMinutes ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.durationMinutes} />
              <p className="mt-1 text-xs text-amber-700">
                Rescheduling returns the appointment to pending so the doctor can confirm the new schedule.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                rows={3}
                value={rescheduleForm.notes}
                onChange={(event) =>
                  setRescheduleField("notes", event.target.value)
                }
                className={`input w-full ${fieldErrors.notes ? "input-error" : ""}`}
              />
              <FieldError message={fieldErrors.notes} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={rescheduling}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {rescheduling ? "Saving..." : "Save New Schedule"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {cancelTarget && (
        <Modal title="Cancel appointment" onClose={() => setCancelTarget(null)} closeDisabled={cancelling}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Cancel the appointment for{" "}
              <strong>{patientName(cancelTarget.patientId)}</strong> on{" "}
              {new Date(cancelTarget.appointmentDate).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              . The student will receive the reason below.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Cancellation reason
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={cancellationReason}
                onChange={(event) => {
                  setCancellationReason(event.target.value);
                  setCancellationError("");
                }}
                placeholder="Example: Doctor unavailable; please contact the clinic for a new schedule."
                className={`input w-full ${cancellationError ? "input-error" : ""}`}
              />
              {cancellationError && (
                <p className="mt-1 text-xs text-rose-600">{cancellationError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Appointment"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {declineTarget && (
        <Modal
          title="Decline appointment"
          onClose={() => setDeclineTarget(null)}
          closeDisabled={declining}
        >
          <form onSubmit={handleDoctorDecline} className="space-y-4">
            <p className="text-sm text-slate-600">
              This appointment will return to the nurse for reassignment. It will not be cancelled.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Reason for declining
              </label>
              <textarea
                rows={3}
                minLength={3}
                maxLength={500}
                required
                value={declineReason}
                onChange={(event) => setDeclineReason(event.target.value)}
                placeholder="Example: Not available at the scheduled time"
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
              >
                Keep Pending
              </button>
              <button
                type="submit"
                disabled={declining || declineReason.trim().length < 3}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {declining ? "Returning..." : "Decline and Return"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageFrame>
  );
}

export default AppointmentsPage;
