
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigation = [
        { label: "Home", href: "/" },
        { label: "Subjects", href: "/subjects" },
        { label: "Members", href: "/members" },
        { label: "Gallery", href: "/Gallery" },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        handleScroll();

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 z-50 w-full px-5 py-4 transition-all duration-300 sm:px-8 lg:px-12 ${
                isScrolled || isMenuOpen
                    ? "bg-[#101722]/80 backdrop-blur-md"
                    : "bg-transparent backdrop-blur-none"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between">

                {/* Logo */}
                <Link
                    href="/"
                    className="text-3xl font-bold text-white sm:text-4xl"
                    onClick={() => setIsMenuOpen(false)}
                >
                    syno
                    <span className="text-cyan-400">tion</span>
                    .a
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-8 md:flex lg:gap-10">
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="
                                relative text-base font-semibold
                                !text-white
                                transition-colors duration-300
                                hover:!text-cyan-400
                                after:absolute after:bottom-[-6px]
                                after:left-1/2 after:h-[2px]
                                after:w-0 after:-translate-x-1/2
                                after:bg-cyan-400
                                after:transition-all after:duration-300
                                hover:after:w-full
                            "
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="text-white transition-colors hover:text-cyan-400 md:hidden"
                >
                    {isMenuOpen ? (
                        <X size={28} />
                    ) : (
                        <Menu size={28} />
                    )}
                </button>
            </div>

            {/* Mobile Navigation */}
            <div
                className={`overflow-hidden transition-all duration-300 md:hidden ${
                    isMenuOpen
                        ? "max-h-64 opacity-100"
                        : "max-h-0 opacity-0"
                }`}
            >
                <div className="flex flex-col gap-5 px-2 pb-4 pt-6">
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="
                                w-fit text-base font-semibold
                                !text-white
                                transition-colors duration-300
                                hover:!text-cyan-400
                            "
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
