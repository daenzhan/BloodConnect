"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home,
    FileText,
    ClipboardList,
    User,
    MapPin,
    Heart
} from "lucide-react"

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
    const medCenterId = searchParams.get('id')

    // Функция для добавления ID к ссылке
    const getHrefWithId = (href: string) => {
        if (medCenterId) {
            return `${href}?id=${medCenterId}`
        }
        return href
    }

    // Проверка активного пункта меню (учитывая query параметры)
    const isActiveLink = (href: string) => {
        if (href === "/dashboard/for-medcenter") {
            return pathname === href
        }
        // Для других страниц проверяем pathname без query параметров
        return pathname === href
    }

    return (
        <aside className="w-64 bg-card border-r border-border flex flex-col min-h-screen">
            <div className="p-6">
                <Link href={getHrefWithId("/dashboard/for-medcenter")} className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold text-foreground">BloodConnect</span>
                </Link>
            </div>

            <nav className="flex-1 px-4">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = isActiveLink(item.href)
                        const Icon = item.icon
                        const hrefWithId = getHrefWithId(item.href)

                        return (
                            <li key={item.name}>
                                <Link
                                    href={hrefWithId}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Опционально: показать текущий ID для отладки */}
            {medCenterId && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                    Center ID: {medCenterId}
                </div>
            )}
        </aside>
    )
}