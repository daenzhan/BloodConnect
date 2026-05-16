"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, ChevronDown, User, LogOut, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ProfileCardProps {
    userId?: string | null;
    onLogout?: () => void;
    showBookButton?: boolean;
}

// Функция для определения уровня донора
const getDonorLevel = (donationCount: number): string => {
    if (!donationCount || donationCount === 0) return 'Newcomer';
    if (donationCount >= 50) return 'Platinum';
    if (donationCount >= 25) return 'Gold';
    if (donationCount >= 15) return 'Silver';
    if (donationCount >= 5) return 'Bronze';
    return 'Newcomer';
};

export function ProfileCard({ userId: propUserId, onLogout, showBookButton = false }: ProfileCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string>("");
    const [donorData, setDonorData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    useEffect(() => {
        let id = propUserId;
        if (!id || id === 'null') {
            id = searchParams.get('userId') || searchParams.get('id');
        }
        if (!id || id === 'null') {
            id = localStorage.getItem('userId');
        }
        if (id && id !== 'null') {
            setUserId(id);
            localStorage.setItem('userId', id);
        }
    }, [propUserId, searchParams]);

    useEffect(() => {
        const fetchDonorData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    setIsLoading(false);
                    return;
                }

                const res = await fetch(`http://localhost:8080/donor/dashboard/${userId}`, {
                    headers: headers
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("Donor data received:", data); // Для отладки
                    setDonorData(data);
                }
            } catch (error) {
                console.error("Error fetching donor data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDonorData();
    }, [userId]);

    // Используем поле bloodType из ответа (уже отформатированное)
    const bloodTypeDisplay = donorData?.bloodType || "Unknown";
    const calculatedDonorLevel = getDonorLevel(donorData?.donationCount || 0);

    const initials = donorData?.fullName
        ? donorData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : "??";

    const getAvatarColor = () => 'bg-gradient-to-br from-primary to-primary/80';

    const handleNavigation = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    const handleLogout = () => {
        setIsOpen(false);
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
            router.push('/auth/login');
        }
    };

    const handleBookDonation = () => {
        router.push(`/dashboard/for-donor/book-donation?userId=${userId}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="hidden sm:block">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            {showBookButton && (
                <Button
                    className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground gap-2 rounded-xl px-5 border-0 shadow-md hover:opacity-90 transition-opacity"
                    onClick={handleBookDonation}
                >
                    <CalendarPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Book Donation</span>
                </Button>
            )}

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center shadow-md`}>
                        <span className="text-sm font-semibold text-white">{initials}</span>
                    </div>

                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900">{donorData?.fullName || "Donor"}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600">{bloodTypeDisplay}</span>
                            <span className="text-gray-400">•</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white bg-gradient-to-br from-primary to-primary/80">
                                {calculatedDonorLevel}
                            </span>
                        </div>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <Card className="absolute right-0 top-full mt-2 w-72 p-3 rounded-xl shadow-lg border border-gray-200 bg-white z-50 animate-in fade-in zoom-in duration-200">
                        {/* Header Section */}
                        <div className="px-3 py-2 border-b border-gray-200">
                            <p className="font-semibold text-gray-900">{donorData?.fullName || "Donor"}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-600">{bloodTypeDisplay} Blood Type</span>
                                {donorData?.city && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs text-gray-600 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {donorData.city}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Badges Section */}
                        <div className="px-3 py-2 border-b border-gray-100">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs px-3 py-1.5 rounded-full font-medium text-white bg-gradient-to-br from-primary to-primary/80">
                                    {calculatedDonorLevel}
                                </span>
                                <span className={`text-xs px-3 py-1.5 rounded-full font-medium text-white ${
                                    donorData?.donorStatus === 'ACTIVE' ? 'bg-green-600' : 'bg-yellow-600'
                                }`}>
                                    {donorData?.donorStatus || 'ACTIVE'}
                                </span>
                            </div>
                        </div>

                        {/* Points Section (если есть) */}
                        {donorData?.points > 0 && (
                            <div className="px-3 py-2 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Points:</span>
                                    <span className="text-sm font-semibold text-primary">{donorData.points}</span>
                                </div>
                            </div>
                        )}

                        {/* Navigation Section */}
                        <div className="space-y-0 mt-0">
                            <button
                                onClick={() => handleNavigation(`/dashboard/for-donor?userId=${userId}`)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                            >
                                <User className="w-4 h-4 text-gray-500" />
                                Dashboard
                            </button>

                            <button
                                onClick={() => handleNavigation(`/dashboard/for-donor/appointments?userId=${userId}`)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                            >
                                <CalendarPlus className="w-4 h-4 text-gray-500" />
                                My Appointments
                            </button>

                            <hr className="my-2 border-gray-200" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 transition-colors text-red-600"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}