
"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

const footerLinks = [
    { label: "Home", href: "/" },
    { label: "Subjects", href: "/subjects" },
    { label: "Members", href: "/members" },
    { label: "Gallery", href: "/gallery" },
];

function handleHomeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (window.location.pathname === "/") {
        e.preventDefault();

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }
}

export default function Footer() {
    return (
        <footer className="relative overflow-hidden border-t border-white/10 bg-[#0b111b] px-5 pb-8 pt-16 text-white sm:px-8 lg:px-12">
            <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-cyan-400/5 blur-[100px]" />

            <div className="relative mx-auto max-w-7xl">
                {/* Main Footer */}
                <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-3">

                    {/* Brand */}
                    <div>
                        <Link
                            href="/"
                            onClick={handleHomeClick}
                            className="inline-flex items-center gap-2"
                        >
                            <span className="text-2xl font-black tracking-tight">
                                syno
                                <span className="text-cyan-400">tion</span>
                                .a
                            </span>
                        </Link>

                        <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
                            A place where memories, connections, and
                            experiences become part of our story.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white">
                            Navigation
                        </h3>

                        <ul className="space-y-3">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={
                                            link.label === "Home"
                                                ? handleHomeClick
                                                : undefined
                                        }
                                        className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
                                    >
                                        {link.label}

                                        <ArrowUpRight
                                            size={13}
                                            className="opacity-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white">
                            Stay Connected
                        </h3>

                        <p className="mb-5 max-w-xs text-sm leading-6 text-slate-400">
                            Follow our journey and stay connected with
                            the people behind synotion.a.
                        </p>

                        <div className="flex items-center gap-3">
                            <a
                                href="https://www.instagram.com/synotion_a/"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Instagram"
                                className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
                            >
                                <FaInstagram size={17} />
                            </a>

                            <a
                                href="https://whatsapp.com/channel/0029VbDeupx4NVioALkCVV2F"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="YouTube"
                                className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
                            >
                                <FaWhatsapp size={17} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="flex flex-col justify-between gap-4 pt-7 text-xs text-slate-400 sm:flex-row sm:items-center">
                    <p>
                        © 2026 synotion.a. All rights reserved.
                    </p>

                    <p>
                        Made with{" "}
                        <span className="text-cyan-400">♥</span>
                        {" "}by our class.
                    </p>
                </div>
            </div>
        </footer>
    );
}
