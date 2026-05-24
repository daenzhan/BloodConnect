"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { WelcomeCard } from "./welcome-card";
import { DonationCountdown } from "./donation-countdown";
import { DonationCalendar } from "./donation-calendar";
import { DonationStats } from "./donation-stats";
import { ProfileCard } from "./profile-card";
import { AiChatBot } from "./AiChatBot";
import { DonorContextProvider, useDonorContext } from "./DonorContextProvider";
import { useRouter, useSearchParams } from "next/navigation";

// Внутренний компонент, который использует контекст
function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');
    const [currentDate] = useState(new Date());
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const { donorData } = useDonorContext();

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
        const token = localStorage.getItem('token');
        if (!token) {
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
                } catch (e) {
                    console.error("Error parsing user from localStorage", e);
                }
            }
        }
        if (!finalUserId || finalUserId === 'null') {
            finalUserId = '2';
        }
        setUserId(finalUserId);
        localStorage.setItem('userId', finalUserId);
    }, [userIdFromUrl, router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!userId) return;
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    router.push('/auth/login');
                    return;
                }

                const dashboardResponse = await fetch(`http://localhost:8080/donor/dashboard/${userId}`, {
                    method: 'GET',
                    headers: headers
                });

                if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('userId');
                    router.push('/auth/login');
                    return;
                }

                if (!dashboardResponse.ok) {
                    throw new Error(`HTTP error! status: ${dashboardResponse.status}`);
                }

                const data = await dashboardResponse.json();
                setDashboardData(data);

                try {
                    const appointmentsResponse = await fetch(`http://localhost:8080/appointments/donor/${userId}`, {
                        method: 'GET',
                        headers: headers
                    });
                    if (appointmentsResponse.ok) {
                        const appointmentsData = await appointmentsResponse.json();
                        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
                    } else {
                        setAppointments([]);
                    }
                } catch (aptError) {
                    console.error("Error fetching appointments:", aptError);
                    setAppointments([]);
                }
                setError(null);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setError("Failed to load data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchDashboardData();
        }
    }, [userId, router]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
            weekday: "long",
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        router.push('/auth/login');
    };

    if (!userId) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6">
                    <div className="text-center p-8">
                        <p className="text-red-600">Access Denied: User ID not found</p>
                        <button
                            onClick={() => router.push('/auth/login')}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            Go to Login
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6">
                    <div className="p-8 text-destructive text-center">
                        <p className="text-xl mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6">
                    <div className="p-8 text-destructive text-center">No data found</div>
                </main>
            </div>
        );
    }

    return (
        <>
            <Sidebar />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8 min-h-screen overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Hello, {dashboardData.fullName}!
                        </h1>
                        <p className="text-muted-foreground">{formatDate(currentDate)}</p>
                    </div>
                    <ProfileCard userId={userId} onLogout={handleLogout} showBookButton={true} />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <WelcomeCard
                        donorName={dashboardData.fullName}
                        donorLevel={dashboardData.donorLevel}
                        points={dashboardData.points}
                    />
                    <DonationCountdown
                        lastDonationDate={dashboardData.lastDonationDate ? new Date(dashboardData.lastDonationDate) : null}
                        daysUntilNext={dashboardData.daysUntilNextDonation}
                        nextEligibleDate={new Date(dashboardData.nextEligibleDate)}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <DonationCalendar appointments={appointments} />
                    <DonationStats
                        total_donations={dashboardData.totalDonations}
                        lives_saved={dashboardData.livesSaved}
                        blood_type={dashboardData.bloodType}
                        donor_level={dashboardData.donorLevel}
                    />
                </div>
            </main>

            <AiChatBot userId={userId} donorContext={donorData} />
        </>
    );
}

// Основной компонент с провайдером
export default function DonorDashboard() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId') || searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

    return (
        <DonorContextProvider userId={userId}>
            <DashboardContent />
        </DonorContextProvider>
    );
}