"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Image as ImageIcon,
    Pencil,
    Trash2,
    Save,
    X,
    LoaderCircle,
    Search,
    CalendarDays,
} from "lucide-react";

type GalleryPhoto = {
    id: string;
    caption: string | null;
    storage_path: string;
    created_at: string;
};

type GalleryItem = GalleryPhoto & {
    imageUrl: string;
};

export default function GalleryManager() {
    const router = useRouter();

    const [photos, setPhotos] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [editCaption, setEditCaption] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Fetch gallery photos
    async function fetchPhotos() {
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase
                .from("gallery_photos")
                .select("id, caption, storage_path, created_at")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const items: GalleryItem[] = (data ?? []).map((photo) => ({
                ...photo,
                imageUrl: supabase.storage
                    .from("gallery")
                    .getPublicUrl(photo.storage_path).data.publicUrl,
            }));

            setPhotos(items);
        } catch (err) {
            console.error("Gallery fetch error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Gagal memuat galeri."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPhotos();
    }, []);

    // Filter photos
    const filteredPhotos = photos.filter((photo) =>
        (photo.caption ?? "")
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase())
    );

    // Pagination calculation
    const totalPages = Math.ceil(filteredPhotos.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const paginatedPhotos = filteredPhotos.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const isBusy = loading || saving !== null || deleting !== null;

    useEffect(() => {
        if (totalPages === 0) {
            setCurrentPage(1);
        } else if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Start editing
    function handleEdit(photo: GalleryItem) {
        setEditing(photo.id);
        setEditCaption(photo.caption ?? "");
        setMessage("");
        setError("");
    }

    // Cancel editing
    function handleCancelEdit() {
        setEditing(null);
        setEditCaption("");
    }

    // Save caption
    async function handleSaveCaption(id: string) {
        setSaving(id);
        setMessage("");
        setError("");

        try {
            const response = await fetch("/admin/gallery", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id,
                    caption: editCaption.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Gagal memperbarui caption."
                );
            }

            setPhotos((current) =>
                current.map((photo) =>
                    photo.id === id
                        ? {
                            ...photo,
                            caption: editCaption.trim() || null,
                        }
                        : photo
                )
            );

            setEditing(null);
            setEditCaption("");
            setMessage("Caption berhasil diperbarui!");

            router.refresh();
        } catch (err) {
            console.error("Caption update error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Gagal memperbarui caption."
            );
        } finally {
            setSaving(null);
        }
    }

    // Delete photo
    async function handleDelete(photo: GalleryItem) {
        const confirmed = window.confirm(
            "Apakah kamu yakin ingin menghapus foto ini? Foto juga akan dihapus dari Supabase Storage."
        );

        if (!confirmed) return;

        setDeleting(photo.id);
        setMessage("");
        setError("");

        try {
            const response = await fetch("/admin/gallery", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: photo.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Gagal menghapus foto."
                );
            }

            setPhotos((current) =>
                current.filter((item) => item.id !== photo.id)
            );

            if (editing === photo.id) {
                handleCancelEdit();
            }

            setMessage("Foto berhasil dihapus!");

            router.refresh();
        } catch (err) {
            console.error("Gallery delete error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Gagal menghapus foto."
            );
        } finally {
            setDeleting(null);
        }
    }

    return (
        <div id="gallery-manager" className="mt-10 scroll-mt-8">

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">
                        Gallery Manager
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Manage photos received from the Telegram channel.
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600">
                    <ImageIcon size={17} />
                    {photos.length} Photos
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search by caption..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                />
            </div>

            {/* Messages */}
            {message && (
                <div className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Gallery List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

                <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-semibold">
                        Uploaded Photos
                    </h3>

                    <span className="text-xs text-slate-400">
                        {filteredPhotos.length} items
                    </span>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex min-h-60 items-center justify-center gap-3 text-slate-400">
                        <LoaderCircle
                            size={22}
                            className="animate-spin"
                        />

                        <span className="text-sm">
                            Loading gallery...
                        </span>
                    </div>
                ) : filteredPhotos.length > 0 ? (
                    <>
                        {/* Photo Items */}
                        <div className="space-y-4">
                            {paginatedPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="flex flex-col gap-4 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 sm:flex-row sm:items-center"
                                >

                                    {/* Thumbnail */}
                                    <div className="h-36 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-36">
                                        <img
                                            src={photo.imageUrl}
                                            alt={photo.caption || "Gallery photo"}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    {/* Photo Information */}
                                    <div className="min-w-0 flex-1">
                                        {editing === photo.id ? (
                                            <div className="space-y-3">
                                                <label className="text-xs font-semibold text-slate-500">
                                                    EDIT CAPTION
                                                </label>

                                                <textarea
                                                    value={editCaption}
                                                    onChange={(event) =>
                                                        setEditCaption(event.target.value)
                                                    }
                                                    rows={3}
                                                    placeholder="Write a caption..."
                                                    className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                                />

                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSaveCaption(photo.id)
                                                        }
                                                        disabled={isBusy}
                                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {saving === photo.id ? (
                                                            <LoaderCircle
                                                                size={14}
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            <Save size={14} />
                                                        )}

                                                        Save Caption
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={handleCancelEdit}
                                                        disabled={isBusy}
                                                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        <X size={14} />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h4 className="break-words text-sm font-semibold text-slate-800">
                                                    {photo.caption || "No caption"}
                                                </h4>

                                                <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                                                    <CalendarDays size={14} />

                                                    {new Date(
                                                        photo.created_at
                                                    ).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        timeZone: "Asia/Jakarta",
                                                    })}
                                                </p>

                                                <span
                                                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                                        photo.caption
                                                            ? "bg-green-50 text-green-600"
                                                            : "bg-amber-50 text-amber-600"
                                                    }`}
                                                >
                                                    {photo.caption
                                                        ? "Caption available"
                                                        : "Needs caption"}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {editing !== photo.id && (
                                        <div className="flex shrink-0 items-center gap-2 sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(photo)}
                                                disabled={isBusy}
                                                title="Edit caption"
                                                aria-label="Edit caption"
                                                className="flex items-center gap-2 rounded-lg border border-blue-100 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(photo)}
                                                disabled={isBusy}
                                                title="Delete photo"
                                                aria-label="Delete photo"
                                                className="flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                            >
                                                {deleting === photo.id ? (
                                                    <LoaderCircle
                                                        size={14}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}

                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                    {/* Page Information */}
                                    <p className="text-center text-xs text-slate-400 sm:text-left">
                                        Showing {startIndex + 1}–
                                        {Math.min(
                                            startIndex + itemsPerPage,
                                            filteredPhotos.length
                                        )} of {filteredPhotos.length} photos
                                    </p>

                                    {/* Pagination Controls */}
                                    <div className="flex flex-wrap items-center justify-center gap-2">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.max(1, page - 1)
                                                )
                                            }
                                            disabled={currentPage === 1 || isBusy}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            Previous
                                        </button>

                                        {(() => {
                                            const pages: (number | string)[] = [];

                                            if (totalPages <= 5) {
                                                for (
                                                    let i = 1;
                                                    i <= totalPages;
                                                    i++
                                                ) {
                                                    pages.push(i);
                                                }
                                            } else {
                                                pages.push(1);

                                                if (currentPage > 3) {
                                                    pages.push("...");
                                                }

                                                const start = Math.max(
                                                    2,
                                                    currentPage - 1
                                                );

                                                const end = Math.min(
                                                    totalPages - 1,
                                                    currentPage + 1
                                                );

                                                for (
                                                    let i = start;
                                                    i <= end;
                                                    i++
                                                ) {
                                                    pages.push(i);
                                                }

                                                if (
                                                    currentPage <
                                                    totalPages - 2
                                                ) {
                                                    pages.push("...");
                                                }

                                                pages.push(totalPages);
                                            }

                                            return pages.map((page, index) =>
                                                typeof page === "number" ? (
                                                    <button
                                                        key={page}
                                                        type="button"
                                                        onClick={() =>
                                                            setCurrentPage(page)
                                                        }
                                                        disabled={isBusy}
                                                        className={`h-9 min-w-9 rounded-lg px-2 text-xs font-medium transition ${
                                                            currentPage === page
                                                                ? "bg-blue-600 text-white"
                                                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ) : (
                                                    <span
                                                        key={`ellipsis-${index}`}
                                                        className="px-1 text-slate-400"
                                                    >
                                                        ...
                                                    </span>
                                                )
                                            );
                                        })()}

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
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-16 text-center">
                        <ImageIcon
                            size={40}
                            className="mx-auto text-slate-300"
                        />

                        <h3 className="mt-4 font-semibold text-slate-700">
                            {photos.length === 0
                                ? "No photos available"
                                : "No photos found"}
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            {photos.length === 0
                                ? "Photos sent to the Telegram channel will appear here."
                                : "Try searching with another caption."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
