
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { supabase } from "@/lib/supabase";

type Member = {
    id: string;
    name: string;
    nim: string;
    position: string;
    instagram_url: string | null;
    photo_path: string | null;
};

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchMembers() {
            const { data, error } = await supabase
                .from("class_members")
                .select("*");

            if (error) {
                setError("Failed to load class members.");
                setLoading(false);
                return;
            }

            // Sort members by NIM, from lowest to highest.
            const sortedMembers = (data ?? []).sort((a, b) =>
                String(a.nim).localeCompare(String(b.nim), undefined, {
                    numeric: true,
                })
            );

            setMembers(sortedMembers);
            setLoading(false);
        }

        fetchMembers();
    }, []);

    const filteredMembers = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) return members;

        return members.filter((member) =>
            member.name.toLowerCase().includes(keyword) ||
            String(member.nim).toLowerCase().includes(keyword) ||
            member.position.toLowerCase().includes(keyword)
        );
    }, [members, search]);

    function getPhotoUrl(path: string | null) {
        if (!path) return null;

        return supabase.storage
            .from("class-members")
            .getPublicUrl(path).data.publicUrl;
    }

    return (
        <main className="min-h-screen bg-[#101722] px-5 pb-24 pt-32 text-white sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-12">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                        <Users size={16} />
                        Get to Know Us
                    </div>

                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                        Our <span className="text-cyan-400">Members.</span>
                    </h1>

                    <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                        Meet the people behind SYNOTION. Get to know
                        every member of our class and connect with them.
                    </p>
                </div>

                {/* Member Information */}
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-slate-400">
                            Showing{" "}
                            <span className="font-semibold text-white">
                                {loading ? "—" : filteredMembers.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-white">
                                {loading ? "—" : members.length}
                            </span>{" "}
                            members
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search members..."
                            className="w-full rounded-xl border border-white/10 bg-[#151f2d] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                        />
                    </div>
                </div>


                {/* Members Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div
                                key={index}
                                className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-[#151f2d]"
                            >
                                <div className="aspect-[4/5] bg-white/5" />
                                <div className="space-y-3 p-4">
                                    <div className="h-4 w-3/4 rounded bg-white/10" />
                                    <div className="h-3 w-1/2 rounded bg-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                ) : filteredMembers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                        {filteredMembers.map((member) => {
                            const photoUrl = getPhotoUrl(member.photo_path);

                            return (
                                <article
                                    key={member.id}
                                    className="group overflow-hidden rounded-2xl border border-white/10 bg-[#151f2d] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_12px_35px_rgba(0,245,255,0.07)]"
                                >
                                    {/* Photo */}
                                    <div className="relative aspect-[4/4.5] overflow-hidden bg-[#1b2838]">
                                        {photoUrl ? (
                                            <img
                                                src={photoUrl}
                                                alt={member.name}
                                                loading="lazy"
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Users size={42} className="text-slate-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Member Details */}
                                    <div className="flex min-h-[125px] flex-col justify-between p-4">
                                        <div className="min-w-0">
                                            <h2 className="break-words text-sm font-bold leading-snug text-white sm:text-base">
                                                {member.name}
                                            </h2>

                                            <p className="mt-1 text-xs font-medium tracking-wide text-cyan-400">
                                                {member.nim}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-400">
                                                {member.position === "Anggota"
                                                    ? "Member"
                                                    : member.position}
                                            </p>
                                        </div>

                                        {member.instagram_url && (
                                            <div className="mt-4 flex justify-end">
                                                <a
                                                    href={member.instagram_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`${member.name}'s Instagram`}
                                                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
                                                >
                                                    <FaInstagram size={16} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-5 text-center">
                        <Users size={36} className="mb-4 text-slate-500" />

                        <h3 className="text-lg font-bold text-white">
                            No Members Found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            {search
                                ? "Try searching with another name or student ID."
                                : "There are no members available yet."}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
