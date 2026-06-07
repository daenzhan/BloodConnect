"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {useState, useEffect, useCallback} from "react";
import { BloodCenterSidebar } from "./components/sidebar";
import { CenterProfileCard } from "./components/center-profile-card";
import { WelcomeCard } from "./components/welcome-card";
import { QuickActions } from "./components/quick-actions";
import { RecentDonations } from "./components/recent-donations";

interface Donation {
    donationId: number;
    donorName: string;
    donationDate: string;
    status: string;
    bloodType?: string;
}

export default function BloodCenterDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');

    const [bloodCenterId, setBloodCenterId] = useState<number | null>(null);
    const [centerData, setCenterData] = useState<any>(null);
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [todayDonations, setTodayDonations] = useState<number>(0);
    const [pendingRequests, setPendingRequests] = useState<number>(0);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No token found");
            return null;
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            console.log("=== BloodCenterDashboard Debug ===");
            console.log("userId from URL:", userIdFromUrl);
            console.log("Token exists:", !!token);

            if (!token) {
                console.log("No token, redirecting to login...");
                router.push('/auth/login');
                return;
            }

            let finalUserId = userIdFromUrl;
            if (!finalUserId || finalUserId === 'null') {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        finalUserId = user.userId?.toString() || user.id?.toString();
                        console.log("Retrieved userId from localStorage:", finalUserId);
                    } catch (e) {
                        console.error("Error parsing user from localStorage", e);
                    }
                }
            }

            if (!finalUserId || finalUserId === 'null') {
                console.error("No valid userId found");
                setIsLoading(false);
                setIsAuthChecking(false);
                return;
            }

            setUserId(finalUserId);
            setIsAuthChecking(false);
        };

        checkAuth();
    }, [userIdFromUrl, router]);

    useEffect(() => {
        const fetchBloodCenterByUserId = async () => {
            if (isAuthChecking) return;
            if (!userId) {
                setIsLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/auth/login');
                return;
            }

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    router.push('/auth/login');
                    return;
                }

                console.log(`Fetching blood center for userId: ${userId}`);
                const res = await fetch(`http://localhost:8080/blood-centers/by-user/${userId}`, {
                    method: 'GET',
                    headers: headers
                });

                console.log(`Response status: ${res.status}`);

                if (res.status === 401 || res.status === 403) {
                    console.log("Unauthorized, clearing token...");
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/auth/login');
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    console.log("Blood center data received:", data);
                    setBloodCenterId(data.bloodCenterId);
                    setCenterData(data);
                } else {
                    console.error(`Failed to fetch blood center: ${res.status}`);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error fetching blood center:", error);
                setIsLoading(false);
            }
        };

        fetchBloodCenterByUserId();
    }, [userId, isAuthChecking, router]);

    useEffect(() => {
        const fetchCenterData = async () => {
            if (!bloodCenterId) return;

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    router.push('/auth/login');
                    return;
                }

                console.log(`Fetching donations for bloodCenterId: ${bloodCenterId}`);
                const donationsRes = await fetch(`http://localhost:8080/donations/bloodcenter/${bloodCenterId}`, {
                    method: 'GET',
                    headers: headers
                });

                if (donationsRes.status === 401 || donationsRes.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/auth/login');
                    return;
                }

                if (donationsRes.ok) {
                    const allDonations = await donationsRes.json();
                    setRecentDonations(allDonations.slice(0, 5));
                }
            } catch (error) {
                console.error("Error fetching center data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCenterData();
    }, [bloodCenterId, router]);

    const fetchTodayStats = useCallback(async () => {
        if (!bloodCenterId) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) return;
            const today = new Date().toISOString().split('T')[0];
            const donationsRes = await fetch(
                `http://localhost:8080/donations/bloodcenter/${bloodCenterId}/date?date=${today}`,
                { headers: headers }
            );
            if (donationsRes.ok) {
                const donations = await donationsRes.json();
                setTodayDonations(donations.length || 0);
            }
            const requestsRes = await fetch(
                `http://localhost:8080/blood-requests/bloodcenter/${bloodCenterId}/pending/count`,
                { headers: headers }
            );
            if (requestsRes.ok) {
                const count = await requestsRes.json();
                setPendingRequests(count);
            }
        } catch (error) {
            console.error("Error fetching today stats:", error);
            setTodayDonations(5);
            setPendingRequests(3);
        }
    }, [bloodCenterId]);

    useEffect(() => {
        if (bloodCenterId) {
            fetchTodayStats();
        }
    }, [bloodCenterId, fetchTodayStats]);

    if (isAuthChecking || isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <main className="ml-20 lg:ml-64 p-6 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!userId || !bloodCenterId) {
        return (
            <div className="min-h-screen bg-background">
                <main className="ml-20 lg:ml-64 p-6 text-center min-h-screen">
                    <p className="text-destructive mb-4">Access Denied. Please login again.</p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            router.push('/auth/login');
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        Go to Login
                    </button>
                </main>
            </div>
        );
    }

    return (
        <>
            <BloodCenterSidebar userId={userId} />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back to your blood center dashboard</p>
                    </div>
                    <CenterProfileCard userId={userId} />
                </header>
                <div className="space-y-6">
                    <WelcomeCard
                        centerName={centerData?.name}
                        location={centerData?.city}
                        todayDonations={todayDonations}
                        pendingRequests={pendingRequests}
                    />
                    <QuickActions />
                    <RecentDonations donations={recentDonations} />
                </div>
            </main>
        </>
    );
}