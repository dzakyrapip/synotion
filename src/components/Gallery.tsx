
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
    Search,
    Heart,
    Crown,
    SlidersHorizontal,
    Trophy,
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

type LikeResponse = {
    likeCounts: Record<string, number>;
    likedPhotoIds: string[];
};

type RankedPhoto = {
    photo: GalleryItem;
    likes: number;
    rank: number;
};

export default function Gallery() {
    const [photos, setPhotos] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Like system
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
    const [likedPhotoIds, setLikedPhotoIds] = useState<string[]>([]);
    const [likingPhoto, setLikingPhoto] = useState<string | null>(null);
    const [likesLoading, setLikesLoading] = useState(true);

    // Filters
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [minimumLikes, setMinimumLikes] = useState(0);
    const [sortBy, setSortBy] = useState("popular");

    // Fetch photos from Supabase
    useEffect(() => {
        let cancelled = false;

        async function fetchPhotos() {
            setLoading(true);
            setError(null);

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

                if (!cancelled) {
                    setPhotos(items);
                }
            } catch (err) {
                console.error("Gallery fetch error:", err);

                if (!cancelled) {
                    setError("Gagal memuat galeri foto.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchPhotos();

        return () => {
            cancelled = true;
        };
    }, []);

    // Initialize device ID and fetch likes
    useEffect(() => {
        let cancelled = false;

        async function initializeLikes() {
            try {
                let id = localStorage.getItem("synotion_device_id");

                if (!id) {
                    id = crypto.randomUUID();
                    localStorage.setItem("synotion_device_id", id);
                }

                if (cancelled) return;

                setDeviceId(id);

                const response = await fetch(
                    `/api/gallery/likes?deviceId=${encodeURIComponent(id)}`
                );

                if (!response.ok) {
                    throw new Error("Gagal mengambil data like.");
                }

                const data: LikeResponse = await response.json();

                if (!cancelled) {
                    setLikeCounts(data.likeCounts ?? {});
                    setLikedPhotoIds(data.likedPhotoIds ?? []);
                }
            } catch (err) {
                console.error("Fetch likes error:", err);
            } finally {
                if (!cancelled) {
                    setLikesLoading(false);
                }
            }
        }

        initializeLikes();

        return () => {
            cancelled = true;
        };
    }, []);

    // Get upload date in Jakarta timezone
    function getUploadDate(date: string) {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(new Date(date));

        const year = parts.find((part) => part.type === "year")?.value;
        const month = parts.find((part) => part.type === "month")?.value;
        const day = parts.find((part) => part.type === "day")?.value;

        return `${year}-${month}-${day}`;
    }

    // Sort all photos by popularity
    const popularPhotos = [...photos].sort((a, b) => {
        const likesA = likeCounts[a.id] ?? 0;
        const likesB = likeCounts[b.id] ?? 0;

        return (
            likesB - likesA ||
            new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        );
    });

    // Calculate competition ranking
    // Example: 100, 100, 80 = Rank 1, 1, 3
    // Photos with 0 likes are excluded from the podium.
    const rankedPhotos: RankedPhoto[] = photos
        .map((photo) => {
            const likes = likeCounts[photo.id] ?? 0;

            const rank =
                1 +
                photos.filter(
                    (otherPhoto) =>
                        (likeCounts[otherPhoto.id] ?? 0) > likes
                ).length;

            return {
                photo,
                likes,
                rank,
            };
        })
        .filter((item) => item.likes > 0 && item.rank <= 3)
        .sort((a, b) => {
            return (
                a.rank - b.rank ||
                new Date(b.photo.created_at).getTime() -
                    new Date(a.photo.created_at).getTime()
            );
        });

    // Group photos with the same rank
    const podiumGroups = [1, 2, 3].map((rank) => ({
        rank,
        photos: rankedPhotos.filter((item) => item.rank === rank),
    }));

    // Filter and sort photos
    const filteredPhotos = photos
        .filter((photo) => {
            const query = searchQuery.trim().toLowerCase();
            const caption = (photo.caption ?? "").toLowerCase();

            const matchesCaption = caption.includes(query);

            const uploadDate = getUploadDate(photo.created_at);

            const matchesDate =
                (!dateFrom || uploadDate >= dateFrom) &&
                (!dateTo || uploadDate <= dateTo);

            const matchesLikes =
                (likeCounts[photo.id] ?? 0) >= minimumLikes;

            return matchesCaption && matchesDate && matchesLikes;
        })
        .sort((a, b) => {
            const likesA = likeCounts[a.id] ?? 0;
            const likesB = likeCounts[b.id] ?? 0;

            if (sortBy === "popular") {
                return (
                    likesB - likesA ||
                    new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
            }

            if (sortBy === "least") {
                return (
                    likesA - likesB ||
                    new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
            }

            return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
        });

    // Selected photo
    const selectedPhoto =
        selectedIndex !== null
            ? filteredPhotos[selectedIndex] ?? null
            : null;

    const closePopup = () => setSelectedIndex(null);

    // Previous photo
    const showPrevious = () => {
        if (selectedIndex === null || filteredPhotos.length === 0) return;

        setSelectedIndex(
            (selectedIndex - 1 + filteredPhotos.length) %
                filteredPhotos.length
        );
    };

    // Next photo
    const showNext = () => {
        if (selectedIndex === null || filteredPhotos.length === 0) return;

        setSelectedIndex(
            (selectedIndex + 1) % filteredPhotos.length
        );
    };

    // Open a podium photo and reset filters
    function openRankedPhoto(photoId: string) {
        const index = popularPhotos.findIndex(
            (photo) => photo.id === photoId
        );

        if (index === -1) return;

        setSearchQuery("");
        setDateFrom("");
        setDateTo("");
        setMinimumLikes(0);
        setSortBy("popular");
        setSelectedIndex(index);
    }

    // Toggle like
    async function handleLike(photoId: string) {
        if (!deviceId || likingPhoto !== null) return;

        setLikingPhoto(photoId);

        try {
            const response = await fetch("/api/gallery/likes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    photoId,
                    deviceId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Gagal memperbarui like."
                );
            }

            setLikeCounts((current) => ({
                ...current,
                [photoId]: data.count,
            }));

            setLikedPhotoIds((current) =>
                data.liked
                    ? [...current.filter((id) => id !== photoId), photoId]
                    : current.filter((id) => id !== photoId)
            );
        } catch (err) {
            console.error("Like error:", err);
            window.alert(
                err instanceof Error
                    ? err.message
                    : "Gagal memperbarui like."
            );
        } finally {
            setLikingPhoto(null);
        }
    }

    // Download photo
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

            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch (err) {
            console.error("Download error:", err);
            window.open(selectedPhoto.imageUrl, "_blank");
        }
    };

    // Keyboard navigation
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
    }, [selectedIndex, filteredPhotos.length]);

    // Close popup when filters change
    function resetPopupAndUpdate(callback: () => void) {
        setSelectedIndex(null);
        callback();
    }

    // Podium styling
    const podiumStyles = {
        1: {
            title: "TOP 1",
            crown: "text-yellow-300",
            border: "border-yellow-400/40",
            background: "from-yellow-400/15 to-yellow-400/[0.02]",
            text: "text-yellow-300",
            icon: "text-yellow-300",
        },
        2: {
            title: "TOP 2",
            crown: "text-slate-300",
            border: "border-slate-300/30",
            background: "from-slate-300/10 to-slate-300/[0.02]",
            text: "text-slate-300",
            icon: "text-slate-300",
        },
        3: {
            title: "TOP 3",
            crown: "text-orange-400",
            border: "border-orange-400/30",
            background: "from-orange-400/10 to-orange-400/[0.02]",
            text: "text-orange-400",
            icon: "text-orange-400",
        },
    };

    return (
        <section
            id="gallery"
            className="relative min-h-screen overflow-hidden bg-[#0b111b] px-5 py-28 sm:px-8 lg:px-12"
        >
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-[120px]" />

            <div className="relative mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-10">
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
                            {filteredPhotos.length} Photos
                        </div>
                    </div>
                </div>

                {/* Search Box */}
                <div className="mb-5">
                    <div className="relative">
                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        />

                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) =>
                                resetPopupAndUpdate(() =>
                                    setSearchQuery(event.target.value)
                                )
                            }
                            placeholder="Search photos by caption..."
                            className="w-full rounded-xl border border-white/10 bg-[#111b29] py-4 pl-12 pr-5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400/50"
                        />
                    </div>
                </div>

                {/* Gallery Filters */}
                <div className="mb-8 rounded-2xl border border-white/10 bg-[#111b29] p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                        <SlidersHorizontal
                            size={17}
                            className="text-cyan-400"
                        />
                        Filter Gallery
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        {/* Date From */}
                        <div>
                            <label className="mb-2 block text-xs text-gray-400">
                                Upload From
                            </label>

                            <input
                                type="date"
                                value={dateFrom}
                                max={dateTo || undefined}
                                onChange={(event) =>
                                    resetPopupAndUpdate(() =>
                                        setDateFrom(event.target.value)
                                    )
                                }
                                className="w-full rounded-lg border border-white/10 bg-[#0b111b] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="mb-2 block text-xs text-gray-400">
                                Upload Until
                            </label>

                            <input
                                type="date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(event) =>
                                    resetPopupAndUpdate(() =>
                                        setDateTo(event.target.value)
                                    )
                                }
                                className="w-full rounded-lg border border-white/10 bg-[#0b111b] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                            />
                        </div>

                        {/* Minimum Likes */}
                        <div>
                            <label className="mb-2 block text-xs text-gray-400">
                                Minimum Likes
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={minimumLikes}
                                onChange={(event) =>
                                    resetPopupAndUpdate(() =>
                                        setMinimumLikes(
                                            Math.max(
                                                0,
                                                Number(event.target.value) || 0
                                            )
                                        )
                                    )
                                }
                                className="w-full rounded-lg border border-white/10 bg-[#0b111b] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                            />
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="mb-2 block text-xs text-gray-400">
                                Sort By
                            </label>

                            <select
                                value={sortBy}
                                onChange={(event) =>
                                    resetPopupAndUpdate(() =>
                                        setSortBy(event.target.value)
                                    )
                                }
                                className="w-full rounded-lg border border-white/10 bg-[#0b111b] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                            >
                                <option value="popular">Most Liked</option>
                                <option value="newest">Newest</option>
                                <option value="least">Least Liked</option>
                            </select>
                        </div>
                    </div>

                    {/* Reset Filters */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedIndex(null);
                            setSearchQuery("");
                            setDateFrom("");
                            setDateTo("");
                            setMinimumLikes(0);
                            setSortBy("popular");
                        }}
                        className="mt-4 text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                    >
                        Reset Filters
                    </button>
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

                {/* Empty Gallery */}
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

                {/* Top 3 Podium */}
                {!loading &&
                    !error &&
                    rankedPhotos.length > 0 && (
                        <div className="mb-12">
                            <div className="mb-7 text-center">
                                <div className="mb-3 flex items-center justify-center gap-2 text-cyan-400">
                                    <Trophy size={19} />
                                    <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                                        Community Favorites
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold text-white sm:text-3xl">
                                    Most Liked{" "}
                                    <span className="text-cyan-400">
                                        Photos.
                                    </span>
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                    The most loved moments of our class.
                                </p>
                            </div>

                            {/* Podium Layout */}
                            <div className="grid grid-cols-3 items-start gap-2 sm:gap-5">

                                {/* Order: Top 2, Top 1, Top 3 */}
                                {[2, 1, 3].map((rank) => {
                                    const group = podiumGroups.find(
                                        (item) => item.rank === rank
                                    );

                                    if (!group || group.photos.length === 0) {
                                        return (
                                            <div
                                                key={rank}
                                                className="hidden sm:block"
                                            />
                                        );
                                    }

                                    const style =
                                        podiumStyles[
                                            rank as keyof typeof podiumStyles
                                        ];

                                    return (
                                        <div
                                            key={rank}
                                            className={`min-w-0 ${
                                                rank === 1
                                                    ? "pt-0"
                                                    : rank === 2
                                                      ? "pt-8 sm:pt-10"
                                                      : "pt-12 sm:pt-16"
                                            }`}
                                        >
                                            {/* Rank Header */}
                                            <div className="mb-3 flex flex-col items-center text-center">
                                                <Crown
                                                    size={
                                                        rank === 1 ? 34 : 25
                                                    }
                                                    fill="currentColor"
                                                    className={`${style.crown} mb-2`}
                                                />

                                                <span
                                                    className={`text-xs font-black tracking-widest sm:text-sm ${style.text}`}
                                                >
                                                    {style.title}
                                                </span>

                                                {group.photos.length > 1 && (
                                                    <span className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                                                        {group.photos.length} tied
                                                    </span>
                                                )}
                                            </div>

                                            {/* Photos in the same rank */}
                                            <div className="space-y-3">
                                                {group.photos.map(
                                                    ({ photo, likes }) => (
                                                        <button
                                                            key={photo.id}
                                                            type="button"
                                                            onClick={() =>
                                                                openRankedPhoto(
                                                                    photo.id
                                                                )
                                                            }
                                                            className={`group relative block w-full overflow-hidden rounded-xl border bg-gradient-to-b p-1.5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-2xl sm:p-2 ${
                                                                style.border
                                                            } ${
                                                                style.background
                                                            } ${
                                                                rank === 1
                                                                    ? "shadow-lg shadow-yellow-400/5"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="relative overflow-hidden rounded-lg bg-[#0b111b] sm:rounded-xl">
                                                                <img
                                                                    src={
                                                                        photo.imageUrl
                                                                    }
                                                                    alt={
                                                                        photo.caption ||
                                                                        "Class memory"
                                                                    }
                                                                    loading="lazy"
                                                                    className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
                                                                        rank === 1
                                                                            ? "h-36 sm:h-64"
                                                                            : "h-28 sm:h-48"
                                                                    }`}
                                                                />

                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                                                                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md sm:bottom-3 sm:left-3 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                                                                    <Heart
                                                                        size={13}
                                                                        fill="currentColor"
                                                                        className="text-red-500"
                                                                    />
                                                                    {likes}
                                                                </div>
                                                            </div>

                                                            <div className="px-1 pb-1 pt-2 sm:px-2 sm:pb-2">
                                                                <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-300 sm:text-xs">
                                                                    {photo.caption ||
                                                                        "Class Memory"}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-7 border-b border-white/10" />
                        </div>
                    )}

                {/* No Search Results */}
                {!loading &&
                    !error &&
                    photos.length > 0 &&
                    filteredPhotos.length === 0 && (
                        <div className="flex min-h-60 flex-col items-center justify-center text-center">
                            <Search
                                size={36}
                                className="mb-4 text-gray-600"
                            />

                            <h3 className="text-lg font-semibold text-white">
                                No Photos Found
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                No photos match your current filters.
                            </p>
                        </div>
                    )}

                {/* Pinterest Masonry Grid */}
                {!loading && !error && filteredPhotos.length > 0 && (
                    <>
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">
                                All Memories
                            </h3>

                            {likesLoading && (
                                <p className="flex items-center gap-2 text-xs text-gray-500">
                                    <LoaderCircle
                                        size={14}
                                        className="animate-spin"
                                    />
                                    Updating rankings...
                                </p>
                            )}
                        </div>

                        <div className="columns-2 gap-2 sm:columns-2 sm:gap-3 lg:columns-3 xl:columns-4">
                            {filteredPhotos.map((photo, index) => {
                                const likes = likeCounts[photo.id] ?? 0;
                                const isLiked =
                                    likedPhotoIds.includes(photo.id);

                                return (
                                    <div
                                        key={photo.id}
                                        className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl bg-[#182332] sm:mb-4"
                                    >
                                        {/* Open Photo */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedIndex(index)
                                            }
                                            aria-label={`Open photo ${index + 1}`}
                                            className="block w-full text-left"
                                        >
                                            <img
                                                src={photo.imageUrl}
                                                alt={
                                                    photo.caption ||
                                                    "Class memory"
                                                }
                                                loading="lazy"
                                                className="block h-auto w-full transition duration-500 group-hover:scale-[1.03]"
                                            />
                                        </button>

                                        {/* Like Button */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleLike(photo.id)
                                            }
                                            disabled={
                                                !deviceId ||
                                                likingPhoto !== null ||
                                                likesLoading
                                            }
                                            aria-label={
                                                isLiked
                                                    ? "Unlike photo"
                                                    : "Like photo"
                                            }
                                            className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-sm text-white backdrop-blur-md transition hover:scale-105 disabled:opacity-50"
                                        >
                                            <Heart
                                                size={17}
                                                fill={
                                                    isLiked
                                                        ? "currentColor"
                                                        : "none"
                                                }
                                                className={
                                                    isLiked
                                                        ? "text-red-500"
                                                        : "text-white"
                                                }
                                            />

                                            <span className="font-semibold">
                                                {likes}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
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
                    {filteredPhotos.length > 1 && (
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
                                alt={
                                    selectedPhoto.caption ||
                                    "Class memory"
                                }
                                className="max-h-[65vh] w-full object-contain md:max-h-[85vh]"
                            />
                        </div>

                        {/* Information */}
                        <div className="flex w-full flex-col justify-between gap-6 overflow-y-auto p-5 md:w-72 md:shrink-0 md:p-7">
                            <div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
                                    Class Memories
                                </p>

                                <h3 className="text-lg font-semibold text-white">
                                    Photo Details
                                </h3>

                                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                                    {selectedPhoto.caption ||
                                        "No caption available."}
                                </p>

                                {/* Upload Date */}
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

                                {/* Popup Like */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleLike(selectedPhoto.id)
                                    }
                                    disabled={
                                        !deviceId ||
                                        likingPhoto !== null ||
                                        likesLoading
                                    }
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                                >
                                    <Heart
                                        size={18}
                                        fill={
                                            likedPhotoIds.includes(
                                                selectedPhoto.id
                                            )
                                                ? "currentColor"
                                                : "none"
                                        }
                                        className={
                                            likedPhotoIds.includes(
                                                selectedPhoto.id
                                            )
                                                ? "text-red-500"
                                                : "text-gray-300"
                                        }
                                    />

                                    {likedPhotoIds.includes(
                                        selectedPhoto.id
                                    )
                                        ? "Liked"
                                        : "Like Photo"}

                                    <span className="text-gray-400">
                                        (
                                        {likeCounts[selectedPhoto.id] ?? 0}
                                        )
                                    </span>
                                </button>

                                {/* Photo Counter */}
                                <p className="mt-5 text-xs text-gray-500">
                                    {selectedIndex! + 1} of{" "}
                                    {filteredPhotos.length} photos
                                </p>
                            </div>

                            {/* Download */}
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
                    {filteredPhotos.length > 1 && (
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
