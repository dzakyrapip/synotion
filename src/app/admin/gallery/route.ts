
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Validasi autentikasi admin
async function authorizeAdmin(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token || !(await verifyToken(token))) {
        return false;
    }

    return true;
}

// UPDATE CAPTION
export async function PATCH(request: NextRequest) {
    try {
        // 1. Validasi admin
        if (!(await authorizeAdmin(request))) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        // 2. Ambil data request
        const body = await request.json();
        const { id, caption } = body;

        if (!id || (caption !== null && typeof caption !== "string")) {
            return NextResponse.json(
                { message: "Data caption tidak valid." },
                { status: 400 }
            );
        }

        // 3. Update caption
        const { data, error } = await supabaseAdmin
            .from("gallery_photos")
            .update({
                caption: typeof caption === "string"
                    ? caption.trim() || null
                    : null,
            })
            .eq("id", id)
            .select("id, caption")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return NextResponse.json(
                { message: "Foto tidak ditemukan." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Caption berhasil diperbarui.",
            photo: data,
        });

    } catch (error) {
        console.error("Gallery caption update error:", error);

        return NextResponse.json(
            { message: "Gagal memperbarui caption." },
            { status: 500 }
        );
    }
}

// DELETE PHOTO
export async function DELETE(request: NextRequest) {
    try {
        // 1. Validasi admin
        if (!(await authorizeAdmin(request))) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        // 2. Ambil ID foto
        const body = await request.json();
        const { id } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { message: "ID foto tidak valid." },
                { status: 400 }
            );
        }

        // 3. Cari foto di database
        const { data: photo, error: findError } = await supabaseAdmin
            .from("gallery_photos")
            .select("id, storage_path")
            .eq("id", id)
            .maybeSingle();

        if (findError) throw findError;

        if (!photo) {
            return NextResponse.json(
                { message: "Foto tidak ditemukan." },
                { status: 404 }
            );
        }

        // 4. Hapus file dari Supabase Storage
        const { error: storageError } = await supabaseAdmin.storage
            .from("gallery")
            .remove([photo.storage_path]);

        if (storageError) throw storageError;

        // 5. Hapus data dari database
        const { error: deleteError } = await supabaseAdmin
            .from("gallery_photos")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        return NextResponse.json({
            message: "Foto berhasil dihapus.",
        });

    } catch (error) {
        console.error("Gallery delete error:", error);

        return NextResponse.json(
            { message: "Gagal menghapus foto." },
            { status: 500 }
        );
    }
}