"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Building2, LogOut, MapPin, CalendarPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CenterProfileProps {
    userId: string | null;
}

export function CenterProfileCard({ userId }: CenterProfileProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [centerData, setCenterData] = useState<{ name: string; city: string; location?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    useEffect(() => {
        const fetchCenterData = async () => {
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

                // Сначала получаем bloodCenterId по userId
                const centerRes = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                    headers: headers
                });

                if (centerRes.ok) {
                    const centerInfo = await centerRes.json();
                    setCenterData({
                        name: centerInfo.name || "Blood Center",
                        city: centerInfo.city || "City",
                        location: centerInfo.location
                    });
                }
            } catch (error) {
                console.error("Error fetching center data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCenterData();
    }, [userId]);

    const initials = centerData?.name
        ? centerData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : "BC";

    const getAvatarColor = () => 'bg-gradient-to-br from-primary to-primary/80';

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        router.push('/auth/login');
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
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center shadow-md`}>
                        <span className="text-sm font-semibold text-white">{initials}</span>
                    </div>

                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900">{centerData?.name || "Blood Center"}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600">{centerData?.city || "City"}</span>
                        </div>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <Card className="absolute right-0 top-full mt-2 w-64 p-2 rounded-xl shadow-lg border border-gray-200 bg-white z-50 animate-in fade-in zoom-in duration-200">
                        <div className="px-3 py-2 border-b border-gray-200 mb-1">
                            <p className="font-medium text-gray-900">{centerData?.name || "Blood Center"}</p>
                            <p className="text-xs text-gray-600">Blood Center</p>
                            {(centerData?.location || centerData?.city) && (
                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {centerData?.location || centerData?.city}
                                </p>
                            )}
                        </div>

                        <div className="px-3 py-1 mb-1">
                            <span className="text-xs px-2 py-1 rounded-full border-0 text-white bg-gradient-to-br from-primary to-primary/80">
                                Blood Center
                            </span>
                        </div>

                        <div className="space-y-1">
                            <button
                                onClick={() => router.push(`/dashboard/for-bloodcenter?userId=${userId}`)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                            >
                                <Building2 className="w-4 h-4" />
                                Dashboard
                            </button>

                            <button
                                onClick={() => router.push(`/dashboard/for-bloodcenter/reserve?userId=${userId}`)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                            >
                                <Building2 className="w-4 h-4" />
                                Blood Reserve
                            </button>

                            <button
                                onClick={() => router.push(`/dashboard/for-bloodcenter/requests?userId=${userId}`)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                            >
                                <Building2 className="w-4 h-4" />
                                Blood Requests
                            </button>

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
    );
}