
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    CalendarDays,
    Clock3,
    MapPin,
    UserRound,
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

const DAYS = [
    { id: 1, name: "Monday", short: "MON" },
    { id: 2, name: "Tuesday", short: "TUE" },
    { id: 3, name: "Wednesday", short: "WED" },
    { id: 4, name: "Thursday", short: "THU" },
    { id: 5, name: "Friday", short: "FRI" },
    { id: 6, name: "Saturday", short: "SAT" },
    { id: 7, name: "Sunday", short: "SUN" },
];

function formatTime(time: string) {
    return time.slice(0, 5);
}

export default function SubjectsPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchSchedules() {
            const { data, error } = await supabase
                .from("class_schedules")
                .select("*")
                .order("day_of_week", { ascending: true })
                .order("start_time", { ascending: true });

            if (error) {
                setError("Failed to load class schedules.");
                setLoading(false);
                return;
            }

            setSchedules(data ?? []);
            setLoading(false);
        }

        fetchSchedules();
    }, []);

    const groupedSchedules = useMemo(() => {
        return DAYS.map((day) => ({
            ...day,
            subjects: schedules.filter(
                (schedule) => schedule.day_of_week === day.id
            ),
        }));
    }, [schedules]);

    const totalSubjects = schedules.length;

    return (
        <main className="min-h-screen bg-[#101722] px-5 pb-24 pt-32 text-white sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-12">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                        <BookOpen size={16} />
                        Academic Information
                    </div>

                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                        Class <span className="text-cyan-400">Subjects.</span>
                    </h1>

                    <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                        Explore our complete weekly class schedule,
                        including subject details, lecturers, class times,
                        and classroom locations.
                    </p>
                </div>

                {/* Statistics */}
                <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-[#151f2d] p-5">
                        <div className="mb-3 flex items-center gap-2 text-slate-400">
                            <BookOpen size={17} />
                            <span className="text-xs font-medium uppercase tracking-wider">
                                Total Subjects
                            </span>
                        </div>

                        <p className="text-3xl font-bold text-white">
                            {loading ? "—" : totalSubjects}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#151f2d] p-5">
                        <div className="mb-3 flex items-center gap-2 text-slate-400">
                            <CalendarDays size={17} />
                            <span className="text-xs font-medium uppercase tracking-wider">
                                Active Days
                            </span>
                        </div>

                        <p className="text-3xl font-bold text-white">
                            {loading
                                ? "—"
                                : groupedSchedules.filter(
                                      (day) => day.subjects.length > 0
                                  ).length}
                        </p>
                    </div>

                    <div className="col-span-2 rounded-2xl border border-white/10 bg-[#151f2d] p-5 sm:col-span-1">
                        <div className="mb-3 flex items-center gap-2 text-slate-400">
                            <Clock3 size={17} />
                            <span className="text-xs font-medium uppercase tracking-wider">
                                Schedule
                            </span>
                        </div>

                        <p className="text-3xl font-bold text-white">
                            Weekly
                        </p>
                    </div>
                </div>

                {/* Weekly Schedule */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold sm:text-2xl">
                            Weekly Schedule
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Monday — Sunday
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {DAYS.map((day) => (
                            <div
                                key={day.id}
                                className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#151f2d]"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {groupedSchedules.map((day) => (
                            <section
                                key={day.id}
                                className="overflow-hidden rounded-2xl border border-white/10 bg-[#151f2d] transition hover:border-cyan-400/30"
                            >
                                {/* Day Header */}
                                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                                    <div>
                                        <p className="text-xs font-bold tracking-[0.2em] text-cyan-400">
                                            {day.short}
                                        </p>

                                        <h3 className="mt-1 text-xl font-bold">
                                            {day.name}
                                        </h3>
                                    </div>

                                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400">
                                        {day.subjects.length} Subjects
                                    </span>
                                </div>

                                {/* Subject List */}
                                <div className="space-y-4 p-5">
                                    {day.subjects.length > 0 ? (
                                        day.subjects.map((subject, index) => (
                                            <div
                                                key={subject.id}
                                                className="rounded-xl border border-white/5 bg-[#101722] p-4 transition hover:border-cyan-400/20"
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                                            {subject.subject_code || "SUBJECT"}
                                                        </span>

                                                        <h4 className="mt-1 text-base font-bold leading-snug text-white">
                                                            {subject.subject_name}
                                                        </h4>
                                                    </div>

                                                    <span className="shrink-0 rounded-md bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-300">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </span>
                                                </div>

                                                <div className="space-y-2.5 border-t border-white/5 pt-3">
                                                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                                                        <Clock3
                                                            size={15}
                                                            className="shrink-0 text-cyan-400"
                                                        />
                                                        <span>
                                                            {formatTime(subject.start_time)}
                                                            {" — "}
                                                            {formatTime(subject.end_time)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                                                        <UserRound
                                                            size={15}
                                                            className="shrink-0 text-cyan-400"
                                                        />
                                                        <span>
                                                            {subject.lecturer || "Not specified"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                                                        <MapPin
                                                            size={15}
                                                            className="shrink-0 text-cyan-400"
                                                        />
                                                        <span>
                                                            {subject.room || "Not specified"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center">
                                            <CalendarDays
                                                size={24}
                                                className="mb-3 text-slate-500"
                                            />

                                            <p className="text-sm font-medium text-slate-400">
                                                No classes scheduled
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Enjoy your day!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}