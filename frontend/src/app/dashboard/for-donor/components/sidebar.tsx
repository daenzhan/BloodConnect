"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Heart, Calendar, User, MapPin, FileText, LogOut, MessageSquare, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [userId, setUserId] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const id = searchParams.get('userId') || searchParams.get('id');
        if (id && id !== 'null') {
            setUserId(id);
            localStorage.setItem('userId', id);
        } else {
            const storedId = localStorage.getItem('userId');
            if (storedId && storedId !== 'null') {
                setUserId(storedId);
            }
        }
    }, [searchParams]);

    const navItems = [
        { icon: Home, label: "Dashboard", href: `/dashboard/for-donor?userId=${userId}`, matchExact: true },
        { icon: Droplet, label: "Donation History", href: `/dashboard/for-donor/donation-history?userId=${userId}`, matchExact: false },
        { icon: Calendar, label: "Appointments", href: `/dashboard/for-donor/appointments?userId=${userId}`, matchExact: false },
        { icon: MapPin, label: "Find Centers", href: `/dashboard/for-donor/find-centers?userId=${userId}`, matchExact: false },
        { icon: FileText, label: "Analysis Results", href: `/dashboard/for-donor/analysis?userId=${userId}`, matchExact: false },
        { icon: MessageSquare, label: "AI Assistant", href: `/dashboard/for-donor/ai-chat?userId=${userId}`, matchExact: false },
        { icon: User, label: "Top Donors", href: `/dashboard/for-donor/top-donors?userId=${userId}`, matchExact: false },
    ];

    const isActive = (item: typeof navItems[0]) => {
        if (item.matchExact) {
            return pathname === item.href.split('?')[0];
        }
        return pathname?.startsWith(item.href.split('?')[0]);
    };

    if (!mounted) {
        return (
            <aside className="fixed top-0 left-0 z-30 flex flex-col w-16 lg:w-64 h-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-300">
                <div className="p-4">
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Heart className="w-6 h-6 text-white" fill="currentColor" />
                        </div>
                        <span className="hidden lg:block text-xl font-bold text-white">BloodConnect</span>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="fixed top-0 left-0 z-30 flex flex-col w-16 lg:w-64 h-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-300">
            {/* Logo */}
            <div className="flex-shrink-0 p-4">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Heart className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                    <span className="hidden lg:block text-xl font-bold text-white">BloodConnect</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);

                        return (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all group",
                                        active
                                            ? "bg-white/20 text-white font-medium backdrop-blur-sm"
                                            : "hover:bg-white/20 text-white/80 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-5 h-5 transition-transform group-hover:scale-110",
                                        active && "scale-110"
                                    )} />
                                    <span className="hidden lg:block">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="flex-shrink-0 p-4 border-t border-white/20">
                <button
                    onClick={() => {
                        localStorage.removeItem('user');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('token');
                        window.location.href = '/auth/login';
                    }}
                    className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl hover:bg-white/20 transition-all w-full text-white/80 hover:text-white group"
                >
                    <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="hidden lg:block">Logout</span>
                </button>
            </div>
        </aside>
    );
}