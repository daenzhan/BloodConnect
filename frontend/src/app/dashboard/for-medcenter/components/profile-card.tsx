"use client";

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ChevronDown, User, LogOut, Settings } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

interface ProfileCardProps {
    name: string
    location: string
    userId: string
}

export function ProfileCard({ name, location, userId }: ProfileCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : "MC"

    const handleLogout = () => {
        localStorage.removeItem('user')
        localStorage.removeItem('userId')
        localStorage.removeItem('token')
        router.push('/auth/login')
    }

    const isDashboard = pathname === '/dashboard/for-medcenter'

    return (
        <div className="flex items-center gap-4">
            {isDashboard && (
                <Link href={`/dashboard/for-medcenter/create-request?userId=${userId}`}>
                    <Button className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground gap-2 rounded-xl px-5 border-0 shadow-md hover:opacity-90 transition-opacity">
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Create Request</span>
                    </Button>
                </Link>
            )}

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    aria-expanded={isOpen}
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                        <span className="text-sm font-semibold text-white">{initials}</span>
                    </div>

                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-600">{location}</p>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <Card className="absolute right-0 top-full mt-2 w-48 p-2 rounded-xl shadow-lg border border-gray-200 bg-white z-50 animate-in fade-in zoom-in duration-200">
                        <div className="space-y-1">
                            <Link
                                href={`/dashboard/for-medcenter/profile?userId=${userId}`}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <User className="w-4 h-4" />
                                View profile
                            </Link>

                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push(`/dashboard/for-medcenter/settings?userId=${userId}`)
                                }}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>

                            <hr className="my-1 border-gray-200" />

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-red-600"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}