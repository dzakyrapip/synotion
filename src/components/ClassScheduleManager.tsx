
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CalendarDays,
    Clock3,
    MapPin,
    UserRound,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Plus,
    X,
} from "lucide-react";

type Schedule = {
    id: string;
    subject_name: string;
    subject_code: string;
    lecturer: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string;
    created_at: string;
    updated_at: string;
};

type ScheduleForm = {
    subject_name: string;
    subject_code: string;
    lecturer: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string;
};

const days = [
    { value: 1, label: "Senin" },
    { value: 2, label: "Selasa" },
    { value: 3, label: "Rabu" },
    { value: 4, label: "Kamis" },
    { value: 5, label: "Jumat" },
    { value: 6, label: "Sabtu" },
    { value: 7, label: "Minggu" },
];

const emptyForm: ScheduleForm = {
    subject_name: "",
    subject_code: "",
    lecturer: "",
    day_of_week: "1",
    start_time: "08:00",
    end_time: "10:00",
    room: "",
};

function getTodayIndonesia(): number {
    const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
    }).format(new Date());

    const weekdayMap: Record<string, number> = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 7,
    };

    return weekdayMap[weekday] ?? 1;
}

function formatTime(time: string) {
    return time.slice(0, 5);
}

function sortSchedules(items: Schedule[]) {
    return [...items].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week;
        }

        return a.start_time.localeCompare(b.start_time);
    });
}

