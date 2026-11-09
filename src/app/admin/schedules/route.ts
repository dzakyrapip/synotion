
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isValidSchedule(data: any) {
    return (
        typeof data.subject_name === "string" &&
        data.subject_name.trim().length > 0 &&
        typeof data.subject_code === "string" &&
        data.subject_code.trim().length > 0 &&
        typeof data.lecturer === "string" &&
        data.lecturer.trim().length > 0 &&
        Number.isInteger(data.day_of_week) &&
        data.day_of_week >= 1 &&
        data.day_of_week <= 7 &&
        typeof data.start_time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(data.start_time) &&
        typeof data.end_time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(data.end_time) &&
        data.start_time < data.end_time &&
        typeof data.room === "string" &&
        data.room.trim().length > 0
    );
}

// GET: Retrieve all schedules for admin
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("admin_token")?.value;

        if (!token || !(await verifyToken(token))) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("class_schedules")
            .select("*")
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ schedules: data });

    } catch (error) {
        console.error("Get schedules error:", error);

        return NextResponse.json(
            { message: "Gagal mengambil jadwal mata kuliah." },
            { status: 500 }
        );
    }
}

// POST: Create new schedule
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get("admin_token")?.value;

        if (!token || !(await verifyToken(token))) {
            return NextResponse.json(
                { message: "Unauthorized. Silakan login kembali." },
                { status: 401 }
            );
        }

        const body = await request.json();

        if (!isValidSchedule(body)) {
            return NextResponse.json(
                { message: "Data jadwal tidak valid. Periksa kembali semua kolom." },
                { status: 400 }
            );
        }

        const scheduleData = {
            subject_name: body.subject_name.trim(),
            subject_code: body.subject_code.trim(),
            lecturer: body.lecturer.trim(),
            day_of_week: body.day_of_week,
            start_time: body.start_time,
            end_time: body.end_time,
            room: body.room.trim(),
        };

        const { data, error } = await supabaseAdmin
            .from("class_schedules")
            .insert(scheduleData)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(
            {
                message: "Jadwal berhasil ditambahkan.",
                schedule: data,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create schedule error:", error);

        return NextResponse.json(
            {
                message: error instanceof Error
                    ? error.message
                    : "Gagal menambahkan jadwal.",
            },
            { status: 500 }
        );
    }
}
