"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarPlus, ChevronDown, User, Settings, LogOut, Award, MapPin } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

// Extended interface for incoming data
interface ProfileProps {
    name: string;
    blood_type: string;
    location?: string;
    donor_level?: string;
    donor_status?: string;
    points?: number;
    onLogout?: () => void;
}

export function ProfileCard({
                                name,
                                blood_type,
                                location,
                                donor_level,
                                donor_status,
                                points = 0,
                                onLogout
                            }: ProfileProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    // Logic to get initials: "Aruzhan Nuriddinova" -> "AN"
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : "??";

    // Donor status color mapping
    const getStatusColor = (status?: string) => {
        switch(status?.toLowerCase()) {
            case 'active': return 'text-white bg-green-600';
            case 'inactive': return 'text-white bg-yellow-600';
            case 'blocked': return 'text-white bg-red-600';
            default: return 'text-white bg-gradient-to-br from-primary to-primary/80';
        }
    };

    // Donor level color mapping - USING PRIMARY GRADIENT
    const getLevelColor = (level?: string) => {
        // All levels use the same primary gradient
        return 'bg-gradient-to-br from-primary to-primary/80 text-white';
    };

    // Avatar background color - USING PRIMARY GRADIENT
    const getAvatarColor = () => {
        return 'bg-gradient-to-br from-primary to-primary/80';
    };

    // Format level name for display
    const formatLevel = (level?: string) => {
        if (!level) return '';
        switch(level.toLowerCase()) {
            case 'platinum': return 'Platinum Donor';
            case 'gold': return 'Gold Donor';
            case 'silver': return 'Silver Donor';
            case 'bronze': return 'Bronze Donor';
            case 'newcomer': return 'Newcomer';
            default: return level;
        }
    };

    const handleNavigation = (path: string) => {
        setIsOpen(false)
        router.push(path)
    }

    const handleLogout = () => {
        setIsOpen(false)
        if (onLogout) {
            onLogout()
        } else {
            localStorage.removeItem('user')
            localStorage.removeItem('userId')
            localStorage.removeItem('token')
            router.push('/login')
        }
    }

    return (
        <div className="flex items-center gap-4">
            {/* Book Donation Button - USING PRIMARY GRADIENT */}
            <Button
                className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground gap-2 rounded-xl px-5 border-0 shadow-md hover:opacity-90 transition-opacity"
                onClick={() => router.push('/book-donation')}
            >
                <CalendarPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Book Donation</span>
            </Button>

            {/* Profile Block */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    {/* Avatar with initials - USING PRIMARY GRADIENT */}
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center shadow-md`}>
                        <span className="text-sm font-semibold text-white">{initials}</span>
                    </div>

                    {/* User info (hidden on mobile) */}
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600">{blood_type}</span>
                            {donor_level && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white ${getLevelColor(donor_level)}`}>
                                        {formatLevel(donor_level)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <Card className="absolute right-0 top-full mt-2 w-64 p-2 rounded-xl shadow-lg border border-gray-200 bg-white z-50 animate-in fade-in zoom-in duration-200">
                        {/* Profile header in menu */}
                        <div className="px-3 py-2 border-b border-gray-200 mb-1">
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-600">{blood_type} Blood Type</p>
                            {location && (
                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {location}
                                </p>
                            )}
                        </div>

                        {/* Donor level badge - USING PRIMARY GRADIENT */}
                        {donor_level && (
                            <div className="px-3 py-1 mb-1">
                                <span className={`text-xs px-2 py-1 rounded-full border-0 text-white ${getLevelColor(donor_level)}`}>
                                    {formatLevel(donor_level)}
                                </span>
                            </div>
                        )}

                        {/* Statistics (if available) */}
                        {points > 0 && (
                            <div className="px-3 py-2 mb-1 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mx-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Points:</span>
                                    <span className="font-medium text-primary">{points}</span>
                                </div>
                            </div>
                        )}

                        {/* Donor status */}
                        {donor_status && (
                            <div className="px-3 py-1 mb-1">
                                <span className={`text-xs px-2 py-1 rounded-full border-0 text-white ${getStatusColor(donor_status).split(' ')[1]}`}>
                                    Status: {donor_status}
                                </span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <button
                                onClick={() => handleNavigation('/profile')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                            >
                                <User className="w-4 h-4" />
                                My Profile
                            </button>

                            <button
                                onClick={() => handleNavigation('/settings')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>

                            {donor_level && (
                                <button
                                    onClick={() => handleNavigation('/achievements')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                                >
                                    <Award className="w-4 h-4" />
                                    Achievements
                                </button>
                            )}

                            <hr className="my-1 border-gray-200" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-red-600"
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