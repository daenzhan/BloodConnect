"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Droplet, FileText, BarChart3, LogOut, ClipboardList, Heart, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface BloodCenterSidebarProps {
    userId: string | null;
}

export function BloodCenterSidebar({ userId }: BloodCenterSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Dashboard", href: `/dashboard/for-bloodcenter?userId=${userId}` },
        { icon: Calendar, label: "Appointments", href: `/dashboard/for-bloodcenter/appointments?userId=${userId}` },
        { icon: ClipboardList, label: "Blood Requests", href: `/dashboard/for-bloodcenter/requests?userId=${userId}` },
        { icon: Droplet, label: "Blood Reserve", href: `/dashboard/for-bloodcenter/reserve?userId=${userId}` },
        { icon: FileText, label: "Donations", href: `/dashboard/for-bloodcenter/donations?userId=${userId}` },
        { icon: BarChart3, label: "Statistics", href: `/dashboard/for-bloodcenter/statistics?userId=${userId}` },
    ];

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-sidebar text-sidebar-foreground min-h-screen">
            <div className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Heart className="w-6 h-6 text-white" fill="currentColor" /></div>
                    <span className="hidden lg:block text-xl font-bold text-white">BloodConnect</span>
                </div>
            </div>
            <nav className="flex-1 px-2 lg:px-4 py-6">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href.split('?')[0];
                        return (
                            <li key={item.label}>
                                <Link href={item.href} className={cn("flex items-center gap-3 px-3 py-3 rounded-xl transition-all justify-center lg:justify-start", isActive ? "bg-white text-primary font-medium" : "hover:bg-sidebar-accent text-sidebar-foreground/80")}>
                                    <Icon className="w-5 h-5" />
                                    <span className="hidden lg:block">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="p-4 lg:p-6">
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sidebar-accent transition-all w-full justify-center lg:justify-start text-sidebar-foreground/80">
                    <LogOut className="w-5 h-5" />
                    <span className="hidden lg:block">Logout</span>
                </button>
            </div>
        </aside>
    );
}