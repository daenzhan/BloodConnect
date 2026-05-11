"use client";

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home,
    FileText,
    ClipboardList,
    User,
    MapPin,
    Heart,
    LogOut
} from "lucide-react"
import { useState, useEffect } from "react"

const navigation = [
    { name: "Dashboard", href: "/dashboard/for-medcenter", icon: Home },
    { name: "Create Request", href: "/dashboard/for-medcenter/create-request", icon: FileText },
    { name: "My Requests", href: "/dashboard/for-medcenter/my-requests", icon: ClipboardList },
    { name: "Blood Centers", href: "/dashboard/for-medcenter/blood-centers", icon: MapPin },
    { name: "Profile", href: "/dashboard/for-medcenter/profile", icon: User },
]

export function Sidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [userId, setUserId] = useState<string>("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const id = searchParams.get('userId') || searchParams.get('id')
        if (id && id !== 'null') {
            setUserId(id)
            localStorage.setItem('userId', id)
        } else {
            const storedId = localStorage.getItem('userId')
            if (storedId && storedId !== 'null') {
                setUserId(storedId)
            }
        }
    }, [searchParams])

    const getHrefWithId = (href: string) => {
        if (userId) {
            return `${href}?userId=${userId}`
        }
        return href
    }

    const isActiveLink = (href: string) => {
        if (href === "/dashboard/for-medcenter") {
            return pathname === href
        }
        return pathname === href
    }

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
        )
    }

    return (
        <aside className="fixed top-0 left-0 z-30 flex flex-col w-16 lg:w-64 h-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-300">
            {/* Logo */}
            <div className="flex-shrink-0 p-4">
                <Link href={getHrefWithId("/dashboard/for-medcenter")} className="flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Heart className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                    <span className="hidden lg:block text-xl font-bold text-white">BloodConnect</span>
                </Link>
            </div>

            {/* Navigation - скроллится если много пунктов */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
                <ul className="space-y-2">
                    {navigation.map((item) => {
                        const isActive = isActiveLink(item.href)
                        const Icon = item.icon
                        const hrefWithId = getHrefWithId(item.href)

                        return (
                            <li key={item.name}>
                                <Link
                                    href={hrefWithId}
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
                        )
                    })}
                </ul>
            </nav>

            {/* Logout Button */}
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
    )
}