"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileCheck, Settings, LogOut, Shield, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "License Verification", href: "/admin/licenses", icon: FileCheck },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'ADMIN') {
                    router.push('/auth/login');
                } else {
                    setIsAdmin(true);
                }
            } catch (e) {
                router.push('/auth/login');
            }
        } else {
            router.push('/auth/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        window.location.href = '/auth/login';
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <aside className="fixed top-0 left-0 z-30 flex flex-col w-16 lg:w-64 h-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-300">
            {/* Logo */}
            <div className="flex-shrink-0 p-4">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="hidden lg:block text-xl font-bold text-white">Admin Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
                <ul className="space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all group",
                                        isActive
                                            ? "bg-white/20 text-white font-medium backdrop-blur-sm"
                                            : "hover:bg-white/20 text-white/80 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-5 h-5 transition-transform group-hover:scale-110",
                                        isActive && "scale-110"
                                    )} />
                                    <span className="hidden lg:block">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="flex-shrink-0 p-4 border-t border-white/20">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl hover:bg-white/20 transition-all w-full text-white/80 hover:text-white group"
                >
                    <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="hidden lg:block">Logout</span>
                </button>
            </div>
        </aside>
    );
}