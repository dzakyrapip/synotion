
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const isValidDeviceId = (value: unknown): value is string =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

// GET: Ambil jumlah like dan foto yang sudah disukai perangkat
export async function GET(request: NextRequest) {
    try {
        const deviceId = request.nextUrl.searchParams.get("deviceId");

        if (!isValidDeviceId(deviceId)) {
            return NextResponse.json(
                { message: "Device ID tidak valid." },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("gallery_likes")
            .select("photo_id, device_id");

        if (error) throw error;

        const likeCounts: Record<string, number> = {};
        const likedPhotoIds: string[] = [];

        for (const like of data ?? []) {
            likeCounts[like.photo_id] =
                (likeCounts[like.photo_id] ?? 0) + 1;

            if (like.device_id === deviceId) {
                likedPhotoIds.push(like.photo_id);
            }
        }

        return NextResponse.json({
            likeCounts,
            likedPhotoIds,
        });
    } catch (error) {
        console.error("Get gallery likes error:", error);

        return NextResponse.json(
            { message: "Gagal mengambil data like." },
            { status: 500 }
        );
    }
}

// POST: Toggle like / unlike
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { photoId, deviceId } = body;

        if (
            typeof photoId !== "string" ||
            !isValidDeviceId(deviceId)
        ) {
            return NextResponse.json(
                { message: "Data like tidak valid." },
                { status: 400 }
            );
        }

        // Periksa apakah foto tersedia
        const { data: photo, error: photoError } = await supabaseAdmin
            .from("gallery_photos")
            .select("id")
            .eq("id", photoId)
            .maybeSingle();

        if (photoError) throw photoError;

        if (!photo) {
            return NextResponse.json(
                { message: "Foto tidak ditemukan." },
                { status: 404 }
            );
        }

        // Periksa like dari perangkat ini
        const { data: existingLike, error: findError } =
            await supabaseAdmin
                .from("gallery_likes")
                .select("id")
                .eq("photo_id", photoId)
                .eq("device_id", deviceId)
                .maybeSingle();

        if (findError) throw findError;

        let liked: boolean;

        if (existingLike) {
            // Unlike
            const { error: deleteError } = await supabaseAdmin
                .from("gallery_likes")
                .delete()
                .eq("id", existingLike.id);

            if (deleteError) throw deleteError;

            liked = false;
        } else {
            // Like
            const { error: insertError } = await supabaseAdmin
                .from("gallery_likes")
                .insert({
                    photo_id: photoId,
                    device_id: deviceId,
                });

            if (insertError) throw insertError;

            liked = true;
        }

        // Hitung jumlah like terbaru
        const { count, error: countError } = await supabaseAdmin
            .from("gallery_likes")
            .select("id", { count: "exact", head: true })
            .eq("photo_id", photoId);

        if (countError) throw countError;

        return NextResponse.json({
            liked,
            count: count ?? 0,
        });
    } catch (error) {
        console.error("Toggle gallery like error:", error);

        return NextResponse.json(
            { message: "Gagal memperbarui like." },
            { status: 500 }
        );
    }
}
