import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data: photo, error: findError } = await supabaseAdmin
      .from("hero_photos")
      .select("id, storage_path")
      .eq("id", id)
      .single();

    if (findError || !photo) {
      return NextResponse.json(
        { message: "Foto tidak ditemukan." },
        { status: 404 }
      );
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from("hero-gallery")
      .remove([photo.storage_path]);

    if (storageError) {
      throw storageError;
    }

    const { error: deleteError } = await supabaseAdmin
      .from("hero_photos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      message: "Foto berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete error:", error);

    return NextResponse.json(
      { message: "Gagal menghapus foto." },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validasi admin
    const token = request.cookies.get("admin_token")?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    // 2. Ambil ID dan arah perpindahan
    const { id } = await params;
    const { direction } = await request.json();

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json(
        { message: "Arah perpindahan tidak valid." },
        { status: 400 }
      );
    }

    // 3. Ambil seluruh foto berdasarkan urutan
    const { data: photos, error: fetchError } = await supabaseAdmin
      .from("hero_photos")
      .select("id, name, storage_path, display_order, created_at")
      .order("display_order", { ascending: true });

    if (fetchError) throw fetchError;

    const currentIndex = photos.findIndex((photo) => photo.id === id);

    if (currentIndex === -1) {
      return NextResponse.json(
        { message: "Foto tidak ditemukan." },
        { status: 404 }
      );
    }

    // 4. Tentukan foto yang akan ditukar
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Tidak bisa melewati batas daftar
    if (targetIndex < 0 || targetIndex >= photos.length) {
      return NextResponse.json(
        { message: "Foto sudah berada di posisi paling ujung." },
        { status: 400 }
      );
    }

    const currentPhoto = photos[currentIndex];
    const targetPhoto = photos[targetIndex];

    const currentOrder = currentPhoto.display_order;
    const targetOrder = targetPhoto.display_order;
    const temporaryOrder =
      Math.max(...photos.map((photo) => photo.display_order)) + 1;

    // 5. Tukar urutan dengan posisi sementara
    const { error: firstError } = await supabaseAdmin
      .from("hero_photos")
      .update({ display_order: temporaryOrder })
      .eq("id", currentPhoto.id);

    if (firstError) throw firstError;

    const { error: secondError } = await supabaseAdmin
      .from("hero_photos")
      .update({ display_order: currentOrder })
      .eq("id", targetPhoto.id);

    if (secondError) {
      await supabaseAdmin
        .from("hero_photos")
        .update({ display_order: currentOrder })
        .eq("id", currentPhoto.id);

      throw secondError;
    }

    const { error: thirdError } = await supabaseAdmin
      .from("hero_photos")
      .update({ display_order: targetOrder })
      .eq("id", currentPhoto.id);

    if (thirdError) throw thirdError;

    // 6. Ambil ulang data terbaru
    const { data: updatedPhotos, error: updatedError } =
      await supabaseAdmin
        .from("hero_photos")
        .select("*")
        .order("display_order", { ascending: true });

    if (updatedError) throw updatedError;

    return NextResponse.json({
      message: "Urutan foto berhasil diperbarui.",
      photos: updatedPhotos,
    });

  } catch (error) {
    console.error("Reorder error:", error);

    return NextResponse.json(
      { message: "Gagal mengubah urutan foto." },
      { status: 500 }
    );
  }
}
