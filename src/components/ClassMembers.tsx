
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    UserRound,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

import { supabase } from "@/lib/supabase";

type ClassMember = {
    id: string;
    name: string;
    nim: string;
    position: string;
    instagram_url: string | null;
    photo_path: string | null;
    display_order: number;
};

const FEATURED_ROLES = [
    "Ketua Murid",
    "Wakil Ketua",
    "Bendahara 1",
    "Bendahara 2",
];

function photoUrl(path: string | null) {
    if (!path) return null;

    return supabase.storage
        .from("class-members")
        .getPublicUrl(path).data.publicUrl;
}

function MemberCard({
    member,
    index,
}: {
    member: ClassMember | null;
    index: number;
}) {
    const image = photoUrl(member?.photo_path ?? null);
    const role = FEATURED_ROLES[index];

    return (
        <article className="group relative min-w-0 overflow-hidden border border-white/10 bg-[#151f2d] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#202d3d]">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt={member?.name ?? role}
                        className="h-full w-full object-cover object-center grayscale-[15%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#34465a_0%,#202d3d_48%,#172231_100%)]">
                        <UserRound
                            className="h-20 w-20 text-white/25"
                            strokeWidth={1}
                        />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#0b111b] via-transparent to-black/10" />

                {member?.instagram_url && (
                    <a
                        href={member.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Instagram ${member.name}`}
                        className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/35 p-2 text-white backdrop-blur transition hover:border-cyan-300 hover:text-cyan-200"
                    >
                        <FaInstagram size={15} />
                    </a>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="mb-2 inline-flex border-l-2 border-cyan-300 pl-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                        {role}
                    </p>

                    <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
                        {member?.name ?? "Belum ditambahkan"}
                    </h3>

                    <p className="mt-1 font-mono text-xs tracking-wider text-white/55">
                        {member?.nim ?? "NIM —"}
                    </p>
                </div>
            </div>
        </article>
    );
}

export default function ClassMembers() {
    const [members, setMembers] = useState<ClassMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadMembers() {
            const { data, error: queryError } = await supabase
                .from("class_members")
                .select("*")
                .order("display_order", { ascending: true })
                .order("created_at", { ascending: true });

            if (!active) return;

            if (queryError) {
                setError("Data anggota belum dapat dimuat.");
            } else {
                setMembers((data ?? []) as ClassMember[]);
            }

            setLoading(false);
        }

        loadMembers();

        return () => {
            active = false;
        };
    }, []);

    const featured = useMemo(
        () =>
            FEATURED_ROLES.map(
                (role) =>
                    members.find(
                        (member) =>
                            member.position.trim().toLowerCase() ===
                            role.toLowerCase()
                    ) ?? null
            ),
        [members]
    );

    const otherMembers = useMemo(
        () =>
            members.filter(
                (member) =>
                    !FEATURED_ROLES.some(
                        (role) =>
                            role.toLowerCase() ===
                            member.position.trim().toLowerCase()
                    )
            ),
        [members]
    );

    return (
        <section
            id="class-members"
            className="relative overflow-hidden bg-[#101722] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28"
        >
            <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(white_1px,transparent_1px)] [background-size:44px_44px]" />

            <div className="relative mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-10 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                            The people behind the class
                        </p>

                        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                            Class Structure.
                        </h2>
                    </div>

                    <p className="max-w-sm text-sm leading-6 text-slate-400">
                        Meet the people who keep our class organized,
                        connected, and moving forward.
                    </p>
                </div>

                {error && (
                    <p className="mb-5 text-sm text-slate-400">
                        {error}
                    </p>
                )}

                {/* Five main positions */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                    {featured.map((member, index) => (
                        <MemberCard
                            key={FEATURED_ROLES[index]}
                            member={member}
                            index={index}
                        />
                    ))}
                </div>

                {loading && (
                    <p className="mt-4 text-xs text-slate-400">
                        Loading class members...
                    </p>
                )}

                {/* Other members link */}
                <div className="mt-8 border-t border-white/10 pt-6">
                    <Link
                        href="/members"
                        className="group inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                    >
                        View Another Member

                        <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-1"
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}
