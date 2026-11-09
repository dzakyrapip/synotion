import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File tidak ditemukan." },
        { status: 400 }
      );
    }

    const extension = allowedTypes[file.type];

    if (!extension) {
      return NextResponse.json(
        { message: "Format harus JPG, PNG, atau WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Ukuran maksimal foto adalah 5 MB." },
        { status: 400 }
      );
    }

    const { data: existingPhotos, error: countError } =
      await supabaseAdmin
        .from("hero_photos")
        .select("id");

    if (countError) {
      throw countError;
    }

    const storagePath = `${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("hero-gallery")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: photo, error: insertError } = await supabaseAdmin
      .from("hero_photos")
      .insert({
        name: file.name,
        storage_path: storagePath,
        display_order: existingPhotos.length,
      })
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.storage
        .from("hero-gallery")
        .remove([storagePath]);

      throw insertError;
    }

    const { data: publicData } = supabaseAdmin.storage
      .from("hero-gallery")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      message: "Foto berhasil diunggah.",
      photo: {
        ...photo,
        image: publicData.publicUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { message: "Gagal mengunggah foto." },
      { status: 500 }
    );
  }
}