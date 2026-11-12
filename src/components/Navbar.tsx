
"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 z-50 w-full px-12 py-4 transition-all duration-300 ${isScrolled
        ? "backdrop-blur-md"
        : "bg-transparent backdrop-blur-none"
        }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <h1 className="text-4xl font-bold text-white">
          syno
          <span className="text-cyan-400">tion</span>
          .a
        </h1>

        {/* Navigation */}
        <div className="hidden items-center gap-10 md:flex">
          {[
            { label: "Home", href: "/" },
            { label: "Subjects", href: "/subjects" },
            { label: "Members", href: "/members" },
            { label: "Gallery", href: "/gallery" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="relative text-md font-semibold transition hover:text-cyan-400
        after:absolute after:bottom-[-6px] after:left-1/2
        after:h-[2px] after:w-0 after:-translate-x-1/2
        after:bg-cyan-400 after:transition-all after:duration-300
        hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
