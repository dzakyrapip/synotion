
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Image as ImageIcon,
    LoaderCircle,
    X,
    Download,
    ChevronLeft,
    ChevronRight,
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

export default function Gallery() {
    const [photos, setPhotos] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        async function fetchPhotos() {
            const { data, error } = await supabase
                .from("gallery_photos")
                .select("id, caption, storage_path, created_at")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Gallery error:", error);
                setError("Gagal memuat galeri foto.");
                setLoading(false);
                return;
            }

            const items: GalleryItem[] = (data ?? []).map((photo) => ({
                ...photo,
                imageUrl: supabase.storage
                    .from("gallery")
                    .getPublicUrl(photo.storage_path).data.publicUrl,
            }));

            setPhotos(items);
            setLoading(false);
        }

        fetchPhotos();
    }, []);

    const selectedPhoto =
        selectedIndex !== null ? photos[selectedIndex] : null;

    const closePopup = () => setSelectedIndex(null);

    const showPrevious = () => {
        if (selectedIndex === null || photos.length === 0) return;

        setSelectedIndex(
            (selectedIndex - 1 + photos.length) % photos.length
        );
    };

    const showNext = () => {
        if (selectedIndex === null || photos.length === 0) return;

        setSelectedIndex((selectedIndex + 1) % photos.length);
    };

    const downloadPhoto = async () => {
        if (!selectedPhoto) return;

        try {
            const response = await fetch(selectedPhoto.imageUrl);

            if (!response.ok) {
                throw new Error("Failed to download image.");
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = `synotion-gallery-${selectedPhoto.id}.jpg`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error("Download error:", error);
            window.open(selectedPhoto.imageUrl, "_blank");
        }
    };

    useEffect(() => {
        if (selectedIndex === null) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closePopup();
            if (event.key === "ArrowLeft") showPrevious();
            if (event.key === "ArrowRight") showNext();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [selectedIndex, photos.length]);

    return (
        <section
            id="gallery"
            className="relative min-h-screen overflow-hidden bg-[#0b111b] px-5 py-28 sm:px-8 lg:px-12"
        >
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-[120px]" />

            <div className="relative mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-12">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
                        Our Memories
                    </p>

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                                Class{" "}
                                <span className="text-cyan-400">
                                    Gallery.
                                </span>
                            </h2>

                            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400 md:text-base">
                                A collection of moments and memories
                                captured throughout our journey together.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <ImageIcon
                                size={18}
                                className="text-cyan-400"
                            />
                            {photos.length} Photos
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex min-h-80 items-center justify-center">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <LoaderCircle
                                size={22}
                                className="animate-spin"
                            />
                            <span className="text-sm">
                                Loading gallery...
                            </span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && photos.length === 0 && (
                    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-center">
                        <ImageIcon
                            size={42}
                            className="mb-4 text-gray-600"
                        />

                        <h3 className="text-lg font-semibold text-white">
                            No Photos Yet
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                            Our memories will appear here soon.
                        </p>
                    </div>
                )}

                {/* Pinterest Masonry Grid */}
                {!loading && !error && photos.length > 0 && (
                    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                        {photos.map((photo, index) => (
                            <button
                                key={photo.id}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                aria-label={`Open photo ${index + 1}`}
                                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl bg-[#182332] text-left sm:mb-4"
                            >
                                <img
                                    src={photo.imageUrl}
                                    alt={photo.caption || "Class memory"}
                                    loading="lazy"
                                    className="block h-auto w-full transition duration-500 group-hover:scale-[1.03]"
                                />

                                <div className="pointer-events-none absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/15" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Popup */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-6"
                    onClick={closePopup}
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={closePopup}
                        aria-label="Close popup"
                        className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-[#111b29] p-3 text-white transition hover:bg-cyan-400 hover:text-black sm:right-7 sm:top-7"
                    >
                        <X size={22} />
                    </button>

                    {/* Previous */}
                    {photos.length > 1 && (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                showPrevious();
                            }}
                            aria-label="Previous photo"
                            className="absolute left-2 z-20 rounded-full bg-[#111b29]/90 p-2 text-white transition hover:bg-cyan-400 hover:text-black sm:left-6 sm:p-3"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {/* Popup Content */}
                    <div
                        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111b29] shadow-2xl md:flex-row"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Image */}
                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/40">
                            <img
                                src={selectedPhoto.imageUrl}
                                alt={selectedPhoto.caption || "Class memory"}
                                className="max-h-[65vh] w-full object-contain md:max-h-[85vh]"
                            />
                        </div>

                        {/* Information */}
                        <div className="flex w-full flex-col justify-between gap-6 p-5 md:w-72 md:shrink-0 md:p-7">
                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
                                    Class Memories
                                </p>

                                <h3 className="text-lg font-semibold text-white">
                                    Photo Details
                                </h3>

                                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                                    {selectedPhoto.caption || "No caption available."}
                                </p>

                                <div className="mt-6 border-t border-white/10 pt-5">
                                    <p className="text-xs uppercase tracking-wider text-gray-500">
                                        Uploaded on
                                    </p>

                                    <p className="mt-2 text-sm text-gray-300">
                                        {new Date(
                                            selectedPhoto.created_at
                                        ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            timeZone: "Asia/Jakarta",
                                        })}
                                    </p>
                                </div>

                                <p className="mt-5 text-xs text-gray-500">
                                    {selectedIndex! + 1} of {photos.length} photos
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={downloadPhoto}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#0b111b] transition hover:bg-cyan-300"
                            >
                                <Download size={18} />
                                Download Photo
                            </button>
                        </div>
                    </div>

                    {/* Next */}
                    {photos.length > 1 && (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                showNext();
                            }}
                            aria-label="Next photo"
                            className="absolute right-2 z-20 rounded-full bg-[#111b29]/90 p-2 text-white transition hover:bg-cyan-400 hover:text-black sm:right-6 sm:p-3"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
