
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Image as ImageIcon, LoaderCircle } from "lucide-react";

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

    useEffect(() => {
        async function fetchPhotos() {
            setLoading(true);
            setError(null);

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

            const galleryItems: GalleryItem[] = (data ?? []).map(
                (photo: GalleryPhoto) => ({
                    ...photo,
                    imageUrl: supabase.storage
                        .from("gallery")
                        .getPublicUrl(photo.storage_path).data.publicUrl,
                })
            );

            setPhotos(galleryItems);
            setLoading(false);
        }

        fetchPhotos();
    }, []);

    return (
        <section
            id="gallery"
            className="relative overflow-hidden bg-[#0b111b] px-6 py-24 md:px-12"
        >
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-[120px]" />

            <div className="relative mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
                            Our Memories
                        </p>

                        <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                            Class <span className="text-cyan-400">Gallery.</span>
                        </h2>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400 md:text-base">
                            A collection of moments, stories, and memories
                            captured throughout our journey together.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ImageIcon size={18} className="text-cyan-400" />
                        <span>
                            {photos.length} Photos
                        </span>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex min-h-60 items-center justify-center">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <LoaderCircle className="animate-spin" size={22} />
                            <span className="text-sm">Loading gallery...</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && photos.length === 0 && (
                    <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-center">
                        <ImageIcon size={42} className="mb-4 text-gray-600" />

                        <h3 className="text-lg font-semibold text-white">
                            No Photos Yet
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                            Our memories will appear here soon.
                        </p>
                    </div>
                )}

                {/* Photo Grid */}
                {!loading && !error && photos.length > 0 && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {photos.map((photo) => (
                            <article
                                key={photo.id}
                                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111b29] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden bg-[#182332]">
                                    <img
                                        src={photo.imageUrl}
                                        alt={photo.caption || "Class gallery photo"}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />
                                </div>

                                <div className="p-5">
                                    <p className="line-clamp-2 min-h-10 text-sm leading-6 text-gray-200">
                                        {photo.caption || "Untitled memory"}
                                    </p>

                                    <p className="mt-4 text-xs text-gray-500">
                                        {new Date(photo.created_at).toLocaleDateString(
                                            "id-ID",
                                            {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                                timeZone: "Asia/Jakarta",
                                            }
                                        )}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