export default function ClassScheduleManager() {
    const router = useRouter();

    // Data
    const [schedules, setSchedules] = useState<Schedule[]>([]);

    // Form
    const [form, setForm] = useState<ScheduleForm>(emptyForm);
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Status
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    // Pagination
    const [selectedDay, setSelectedDay] = useState(1);

    const isBusy = saving || deleting !== null;

    // Initialize today's day using WIB
    useEffect(() => {
        setSelectedDay(getTodayIndonesia());
    }, []);

    // Fetch schedules
    async function fetchSchedules() {
        setLoading(true);

        try {
            const response = await fetch("/admin/schedules", {
                method: "GET",
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Gagal mengambil jadwal."
                );
            }

            setSchedules(sortSchedules(data.schedules || []));
        } catch (error) {
            showMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil jadwal.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSchedules();
    }, []);

    // Message helper
    function showMessage(
        text: string,
        type: "success" | "error"
    ) {
        setMessage(text);
        setMessageType(type);
    }

    // Open add form
    function openAddForm() {
        setEditingId(null);
        setForm({
            ...emptyForm,
            day_of_week: String(selectedDay),
        });
        setMessage("");
        setFormOpen(true);
    }

    // Open edit form
    function openEditForm(schedule: Schedule) {
        setEditingId(schedule.id);

        setForm({
            subject_name: schedule.subject_name,
            subject_code: schedule.subject_code,
            lecturer: schedule.lecturer,
            day_of_week: String(schedule.day_of_week),
            start_time: formatTime(schedule.start_time),
            end_time: formatTime(schedule.end_time),
            room: schedule.room,
        });

        setMessage("");
        setFormOpen(true);

        window.scrollTo({
            top:
                (document.getElementById("class-schedule-manager")?.offsetTop ?? 0) - 100,
            behavior: "smooth",
        });
    }

    // Close form
    function closeForm() {
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    // Handle input changes
    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement
        >
    ) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    // Save schedule
    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSaving(true);
        setMessage("");

        try {
            const payload = {
                subject_name: form.subject_name.trim(),
                subject_code: form.subject_code.trim(),
                lecturer: form.lecturer.trim(),
                day_of_week: Number(form.day_of_week),
                start_time: form.start_time,
                end_time: form.end_time,
                room: form.room.trim(),
            };

            if (payload.start_time >= payload.end_time) {
                throw new Error(
                    "Jam selesai harus lebih besar dari jam mulai."
                );
            }

            const response = await fetch(
                editingId
                    ? `/admin/schedules/${editingId}`
                    : "/admin/schedules",
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Gagal menyimpan jadwal."
                );
            }

            const wasEditing = Boolean(editingId);

            closeForm();

            showMessage(
                wasEditing
                    ? "Jadwal berhasil diperbarui!"
                    : "Jadwal berhasil ditambahkan!",
                "success"
            );

            await fetchSchedules();

            setSelectedDay(payload.day_of_week);

            router.refresh();
        } catch (error) {
            showMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal menyimpan jadwal.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    }

    // Delete schedule
    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            "Apakah kamu yakin ingin menghapus jadwal ini?"
        );

        if (!confirmed) return;

        setDeleting(id);
        setMessage("");

        try {
            const response = await fetch(
                `/admin/schedules/${id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Gagal menghapus jadwal."
                );
            }

            setSchedules((current) =>
                current.filter((schedule) => schedule.id !== id)
            );

            showMessage("Jadwal berhasil dihapus!", "success");

            router.refresh();
        } catch (error) {
            showMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal menghapus jadwal.",
                "error"
            );
        } finally {
            setDeleting(null);
        }
    }

    // Pagination
    const selectedSchedules = schedules
        .filter((schedule) => schedule.day_of_week === selectedDay)
        .sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
        );

    const currentDay = days.find(
        (day) => day.value === selectedDay
    );

    function changeDay(direction: number) {
        setSelectedDay((current) => {
            return ((current - 1 + direction + 7) % 7) + 1;
        });
    }

    function selectToday() {
        setSelectedDay(getTodayIndonesia());
    }

    return (
        <div
            id="class-schedule-manager"
            className="mt-10 scroll-mt-8"
        >

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">
                            Class Schedule
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                        Manage your weekly class schedules.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    disabled={isBusy}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                >
                    <Plus size={17} />
                    Add Schedule
                </button>

            </div>

            {/* Message */}
            {message && (
                <div
                    className={`mb-5 rounded-xl px-4 py-3 text-sm ${
                        messageType === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                    }`}
                >
                    {message}
                </div>
            )}

            {/* Schedule Form */}
            {formOpen && (
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                    <div className="mb-6 flex items-center justify-between">

                        <div>
                            <h3 className="text-lg font-bold">
                                {editingId
                                    ? "Edit Schedule"
                                    : "Add New Schedule"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                Fill in the class information below.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close form"
                        >
                            <X size={20} />
                        </button>

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Subject */}
                        <div className="grid gap-5 md:grid-cols-2">

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Subject Name
                                </label>

                                <input
                                    type="text"
                                    name="subject_name"
                                    value={form.subject_name}
                                    onChange={handleChange}
                                    placeholder="Contoh: Pemrograman Web"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Subject Code
                                </label>

                                <input
                                    type="text"
                                    name="subject_code"
                                    value={form.subject_code}
                                    onChange={handleChange}
                                    placeholder="Contoh: PWEB-01"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                />
                            </div>

                        </div>

                        {/* Lecturer */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Lecturer
                            </label>

                            <input
                                type="text"
                                name="lecturer"
                                value={form.lecturer}
                                onChange={handleChange}
                                placeholder="Nama dosen pengampu"
                                required
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        {/* Day */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Day
                            </label>

                            <select
                                name="day_of_week"
                                value={form.day_of_week}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            >
                                {days.map((day) => (
                                    <option
                                        key={day.value}
                                        value={day.value}
                                    >
                                        {day.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Time */}
                        <div className="grid gap-5 md:grid-cols-2">

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Start Time
                                </label>

                                <input
                                    type="time"
                                    name="start_time"
                                    value={form.start_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    End Time
                                </label>

                                <input
                                    type="time"
                                    name="end_time"
                                    value={form.end_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                />
                            </div>

                        </div>

                        {/* Room */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Room
                            </label>

                            <input
                                type="text"
                                name="room"
                                value={form.room}
                                onChange={handleChange}
                                placeholder="Contoh: Lab RPL 1"
                                required
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={isBusy}
                                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Save Changes"
                                        : "Add Schedule"}
                            </button>

                        </div>

                    </form>
                </div>
            )}

            {/* Schedule List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                {/* List Header */}
                <div className="mb-6 flex items-center justify-between">

                    <div>
                        <h3 className="font-semibold">
                            Weekly Schedules
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                            Browse schedules by day.
                        </p>
                    </div>

                    <span className="text-xs text-slate-400">
                        {schedules.length} schedules
                    </span>

                </div>

                {/* Day Pagination */}
                <div className="mb-6">

                    <div className="flex items-center justify-between gap-2">

                        <button
                            type="button"
                            onClick={() => changeDay(-1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                            aria-label="Previous day"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex flex-1 justify-center gap-1.5 overflow-x-auto">

                            {days.map((day) => {
                                const count = schedules.filter(
                                    (schedule) =>
                                        schedule.day_of_week === day.value
                                ).length;

                                const isActive =
                                    selectedDay === day.value;

                                return (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() =>
                                            setSelectedDay(day.value)
                                        }
                                        className={`relative flex min-w-10 flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                                : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                        }`}
                                    >
                                        <span>
                                            {day.label.slice(0, 3)}
                                        </span>

                                        <span
                                            className={`mt-1 text-[10px] ${
                                                isActive
                                                    ? "text-blue-200"
                                                    : "text-slate-400"
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}

                        </div>

                        <button
                            type="button"
                            onClick={() => changeDay(1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                            aria-label="Next day"
                        >
                            <ChevronRight size={20} />
                        </button>

                    </div>
                </div>

                {/* Selected Day Header */}
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">

                    <div>
                        <h4 className="text-lg font-bold text-slate-800">
                            {currentDay?.label}
                        </h4>

                        <p className="mt-1 text-xs text-slate-400">
                            {selectedSchedules.length} classes scheduled
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={selectToday}
                        className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                        Today
                    </button>

                </div>

                {/* Schedule Content */}
                {loading ? (

                    <div className="py-12 text-center text-sm text-slate-400">
                        Loading schedules...
                    </div>

                ) : selectedSchedules.length === 0 ? (

                    <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">

                        <CalendarDays
                            size={36}
                            className="mx-auto text-slate-300"
                        />

                        <h3 className="mt-4 font-semibold text-slate-700">
                            No classes scheduled
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            There are no classes on {currentDay?.label}.
                        </p>

                        <button
                            type="button"
                            onClick={openAddForm}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            <Plus size={16} />
                            Add Schedule
                        </button>

                    </div>

                ) : (

                    <div className="space-y-3">

                        {selectedSchedules.map((schedule, index) => (

                            <div
                                key={schedule.id}
                                className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200"
                            >

                                {/* Number */}
                                <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 sm:flex">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                {/* Time */}
                                <div className="min-w-28 rounded-lg bg-blue-50 px-3 py-2 text-center">

                                    <div className="flex items-center justify-center gap-1">
                                        <Clock3
                                            size={12}
                                            className="text-blue-600"
                                        />

                                        <span className="text-xs font-semibold text-blue-600">
                                            {formatTime(schedule.start_time)}
                                        </span>
                                    </div>

                                    <p className="my-1 text-xs text-slate-400">
                                        to
                                    </p>

                                    <p className="text-xs font-semibold text-blue-600">
                                        {formatTime(schedule.end_time)}
                                    </p>

                                </div>

                                {/* Information */}
                                <div className="min-w-0 flex-1">

                                    <h5 className="text-sm font-bold text-slate-800">
                                        {schedule.subject_name}
                                    </h5>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {schedule.subject_code}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">

                                        <span className="flex items-center gap-1.5">
                                            <UserRound size={13} />
                                            {schedule.lecturer}
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={13} />
                                            {schedule.room}
                                        </span>

                                    </div>

                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditForm(schedule)
                                        }
                                        disabled={isBusy}
                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                                    >
                                        <Pencil size={13} />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDelete(schedule.id)
                                        }
                                        disabled={isBusy}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Trash2 size={13} />

                                        {deleting === schedule.id
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

                {/* Pagination Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">

                    <button
                        type="button"
                        onClick={() => changeDay(-1)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
                    >
                        <ChevronLeft size={15} />
                        Previous Day
                    </button>

                    <span className="text-xs text-slate-400">
                        {selectedDay} / 7
                    </span>

                    <button
                        type="button"
                        onClick={() => changeDay(1)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
                    >
                        Next Day
                        <ChevronRight size={15} />
                    </button>

                </div>

            </div>
        </div>
    );
}
