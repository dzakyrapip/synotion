
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isValidSchedule(data: Record<string, unknown>) {
    return (
        typeof data.subject_name === "string" &&
        data.subject_name.trim().length > 0 &&
        typeof data.subject_code === "string" &&
        data.subject_code.trim().length > 0 &&
        typeof data.lecturer === "string" &&
        data.lecturer.trim().length > 0 &&
        Number.isInteger(data.day_of_week) &&
        Number(data.day_of_week) >= 1 &&
        Number(data.day_of_week) <= 7 &&
        typeof data.start_time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(data.start_time) &&
        typeof data.end_time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(data.end_time) &&
        data.start_time < data.end_time &&
        typeof data.room === "string" &&
        data.room.trim().length > 0
    );
}

// PATCH: Update schedule
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get("admin_token")?.value;

        if (!token || !(await verifyToken(token))) {
            return NextResponse.json(
                { message: "Unauthorized. Silakan login kembali." },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body: unknown = await request.json();

        if (
            typeof body !== "object" ||
            body === null ||
            !isValidSchedule(body as Record<string, unknown>)
        ) {
            return NextResponse.json(
                { message: "Data jadwal tidak valid. Periksa kembali semua kolom." },
                { status: 400 }
            );
        }

        const schedule = body as Record<string, unknown>;

        const scheduleData = {
            subject_name: (schedule.subject_name as string).trim(),
            subject_code: (schedule.subject_code as string).trim(),
            lecturer: (schedule.lecturer as string).trim(),
            day_of_week: schedule.day_of_week as number,
            start_time: schedule.start_time as string,
            end_time: schedule.end_time as string,
            room: (schedule.room as string).trim(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
            .from("class_schedules")
            .update(scheduleData)
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return NextResponse.json(
                { message: "Jadwal tidak ditemukan." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Jadwal berhasil diperbarui.",
            schedule: data,
        });

    } catch (error) {
        console.error("Update schedule error:", error);

        return NextResponse.json(
            {
                message: error instanceof Error
                    ? error.message
                    : "Gagal memperbarui jadwal.",
            },
            { status: 500 }
        );
    }
}

// DELETE: Delete schedule
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get("admin_token")?.value;

        if (!token || !(await verifyToken(token))) {
            return NextResponse.json(
                { message: "Unauthorized. Silakan login kembali." },
                { status: 401 }
            );
        }

        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from("class_schedules")
            .delete()
            .eq("id", id)
            .select("id")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return NextResponse.json(
                { message: "Jadwal tidak ditemukan." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Jadwal berhasil dihapus.",
        });

    } catch (error) {
        console.error("Delete schedule error:", error);

        return NextResponse.json(
            {
                message: error instanceof Error
                    ? error.message
                    : "Gagal menghapus jadwal.",
            },
            { status: 500 }
        );
    }
}
