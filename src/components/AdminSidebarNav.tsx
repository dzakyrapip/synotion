
"use client";

import { useEffect, useState } from "react";
import {
    CalendarDays,
    Images,
    LayoutDashboard,
} from "lucide-react";

import LogoutButton from "@/components/LogoutButtons";

const navigation = [
    {
        label: "Dashboard",
        id: "dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Hero Gallery",
        id: "gallery",
        icon: Images,
    },
    {
        label: "Class Schedule",
        id: "class-schedule-manager",
        icon: CalendarDays,
    },
];

export default function AdminSidebarNav() {
    const [activeSection, setActiveSection] = useState("dashboard");

    useEffect(() => {
        const sections = navigation
            .map((item) => document.getElementById(item.id))
            .filter((section): section is HTMLElement => section !== null);

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleSections = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            b.intersectionRatio - a.intersectionRatio
                    );

                if (visibleSections.length > 0) {
                    setActiveSection(visibleSections[0].target.id);
                }
            },
            {
                root: null,
                rootMargin: "-15% 0px -65% 0px",
                threshold: [0, 0.1, 0.25, 0.5, 0.75],
            }
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    function handleNavigation(
        event: React.MouseEvent<HTMLAnchorElement>,
        id: string
    ) {
        event.preventDefault();

        const target = document.getElementById(id);

        if (!target) return;

        setActiveSection(id);

        target.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        window.history.replaceState(null, "", `#${id}`);
    }

    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-200 bg-white px-6 py-8 md:block">

            {/* Brand */}
            <a
                href="/"
                className="text-2xl font-bold text-blue-500"
            >
                synotion<span className="text-orange-400">.a</span>
            </a>

            <p className="mt-2 text-xs text-slate-400">
                ADMINISTRATION PANEL
            </p>

            {/* Navigation */}
            <div className="mt-12">

                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Menu
                </p>

                <nav className="space-y-2">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;

                        return (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                onClick={(event) =>
                                    handleNavigation(event, item.id)
                                }
                                aria-current={
                                    isActive ? "location" : undefined
                                }
                                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                                    isActive
                                        ? "bg-blue-50 font-semibold text-blue-600 shadow-sm"
                                        : "font-medium text-slate-500 hover:bg-slate-100 hover:text-blue-500"
                                }`}
                            >
                                <Icon
                                    size={20}
                                    className={`transition-colors ${
                                        isActive
                                            ? "text-blue-600"
                                            : "text-slate-400 group-hover:text-blue-500"
                                    }`}
                                />

                                <span>{item.label}</span>

                                {isActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                                )}
                            </a>
                        );
                    })}
                </nav>
            </div>

            {/* Sidebar Bottom */}
            <div className="absolute bottom-8 left-6 right-6 space-y-2">

                <a
                    href="/"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-blue-500"
                >
                    <span className="text-lg">⌂</span>
                    Back to Website
                </a>

                <LogoutButton />

            </div>
        </aside>
    );
}
