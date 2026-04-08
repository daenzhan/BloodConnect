"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Home, Heart, Calendar, User, MapPin, FileText, LogOut, MessageSquare, Droplet } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

export function Sidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [userId, setUserId] = useState<string>("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Получаем userId из URL или localStorage
        const id = searchParams.get('userId') || searchParams.get('id')
        if (id) {
            setUserId(id)
            localStorage.setItem('userId', id)
        } else {
            const storedId = localStorage.getItem('userId')
            if (storedId) {
                setUserId(storedId)
            } else {
                setUserId("2")
            }
        }
    }, [searchParams])

    const navItems = [
        {
            icon: Home,
            label: "Dashboard",
            href: `/dashboard/for-donor?userId=${userId}`,
            matchExact: true
        },
        {
            icon: Droplet,
            label: "Donation History",
            href: `/dashboard/for-donor/donation-history?userId=${userId}`,
            matchExact: false
        },
        {
            icon: Calendar,
            label: "Appointments",
            href: `/dashboard/for-donor/appointments?userId=${userId}`,
            matchExact: false
        },
        {
            icon: MapPin,
            label: "Find Centers",
            href: "http://localhost:8080/map",
            external: true,
            matchExact: false
        },
        {
            icon: FileText,
            label: "Analysis Results",
            href: `/dashboard/for-donor/analysis?userId=${userId}`,
            matchExact: false
        },
        {
            icon: MessageSquare,
            label: "AI Assistant",
            href: `/dashboard/for-donor/ai-chat?userId=${userId}`,
            matchExact: false
        },
        {
            icon: User,
            label: "Top Donors",
            href: `/dashboard/for-donor/top-donors?userId=${userId}`,
            matchExact: false
        },
    ]

    // Определяем активный пункт меню
    const isActive = (item: typeof navItems[0]) => {
        if (item.external) return false
        if (item.matchExact) {
            return pathname === item.href.split('?')[0]
        }
        return pathname?.startsWith(item.href.split('?')[0])
    }

    // Пока не смонтирован компонент, показываем заглушку (избегаем гидратации)
    if (!mounted) {
        return (
            <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground min-h-screen shadow-lg">
                <div className="p-4 lg:p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Heart className="w-6 h-6 text-white" fill="currentColor" />
                        </div>
                        <span className="hidden lg:block text-xl font-bold text-white">BloodConnect</span>
                    </div>
                </div>
            </aside>
        )
    }

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground min-h-screen shadow-lg sticky top-0 h-screen">
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
            <nav className="flex-1 px-2 lg:px-4 py-6 overflow-y-auto">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item)

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
                                            "justify-center lg:justify-start group"
                                        )}
                                    >
                                        <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
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
                                        "justify-center lg:justify-start group",
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
                        )
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 lg:p-6 border-t border-white/20">
                <button
                    onClick={() => {
                        localStorage.removeItem('user')
                        localStorage.removeItem('userId')
                        localStorage.removeItem('token')
                        window.location.href = '/login'
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/20 transition-all w-full justify-center lg:justify-start text-white/80 hover:text-white group"
                >
                    <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="hidden lg:block">Logout</span>
                </button>
            </div>
        </aside>
    )
}