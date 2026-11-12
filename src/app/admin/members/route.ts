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

// GET: mengambil semua anggota
export async function GET() {
    if (!(await isAdmin())) {
        return jsonError("Unauthorized.", 401);
    }

    const { data, error } = await supabaseAdmin
        .from("class_members")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        return jsonError(error.message, 500);
    }

    return NextResponse.json({
        members: data ?? [],
    });
}

// POST: menambahkan anggota
export async function POST(request: Request) {
    if (!(await isAdmin())) {
        return jsonError("Unauthorized.", 401);
    }

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

    const { count, error: countError } = await supabaseAdmin
        .from("class_members")
        .select("id", {
            count: "exact",
            head: true,
        });

    if (countError) {
        return jsonError(countError.message, 500);
    }

    let photoPath: string | null = null;

    // Upload foto
    if (photo instanceof File && photo.size > 0) {
        const extension = ALLOWED_TYPES[photo.type];

        photoPath = `${randomUUID()}.${extension}`;

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from(BUCKET)
            .upload(photoPath, photo, {
                contentType: photo.type,
                upsert: false,
                cacheControl: "3600",
            });

        if (uploadError) {
            return jsonError(uploadError.message, 500);
        }
    }

    // Simpan data anggota
    const { data, error } = await supabaseAdmin
        .from("class_members")
        .insert({
            name,
            nim,
            position,
            instagram_url: instagramUrl || null,
            photo_path: photoPath,
            display_order: count ?? 0,
        })
        .select("*")
        .single();

    if (error) {
        if (photoPath) {
            await supabaseAdmin
                .storage
                .from(BUCKET)
                .remove([photoPath]);
        }

        if (error.code === "23505") {
            return jsonError(
                "NIM tersebut sudah terdaftar.",
                409
            );
        }

        return jsonError(error.message, 500);
    }

    return NextResponse.json(
        { member: data },
        { status: 201 }
    );
}