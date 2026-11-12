
"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserRound,
    X,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";
import { supabase } from "@/lib/supabase";

type Member = {
    id: string;
    name: string;
    nim: string;
    position: string;
    instagram_url: string | null;
    photo_path: string | null;
    display_order: number;
    created_at: string;
};

const PAGE_SIZE = 10;

const EMPTY_FORM = {
    name: "",
    nim: "",
    isOthers: false,
    customPosition: "",
    instagramUrl: "",
};

function getPhotoUrl(path: string | null) {
    if (!path) return null;

    return supabase.storage
        .from("class-members")
        .getPublicUrl(path).data.publicUrl;
}

export default function ClassMembersManager() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editing, setEditing] = useState<Member | null>(null);

    const [form, setForm] = useState(EMPTY_FORM);
    const [photo, setPhoto] = useState<File | null>(null);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [showForm, setShowForm] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Load members
    const loadMembers = useCallback(async () => {
        setLoading(true);

        try {
            const response = await fetch(
                "/admin/members",
                { cache: "no-store" }
            );

            const result = await response.json();

            if (!response.ok) {
                setError(
                    result.error ?? "Failed to load members."
                );
            } else {
                setMembers(result.members ?? []);
                setError("");
            }
        } catch {
            setError("An error occurred while loading members.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMembers();
    }, [loadMembers]);

    // Search
    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return members;

        return members.filter((member) =>
            member.name.toLowerCase().includes(keyword) ||
            member.nim.toLowerCase().includes(keyword) ||
            member.position.toLowerCase().includes(keyword)
        );
    }, [members, search]);

    // Pagination
    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / PAGE_SIZE)
    );

    const currentPage = Math.min(page, totalPages);

    const visibleMembers = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // Add form
    function openAddForm() {
        setEditing(null);
        setForm(EMPTY_FORM);
        setPhoto(null);

        setError("");
        setMessage("");

        setShowForm(true);
    }

    // Edit form
    function openEditForm(member: Member) {
        const isOthers = member.position !== "Anggota";

        setEditing(member);

        setForm({
            name: member.name,
            nim: member.nim,
            isOthers,
            customPosition: isOthers
                ? member.position
                : "",
            instagramUrl: member.instagram_url ?? "",
        });

        setPhoto(null);

        setError("");
        setMessage("");

        setShowForm(true);
    }

    // Submit form
    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const body = new FormData();

            body.set("name", form.name.trim());
            body.set("nim", form.nim.trim());

            body.set(
                "position_type",
                form.isOthers ? "Others" : "Anggota"
            );

            body.set(
                "custom_position",
                form.customPosition.trim()
            );

            body.set(
                "instagram_url",
                form.instagramUrl.trim()
            );

            if (photo) {
                body.set("photo", photo);
            }

            const response = await fetch(
                editing
                    ? `/admin/members/${editing.id}`
                    : "/admin/members",
                {
                    method: editing ? "PATCH" : "POST",
                    body,
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setError(
                    result.error ??
                    "Failed to save member data."
                );

                return;
            }

            setMessage(
                editing
                    ? "Member information updated successfully."
                    : "Member added successfully."
            );

            setShowForm(false);
            setForm(EMPTY_FORM);
            setPhoto(null);
            setEditing(null);

            await loadMembers();

        } catch {
            setError("An error occurred while saving member data.");
        } finally {
            setSaving(false);
        }
    }

    // Delete member
    async function handleDelete(member: Member) {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${member.name}?`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `/admin/members/${member.id}`,
                {
                    method: "DELETE",
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setError(
                    result.error ?? "Failed to delete member."
                );

                return;
            }

            setMessage(`${member.name} was deleted successfully.`);

            await loadMembers();

        } catch {
            setError("An error occurred while deleting member data.");
        }
    }

    return (
        <section
            id="class-members-manager"
            className="mt-10 scroll-mt-8"
        >
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                        Class Members
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Manage your class members and their information.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                >
                    <Plus size={17} />
                    Add Member
                </button>
            </div>

            {/* Notifications */}
            {message && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                </p>
            )}

            {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {/* Form */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mb-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">
                                {editing
                                    ? "Edit Member"
                                    : "Add New Member"}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                All fields marked with an asterisk (*) are required.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                            aria-label="Close form"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Name and NIM */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            Full Name *

                            <input
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter member's full name"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </label>

                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            Student ID (NIM) *

                            <input
                                required
                                value={form.nim}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        nim: e.target.value,
                                    })
                                }
                                placeholder="Enter student ID number"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </label>
                    </div>

                    {/* Position */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">
                            Position *
                        </p>

                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 transition hover:bg-slate-50">
                            <input
                                type="checkbox"
                                checked={form.isOthers}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        isOthers: e.target.checked,
                                        customPosition: e.target.checked
                                            ? form.customPosition
                                            : "",
                                    })
                                }
                                className="h-4 w-4 accent-blue-600"
                            />

                            <span>
                                <strong>Others</strong>

                                <span className="ml-2 text-slate-400">
                                    Check this box to enter a custom position.
                                </span>
                            </span>
                        </label>

                        {!form.isOthers ? (
                            <p className="text-xs text-slate-500">
                                The position will be saved as Member.
                            </p>
                        ) : (
                            <input
                                required
                                value={form.customPosition}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        customPosition: e.target.value,
                                    })
                                }
                                placeholder="Example: Class President, Treasurer, Lecturer"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        )}
                    </div>

                    {/* Instagram and Photo */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            Instagram Profile URL

                            <input
                                type="url"
                                value={form.instagramUrl}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        instagramUrl: e.target.value,
                                    })
                                }
                                placeholder="https://instagram.com/username"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />
                        </label>

                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            Member Photo

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) =>
                                    setPhoto(
                                        e.target.files?.[0] ?? null
                                    )
                                }
                                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-600"
                            />

                            <span className="block text-xs font-normal text-slate-400">
                                JPG, PNG, WEBP · Maximum 5 MB.
                                Leave empty when editing to keep the current photo.
                            </span>

                            {photo && (
                                <span className="block truncate text-xs text-blue-600">
                                    Selected file: {photo.name}
                                </span>
                            )}

                            {editing?.photo_path && !photo && (
                                <span className="block text-xs text-slate-500">
                                    Current photo: Available
                                </span>
                            )}
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            disabled={saving}
                            type="submit"
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : editing
                                    ? "Save Changes"
                                    : "Add Member"}
                        </button>
                    </div>
                </form>
            )}

            {/* Search */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-500">
                    <strong className="text-slate-900">
                        {filtered.length}
                    </strong>{" "}
                    members found
                </p>

                <div className="relative w-full sm:max-w-xs bottom-4">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search name, NIM, position..."
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                </div>
            </div>

            {/* Members table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Member</th>
                                <th className="px-5 py-4">Student ID</th>
                                <th className="px-5 py-4">Position</th>
                                <th className="px-5 py-4">Instagram</th>
                                <th className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center text-slate-400"
                                    >
                                        Loading members...
                                    </td>
                                </tr>
                            ) : visibleMembers.length ? (
                                visibleMembers.map((member) => {
                                    const image = getPhotoUrl(
                                        member.photo_path
                                    );

                                    return (
                                        <tr
                                            key={member.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    {image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={image}
                                                            alt={member.name}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                            <UserRound size={19} />
                                                        </span>
                                                    )}

                                                    <span className="font-semibold text-slate-800">
                                                        {member.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3 font-mono text-xs text-slate-500">
                                                {member.nim}
                                            </td>

                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                                                        member.position === "Anggota"
                                                            ? "bg-slate-100 text-slate-600"
                                                            : "bg-blue-50 text-blue-700"
                                                    }`}
                                                >
                                                    {member.position === "Anggota"
                                                        ? "Member"
                                                        : member.position}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3">
                                                {member.instagram_url ? (
                                                    <a
                                                        href={member.instagram_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-slate-500 transition hover:text-blue-600"
                                                    >
                                                        <FaInstagram size={14} />
                                                        Instagram
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(member)
                                                        }
                                                        aria-label={`Edit ${member.name}`}
                                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(member)
                                                        }
                                                        aria-label={`Delete ${member.name}`}
                                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center text-slate-400"
                                    >
                                        No matching members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-slate-400">
                        Showing{" "}
                        {filtered.length
                            ? (currentPage - 1) * PAGE_SIZE + 1
                            : 0}
                        –
                        {Math.min(
                            currentPage * PAGE_SIZE,
                            filtered.length
                        )}{" "}
                        of {filtered.length} members · 10 per page
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() =>
                                setPage((value) =>
                                    Math.max(1, value - 1)
                                )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span className="min-w-20 text-center text-xs font-medium text-slate-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() =>
                                setPage((value) =>
                                    Math.min(totalPages, value + 1)
                                )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
