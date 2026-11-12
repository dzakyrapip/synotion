import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "class-members";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    return token ? verifyToken(token) : false;
}

function validateInstagram(value: string) {
    if (!value) return true;

    try {
        const url = new URL(value);

        return (
            url.protocol === "https:" &&
            ["instagram.com", "www.instagram.com"].includes(
                url.hostname
            )
        );
    } catch {
        return false;
    }
}

function jsonError(message: string, status = 400) {
    return NextResponse.json(
        { error: message },
        { status }
    );
}

// PATCH: edit anggota
export async function PATCH(
    request: Request,
    { params }: RouteContext
) {
    if (!(await isAdmin())) {
        return jsonError("Unauthorized.", 401);
    }

    const { id } = await params;
    const formData = await request.formData();

    const name = String(
        formData.get("name") ?? ""
    ).trim();

    const nim = String(
        formData.get("nim") ?? ""
    ).trim();

    const positionType = String(
        formData.get("position_type") ?? ""
    );

    const customPosition = String(
        formData.get("custom_position") ?? ""
    ).trim();

    const instagramUrl = String(
        formData.get("instagram_url") ?? ""
    ).trim();

    const position =
        positionType === "Others"
            ? customPosition
            : "Anggota";

    const photo = formData.get("photo");

    if (!name || !nim) {
        return jsonError("Nama dan NIM wajib diisi.");
    }

    if (!["Anggota", "Others"].includes(positionType)) {
        return jsonError("Jenis jabatan tidak valid.");
    }

    if (positionType === "Others" && !customPosition) {
        return jsonError("Jabatan khusus wajib diisi.");
    }

    if (!validateInstagram(instagramUrl)) {
        return jsonError(
            "Gunakan tautan Instagram yang valid."
        );
    }

    if (photo instanceof File && photo.size > 0) {
        if (!ALLOWED_TYPES[photo.type]) {
            return jsonError(
                "Format foto harus JPG, PNG, atau WEBP."
            );
        }

        if (photo.size > MAX_FILE_SIZE) {
            return jsonError(
                "Ukuran foto maksimal 5 MB."
            );
        }
    }

    // Ambil data lama
    const { data: existing, error: findError } =
        await supabaseAdmin
            .from("class_members")
            .select("id, photo_path")
            .eq("id", id)
            .maybeSingle();

    if (findError) {
        return jsonError(findError.message, 500);
    }

    if (!existing) {
        return jsonError("Anggota tidak ditemukan.", 404);
    }

    let newPhotoPath: string | null = null;

    // Upload foto baru jika dipilih
    if (photo instanceof File && photo.size > 0) {
        newPhotoPath =
            `${randomUUID()}.${ALLOWED_TYPES[photo.type]}`;

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from(BUCKET)
            .upload(newPhotoPath, photo, {
                contentType: photo.type,
                upsert: false,
                cacheControl: "3600",
            });

        if (uploadError) {
            return jsonError(uploadError.message, 500);
        }
    }

    const updateData: Record<string, unknown> = {
        name,
        nim,
        position,
        instagram_url: instagramUrl || null,
        updated_at: new Date().toISOString(),
    };

    if (newPhotoPath) {
        updateData.photo_path = newPhotoPath;
    }

    const { data, error } = await supabaseAdmin
        .from("class_members")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
        if (newPhotoPath) {
            await supabaseAdmin
                .storage
                .from(BUCKET)
                .remove([newPhotoPath]);
        }

        if (error.code === "23505") {
            return jsonError(
                "NIM tersebut sudah digunakan anggota lain.",
                409
            );
        }

        return jsonError(error.message, 500);
    }

    // Hapus foto lama setelah foto baru berhasil disimpan
    if (newPhotoPath && existing.photo_path) {
        await supabaseAdmin
            .storage
            .from(BUCKET)
            .remove([existing.photo_path]);
    }

    return NextResponse.json({ member: data });
}

// DELETE: hapus anggota
export async function DELETE(
    _request: Request,
    { params }: RouteContext
) {
    if (!(await isAdmin())) {
        return jsonError("Unauthorized.", 401);
    }

    const { id } = await params;

    const { data: existing, error: findError } =
        await supabaseAdmin
            .from("class_members")
            .select("id, photo_path")
            .eq("id", id)
            .maybeSingle();

    if (findError) {
        return jsonError(findError.message, 500);
    }

    if (!existing) {
        return jsonError("Anggota tidak ditemukan.", 404);
    }

    const { error } = await supabaseAdmin
        .from("class_members")
        .delete()
        .eq("id", id);

    if (error) {
        return jsonError(error.message, 500);
    }

    if (existing.photo_path) {
        await supabaseAdmin
            .storage
            .from(BUCKET)
            .remove([existing.photo_path]);
    }

    return NextResponse.json({ success: true });
}