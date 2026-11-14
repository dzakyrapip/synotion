
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Photo = {
    id: string;
    name: string;
    storage_path: string;
    display_order: number;
    created_at: string;
};

function getPhotoUrl(path: string) {
    return supabase.storage
        .from("hero-gallery")
        .getPublicUrl(path);
}

export default function HeroGalleryManager({
    initialPhotos,
}: {
    initialPhotos: Photo[];
}) {
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement>(null);

    const [photos, setPhotos] = useState(initialPhotos);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [moving, setMoving] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.ceil(photos.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const paginatedPhotos = photos.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const isBusy =
        loading || deleting !== null || moving !== null;

    useEffect(() => {
        setPhotos(initialPhotos);
    }, [initialPhotos]);

    // Adjust current page when photos are deleted
    useEffect(() => {
        if (totalPages === 0) {
            setCurrentPage(1);
        } else if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Upload Photo
    async function handleUpload(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) return;

        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/admin/photos", {
                method: "POST",
                body: formData,
            });

            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const errorText = await response.text();
                console.error("Upload response:", errorText);

                throw new Error(
                    "Server memberikan respons yang tidak valid."
                );
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Upload gagal.");
            }

            setMessage("Foto berhasil diunggah!");
            router.refresh();

        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Upload gagal."
            );
        } finally {
            setLoading(false);

            if (fileInput.current) {
                fileInput.current.value = "";
            }
        }
    }

    // Delete Photo
    async function handleDelete(id: string) {
        const confirmed = window.confirm(
            "Apakah kamu yakin ingin menghapus foto ini?"
        );

        if (!confirmed) return;

        setDeleting(id);
        setMessage("");

        try {
            const response = await fetch(`/admin/photos/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Gagal menghapus foto."
                );
            }

            setPhotos((current) =>
                current.filter((photo) => photo.id !== id)
            );

            setMessage("Foto berhasil dihapus!");
            router.refresh();

        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal menghapus foto."
            );
        } finally {
            setDeleting(null);
        }
    }

    // Move Photo
    async function handleMove(
        id: string,
        direction: "up" | "down"
    ) {
        setMoving(id);
        setMessage("");

        try {
            const response = await fetch(`/admin/photos/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ direction }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Gagal mengubah urutan foto."
                );
            }

            setPhotos(data.photos);
            setMessage("Urutan foto berhasil diperbarui!");

            router.refresh();

        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengubah urutan foto."
            );
        } finally {
            setMoving(null);
        }
    }

    return (
        <div id="gallery" className="mt-10 scroll-mt-8">

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">
                        Hero Gallery
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Manage the photos displayed on your homepage.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={isBusy}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Uploading..." : "+ Add New Photo"}
                </button>

                <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUpload}
                    className="hidden"
                />
            </div>

            {/* Message */}
            {message && (
                <p className="mb-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-600">
                    {message}
                </p>
            )}

            {/* Gallery List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-semibold">
                        Uploaded Photos
                    </h3>

                    <span className="text-xs text-slate-400">
                        {photos.length} items
                    </span>
                </div>

                {photos.length > 0 ? (
                    <>
                        {/* Photo Items */}
                        <div className="space-y-4">

                            {paginatedPhotos.map((photo, index) => {
                                const { data } = getPhotoUrl(
                                    photo.storage_path
                                );

                                const position = startIndex + index;

                                return (
                                    <div
                                        key={photo.id}
                                        className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200"
                                    >

                                        {/* Position Number */}
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-500">
                                            {position + 1}
                                        </div>

                                        {/* Image */}
                                        <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                            <img
                                                src={data.publicUrl}
                                                alt={photo.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>

                                        {/* Photo Information */}
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-semibold">
                                                {photo.name}
                                            </h4>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Position {position + 1}
                                            </p>

                                            <span className="mt-2 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                                                Aktif
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">

                                            {/* Move Up */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleMove(photo.id, "up")
                                                }
                                                disabled={
                                                    position === 0 || isBusy
                                                }
                                                aria-label="Move photo up"
                                                title="Move up"
                                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                                            >
                                                ↑
                                            </button>

                                            {/* Move Down */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleMove(photo.id, "down")
                                                }
                                                disabled={
                                                    position === photos.length - 1 ||
                                                    isBusy
                                                }
                                                aria-label="Move photo down"
                                                title="Move down"
                                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                                            >
                                                ↓
                                            </button>

                                            {/* Delete */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(photo.id)
                                                }
                                                disabled={isBusy}
                                                className="rounded-lg border border-red-100 px-3 py-2 text-xs text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {deleting === photo.id
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>

                                        </div>
                                    </div>
                                );
                            })}

                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">

                                <p className="text-sm text-slate-400">
                                    Showing {startIndex + 1}–
                                    {Math.min(
                                        startIndex + itemsPerPage,
                                        photos.length
                                    )} of {photos.length} photos
                                </p>

                                <div className="flex items-center gap-2">

                                    {/* Previous */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.max(1, page - 1)
                                            )
                                        }
                                        disabled={
                                            currentPage === 1 || isBusy
                                        }
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        Previous
                                    </button>

                                    {/* Page Numbers */}
                                    {Array.from(
                                        { length: totalPages },
                                        (_, index) => index + 1
                                    ).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage(page)
                                            }
                                            disabled={isBusy}
                                            className={`h-9 w-9 rounded-lg text-sm font-medium transition ${currentPage === page
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    {/* Next */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.min(
                                                    totalPages,
                                                    page + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            currentPage === totalPages ||
                                            isBusy
                                        }
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        Next
                                    </button>

                                </div>
                            </div>
                        )}
                    </>
                ) : (

                    /* Empty State */
                    <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-16 text-center">
                        <div className="text-4xl text-slate-300">
                            ▧
                        </div>

                        <h3 className="mt-4 font-semibold">
                            No photos uploaded yet
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Add your first photo to display it on the homepage.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
