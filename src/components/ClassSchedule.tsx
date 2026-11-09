
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock3,
    MapPin,
    UserRound,
    ArrowRight,
    BookOpen,
    Coffee,
    LoaderCircle,
    RefreshCw,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Schedule = {
    id: string;
    subject_name: string;
    subject_code: string;
    lecturer: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string;
};

const days = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
];

const weekdayMap: Record<string, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
};

function getWIBInfo(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const getPart = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? "";

    const weekday = getPart("weekday");
    const hour = Number(getPart("hour"));
    const minute = Number(getPart("minute"));

    return {
        day: weekdayMap[weekday] ?? 1,
        minutes: hour * 60 + minute,
    };
}

function formatTime(time: string) {
    return time.slice(0, 5);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function getMinutes(time: string) {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
}

function getNextSchedule(
    schedules: Schedule[],
    today: number,
    currentMinutes: number
) {
    for (let offset = 0; offset < 7; offset++) {
        const targetDay = ((today - 1 + offset) % 7) + 1;

        const daySchedules = schedules
            .filter((schedule) => schedule.day_of_week === targetDay)
            .sort((a, b) =>
                a.start_time.localeCompare(b.start_time)
            );

        const upcoming = daySchedules.find((schedule) => {
            if (offset === 0) {
                return getMinutes(schedule.start_time) > currentMinutes;
            }

            return true;
        });

        if (upcoming) {
            return {
                schedule: upcoming,
                dayOffset: offset,
            };
        }
    }

    return null;
}

function ScheduleInformation({
    schedule,
}: {
    schedule: Schedule;
}) {
    return (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-400">
                    <UserRound size={17} />
                </div>

                <div>
                    <p className="text-xs text-slate-500">
                        Lecturer
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                        {schedule.lecturer}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-400">
                    <MapPin size={17} />
                </div>

                <div>
                    <p className="text-xs text-slate-500">
                        Room
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                        {schedule.room}
                    </p>
                </div>
            </div>

        </div>
    );
}

export default function ClassSchedule() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [now, setNow] = useState<Date | null>(null);

    async function fetchSchedules() {
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase
                .from("class_schedules")
                .select("*")
                .order("day_of_week", { ascending: true })
                .order("start_time", { ascending: true });

            if (error) {
                throw error;
            }

            setSchedules(data ?? []);
        } catch (err) {
            console.error("Failed to fetch schedules:", err);

            setError("Jadwal belum dapat dimuat. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    // Initialize WIB clock
    useEffect(() => {
        setNow(new Date());

        const interval = setInterval(() => {
            setNow(new Date());
        }, 30_000);

        return () => clearInterval(interval);
    }, []);

    // Fetch schedule data
    useEffect(() => {
        fetchSchedules();
    }, []);

    const scheduleInfo = useMemo(() => {
        if (!now) return null;

        const { day, minutes } = getWIBInfo(now);

        const todaySchedules = schedules
            .filter((schedule) => schedule.day_of_week === day)
            .sort((a, b) =>
                a.start_time.localeCompare(b.start_time)
            );

        const currentSchedule =
            todaySchedules.find((schedule) => {
                const start = getMinutes(schedule.start_time);
                const end = getMinutes(schedule.end_time);

                return minutes >= start && minutes < end;
            }) ?? null;

        const next = getNextSchedule(
            schedules,
            day,
            minutes
        );

        return {
            day,
            minutes,
            todaySchedules,
            currentSchedule,
            next,
        };
    }, [now, schedules]);

    const currentSchedule = scheduleInfo?.currentSchedule ?? null;
    const nextSchedule = scheduleInfo?.next ?? null;

    return (
        <section
            id="class-schedule"
            className="relative overflow-hidden bg-[#101722] px-5 py-20 text-white md:px-10 lg:py-28"
        >

            {/* Background Decoration */}
            <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

            <div className="relative mx-auto max-w-7xl">

                {/* Section Header */}
                <div className="mb-12 flex flex-wrap items-end justify-between gap-6">

                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />

                            <span className="text-[11px] font-semibold tracking-[0.2em] text-cyan-300">
                                CLASS SCHEDULE
                            </span>
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                            Stay on <span className="text-cyan-400">Track.</span>
                        </h2>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 md:text-base">
                            Keep up with your daily classes, know what
                            comes next, and never miss a moment of learning.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <CalendarDays
                            size={20}
                            className="text-cyan-400"
                        />

                        <div>
                            <p className="text-xs text-slate-500">
                                Today
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-200">
                                {now ? formatDate(now) : "Loading date..."}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                        <div className="text-center">
                            <LoaderCircle
                                size={30}
                                className="mx-auto animate-spin text-cyan-400"
                            />

                            <p className="mt-4 text-sm text-slate-400">
                                Loading class schedule...
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
                        <p className="text-sm text-red-300">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={fetchSchedules}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/15"
                        >
                            <RefreshCw size={15} />
                            Try Again
                        </button>
                    </div>
                )}

                {/* Schedule Content */}
                {!loading && !error && scheduleInfo && (

                    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">

                        {/* Current Class */}
                        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#172a3d] via-[#142334] to-[#101722] p-6 md:p-9">

                            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />

                            <div className="relative">

                                <div className="mb-8 flex items-center justify-between gap-3">

                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />

                                        <span className="text-xs font-bold tracking-[0.18em] text-cyan-300">
                                            {currentSchedule
                                                ? "NOW IN CLASS"
                                                : "CURRENT STATUS"}
                                        </span>
                                    </div>

                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-400">
                                        {days[scheduleInfo.day - 1]}
                                    </span>

                                </div>

                                {currentSchedule ? (

                                    <>
                                        <p className="text-sm text-slate-400">
                                            You are currently attending
                                        </p>

                                        <h3 className="mt-3 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
                                            {currentSchedule.subject_name}
                                        </h3>

                                        <p className="mt-3 text-sm font-medium tracking-wider text-cyan-400">
                                            {currentSchedule.subject_code}
                                        </p>

                                        <div className="mt-7 inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
                                            <Clock3
                                                size={16}
                                                className="text-cyan-300"
                                            />

                                            <span className="text-sm font-semibold text-cyan-100">
                                                {formatTime(currentSchedule.start_time)}
                                                {" - "}
                                                {formatTime(currentSchedule.end_time)}
                                            </span>
                                        </div>

                                        <ScheduleInformation
                                            schedule={currentSchedule}
                                        />
                                    </>

                                ) : (

                                    <div className="py-5">

                                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-cyan-400">
                                            <Coffee size={27} />
                                        </div>

                                        <h3 className="text-3xl font-bold md:text-4xl">
                                            Selamat beristirahat.
                                        </h3>

                                        <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                                            Saat ini tidak ada kelas yang
                                            sedang berlangsung. Gunakan
                                            waktu ini untuk beristirahat
                                            atau mempersiapkan kelas berikutnya.
                                        </p>

                                    </div>

                                )}

                            </div>
                        </div>

                        {/* Next Class */}
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

                            <div className="mb-8 flex items-center gap-2">
                                <ArrowRight
                                    size={17}
                                    className="text-cyan-400"
                                />

                                <span className="text-xs font-bold tracking-[0.18em] text-slate-300">
                                    UP NEXT
                                </span>
                            </div>

                            {nextSchedule ? (

                                <>
                                    <div className="mb-6">
                                        <p className="text-xs text-slate-500">
                                            {nextSchedule.dayOffset === 0
                                                ? "Later today"
                                                : nextSchedule.dayOffset === 1
                                                    ? "Tomorrow"
                                                    : days[
                                                    ((scheduleInfo.day - 1 + nextSchedule.dayOffset) % 7)
                                                    ]}
                                        </p>

                                        <h3 className="mt-3 text-2xl font-bold leading-snug">
                                            {nextSchedule.schedule.subject_name}
                                        </h3>

                                        <p className="mt-2 text-sm font-medium text-cyan-400">
                                            {nextSchedule.schedule.subject_code}
                                        </p>
                                    </div>

                                    <div className="space-y-5 border-t border-white/10 pt-6">

                                        <div className="flex items-center gap-3">
                                            <Clock3
                                                size={18}
                                                className="text-cyan-400"
                                            />

                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Time
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-200">
                                                    {formatTime(nextSchedule.schedule.start_time)}
                                                    {" - "}
                                                    {formatTime(nextSchedule.schedule.end_time)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <UserRound
                                                size={18}
                                                className="text-cyan-400"
                                            />

                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Lecturer
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-200">
                                                    {nextSchedule.schedule.lecturer}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <MapPin
                                                size={18}
                                                className="text-cyan-400"
                                            />

                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Room
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-200">
                                                    {nextSchedule.schedule.room}
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="mt-8 rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3">
                                        <p className="text-xs leading-5 text-slate-400">
                                            Make sure you're ready for
                                            your next class.
                                        </p>
                                    </div>
                                </>

                            ) : (

                                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                    <BookOpen
                                        size={32}
                                        className="text-slate-600"
                                    />

                                    <h3 className="mt-4 font-semibold text-slate-300">
                                        No upcoming classes
                                    </h3>

                                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                        There are no scheduled classes
                                        in the next seven days.
                                    </p>
                                </div>

                            )}

                        </div>

                    </div>
                )}

                {/* Today's Schedule */}
                {!loading && !error && scheduleInfo && (

                    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

                        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">

                            <div>
                                <h3 className="text-lg font-bold">
                                    Today's Classes
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Your daily class timeline.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">

                                <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                                    {scheduleInfo.todaySchedules.length} classes
                                </span>

                                <Link
                                    href="/schedule"
                                    className="group inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
                                >
                                    View Full Schedule

                                    <ArrowRight
                                        size={16}
                                        className="transition-transform group-hover:translate-x-1"
                                    />
                                </Link>

                            </div>

                        </div>

                        {scheduleInfo.todaySchedules.length > 0 ? (

                            <div className="space-y-0">

                                {scheduleInfo.todaySchedules.map((schedule, index) => {
                                    const isCurrent =
                                        scheduleInfo.minutes >= getMinutes(schedule.start_time) &&
                                        scheduleInfo.minutes < getMinutes(schedule.end_time);

                                    const isFinished =
                                        scheduleInfo.minutes >= getMinutes(schedule.end_time);

                                    return (
                                        <div
                                            key={schedule.id}
                                            className="relative flex gap-4 pb-7 last:pb-0 md:gap-6"
                                        >

                                            {/* Timeline */}
                                            <div className="flex w-20 shrink-0 flex-col items-end">
                                                <span className={`text-sm font-bold ${isCurrent
                                                        ? "text-cyan-400"
                                                        : "text-slate-300"
                                                    }`}>
                                                    {formatTime(schedule.start_time)}
                                                </span>

                                                <span className="mt-1 text-xs text-slate-500">
                                                    {formatTime(schedule.end_time)}
                                                </span>
                                            </div>

                                            <div className="relative flex flex-col items-center">
                                                <span className={`z-10 mt-1 h-3 w-3 rounded-full ${isCurrent
                                                        ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.7)]"
                                                        : isFinished
                                                            ? "bg-slate-600"
                                                            : "border-2 border-cyan-400 bg-[#101722]"
                                                    }`} />

                                                {index !== scheduleInfo.todaySchedules.length - 1 && (
                                                    <span className="absolute top-4 h-full w-px bg-white/10" />
                                                )}
                                            </div>

                                            {/* Class Details */}
                                            <div className={`min-w-0 flex-1 rounded-xl border p-4 transition ${isCurrent
                                                    ? "border-cyan-400/20 bg-cyan-400/5"
                                                    : "border-white/5 bg-white/[0.02]"
                                                }`}>

                                                <div className="flex flex-wrap items-center justify-between gap-2">

                                                    <h4 className={`text-sm font-bold ${isFinished
                                                            ? "text-slate-500"
                                                            : "text-slate-200"
                                                        }`}>
                                                        {schedule.subject_name}
                                                    </h4>

                                                    {isCurrent ? (
                                                        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-cyan-300">
                                                            ONGOING
                                                        </span>
                                                    ) : isFinished ? (
                                                        <span className="text-[10px] font-semibold text-slate-500">
                                                            COMPLETED
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-semibold text-slate-500">
                                                            UPCOMING
                                                        </span>
                                                    )}

                                                </div>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {schedule.subject_code}
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
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

                                        </div>
                                    );
                                })}

                            </div>

                        ) : (

                            <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
                                <Coffee
                                    size={27}
                                    className="mx-auto text-slate-600"
                                />

                                <p className="mt-3 text-sm font-medium text-slate-300">
                                    No classes today.
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Enjoy your free time!
                                </p>
                            </div>

                        )}

                    </div>

                )}

            </div>
        </section>
    );
}
