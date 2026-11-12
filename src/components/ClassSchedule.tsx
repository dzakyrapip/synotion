
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  ArrowRight,
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
  "Monday",
  "Thuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
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

  return {
    day: weekdayMap[getPart("weekday")] ?? 1,
    minutes: Number(getPart("hour")) * 60 + Number(getPart("minute")),
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
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const upcoming = daySchedules.find((schedule) => {
      return offset === 0
        ? getMinutes(schedule.start_time) > currentMinutes
        : true;
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

function ScheduleDetails({ schedule }: { schedule: Schedule }) {
  return (
    <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-sm text-slate-400">
      <span className="flex items-center gap-2">
        <UserRound size={15} className="text-slate-500" />
        {schedule.lecturer}
      </span>

      <span className="flex items-center gap-2">
        <MapPin size={15} className="text-slate-500" />
        {schedule.room}
      </span>
    </div>
  );
}

export default function ClassSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      setSchedules(data ?? []);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setError("Jadwal belum dapat dimuat. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  // WIB Clock
  useEffect(() => {
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Schedule
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const scheduleInfo = useMemo(() => {
    if (!now) return null;

    const { day, minutes } = getWIBInfo(now);

    const todaySchedules = schedules
      .filter((schedule) => schedule.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const currentSchedule =
      todaySchedules.find((schedule) => {
        const start = getMinutes(schedule.start_time);
        const end = getMinutes(schedule.end_time);

        return minutes >= start && minutes < end;
      }) ?? null;

    const next = getNextSchedule(schedules, day, minutes);

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
      className="bg-[#101722] px-6 py-20 text-white md:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-sm font-medium text-cyan-400">
              Our weekly routine
            </p>

            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Class Schedule
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">
              Everything you need to know about today's classes
              and what's coming next.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <CalendarDays size={18} className="text-cyan-400" />

            <span>
              {now ? formatDate(now) : "Loading date..."}
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-60 items-center justify-center border-y border-white/10">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <LoaderCircle size={20} className="animate-spin text-cyan-400" />
              Loading schedule...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border-y border-white/10 py-12 text-center">
            <p className="text-sm text-slate-400">{error}</p>

            <button
              type="button"
              onClick={fetchSchedules}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && scheduleInfo && (
          <>
            {/* Current and Next Class */}
            <div className="grid gap-10 border-y border-white/10 py-8 lg:grid-cols-[1.5fr_1fr]">

              {/* Current Class */}
              <div className="lg:border-r lg:border-white/10 lg:pr-10">
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {currentSchedule ? "Currently in class" : "Current status"}
                  </p>

                  <span className="text-sm text-slate-400">
                    {days[scheduleInfo.day - 1]}
                  </span>
                </div>

                {currentSchedule ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      In progress
                    </div>

                    <h3 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
                      {currentSchedule.subject_name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {currentSchedule.subject_code}
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-300">
                      <Clock3 size={17} className="text-cyan-400" />

                      {formatTime(currentSchedule.start_time)}
                      {" - "}
                      {formatTime(currentSchedule.end_time)}
                    </div>

                    <ScheduleDetails schedule={currentSchedule} />
                  </>
                ) : (
                  <div className="py-3">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Coffee size={23} />

                      <h3 className="text-2xl font-semibold text-white">
                        No class right now.
                      </h3>
                    </div>

                    <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                      Take a break, catch up with your work,
                      or get ready for the next class.
                    </p>
                  </div>
                )}
              </div>

              {/* Next Class */}
              <div>
                <p className="mb-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Up next
                </p>

                {nextSchedule ? (
                  <>
                    <p className="text-sm text-cyan-400">
                      {nextSchedule.dayOffset === 0
                        ? "Later today"
                        : nextSchedule.dayOffset === 1
                          ? "Tomorrow"
                          : days[
                              (scheduleInfo.day - 1 + nextSchedule.dayOffset) % 7
                            ]}
                    </p>

                    <h3 className="mt-4 text-2xl font-bold leading-snug">
                      {nextSchedule.schedule.subject_name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {nextSchedule.schedule.subject_code}
                    </p>

                    <div className="mt-6 space-y-4 text-sm text-slate-400">
                      <div className="flex items-center gap-3">
                        <Clock3 size={16} className="text-slate-500" />

                        {formatTime(nextSchedule.schedule.start_time)}
                        {" - "}
                        {formatTime(nextSchedule.schedule.end_time)}
                      </div>

                      <div className="flex items-center gap-3">
                        <UserRound size={16} className="text-slate-500" />

                        {nextSchedule.schedule.lecturer}
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-slate-500" />

                        {nextSchedule.schedule.room}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-3">
                    <h3 className="text-xl font-semibold">
                      No upcoming classes.
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      There are no scheduled classes in the next seven days.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Today's Timeline */}
            <div className="mt-14">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">
                    Today's Classes
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Your schedule for today.
                  </p>
                </div>

                <Link
                  href="/schedule"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  View full schedule

                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

              {scheduleInfo.todaySchedules.length > 0 ? (
                <div className="divide-y divide-white/[0.07]">
                  {scheduleInfo.todaySchedules.map((schedule) => {
                    const isCurrent =
                      scheduleInfo.minutes >= getMinutes(schedule.start_time) &&
                      scheduleInfo.minutes < getMinutes(schedule.end_time);

                    const isFinished =
                      scheduleInfo.minutes >= getMinutes(schedule.end_time);

                    return (
                      <div
                        key={schedule.id}
                        className="grid grid-cols-[75px_1fr] gap-5 py-5 md:grid-cols-[100px_1fr_auto] md:items-center md:gap-8"
                      >
                        {/* Time */}
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isCurrent ? "text-cyan-400" : "text-slate-200"
                            }`}
                          >
                            {formatTime(schedule.start_time)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatTime(schedule.end_time)}
                          </p>
                        </div>

                        {/* Subject */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={`text-sm font-semibold ${
                                isFinished
                                  ? "text-slate-500"
                                  : "text-slate-200"
                              }`}
                            >
                              {schedule.subject_name}
                            </h4>

                            {isCurrent && (
                              <span className="text-[10px] font-semibold text-cyan-400">
                                NOW
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {schedule.subject_code}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 md:hidden">
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

                        {/* Lecturer and Room */}
                        <div className="hidden items-center gap-6 text-xs text-slate-500 md:flex">
                          <span className="flex items-center gap-2">
                            <UserRound size={14} />
                            {schedule.lecturer}
                          </span>

                          <span className="flex items-center gap-2">
                            <MapPin size={14} />
                            {schedule.room}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border-y border-white/10 py-12 text-center">
                  <Coffee size={24} className="mx-auto text-slate-500" />

                  <p className="mt-4 text-sm font-medium text-slate-300">
                    No classes today.
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Enjoy your free time!
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
