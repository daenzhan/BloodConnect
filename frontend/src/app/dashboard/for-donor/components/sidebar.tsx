"use client"

import Link from "next/link"
import { Home, Heart, Calendar, User, MapPin, FileText, LogOut, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard/for-donor", active: true },
    { icon: Heart, label: "My Donations", href: "#" },
    { icon: Calendar, label: "Appointments", href: "#" },
    { icon: MapPin, label: "Find Centers", href: "http://localhost:8080/map", external: true },
    { icon: FileText, label: "Analysis Results", href: "#" },
    { icon: MessageSquare, label: "AI Assistant", href: "/dashboard/for-donor/ai-chat" },
    { icon: User, label: "Top Donors", href: "/dashboard/for-donor/top-donors" },
]

export function Sidebar() {
    const [activeItem, setActiveItem] = useState("Dashboard")

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground min-h-screen shadow-lg">
            {/* Logo */}
            <div className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Heart className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                    <span className="hidden lg:block text-xl font-bold text-white">BloodConnect</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 lg:px-4 py-6">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeItem === item.label

                        if (item.external) {
                            return (
                                <li key={item.label}>
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                                            "hover:bg-white/20 text-white/80 hover:text-white",
                                            "justify-center lg:justify-start"
                                        )}
                                        onClick={() => setActiveItem(item.label)}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="hidden lg:block">{item.label}</span>
                                    </a>
                                </li>
                            )
                        }

                        return (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                                        "justify-center lg:justify-start",
                                        isActive
                                            ? "bg-white/20 text-white font-medium backdrop-blur-sm"
                                            : "hover:bg-white/20 text-white/80 hover:text-white"
                                    )}
                                    onClick={() => setActiveItem(item.label)}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="hidden lg:block">{item.label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 lg:p-6 border-t border-white/20">
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/20 transition-all w-full justify-center lg:justify-start text-white/80 hover:text-white">
                    <LogOut className="w-5 h-5" />
                    <span className="hidden lg:block">Logout</span>
                </button>
            </div>
        </aside>
    )
}