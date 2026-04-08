"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { WelcomeCard } from "./welcome-card"
import { DonationCountdown } from "./donation-countdown"
import { DonationCalendar } from "./donation-calendar"
import { DonationStats } from "./donation-stats"
import { ProfileCard } from "./profile-card"
import { useRouter } from "next/navigation"

interface DashboardData {
    userId: number;
    fullName: string;
    bloodType: string;
    rhesusFactor: string;
    birthDate: string;
    iin: string;
    address: string;
    city: string;
    gender: string;
    weight: number;
    height: number;
    totalDonations: number;
    livesSaved: number;
    donorLevel: string;
    rating: number;
    points: number;
    donorStatus: string;
    lastDonationDate: string | null;
    daysUntilNextDonation: number;
    nextEligibleDate: string;
}

export default function DonorDashboard() {
    const [currentDate] = useState(new Date())
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [appointments, setAppointments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Get userId from URL first
                const urlParams = new URLSearchParams(window.location.search);
                let userId = urlParams.get('userId');

                console.log("UserId from URL:", userId);

                // If not in URL, get from localStorage
                if (!userId) {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            userId = user.id || user.userId;
                        } catch (e) {
                            console.error("Error parsing user from localStorage", e);
                        }
                    }
                }

                // If still no userId, use default for testing
                if (!userId) {
                    userId = '2';
                }

                console.log("Final userId:", userId);

                // 1. Запрос для дашборда
                const response = await fetch(`http://localhost:8080/donor/dashboard/${userId}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Dashboard data received:", data);
                setDashboardData(data);

                // 2. Запрос для appointments - ТОТ ЖЕ САМЫЙ, ЧТО В APPOINTMENTS PAGE
                // Используем /appointments/donor/{userId} как в AppointmentsPage
                try {
                    const appointmentsResponse = await fetch(`http://localhost:8080/appointments/donor/${userId}`);
                    if (appointmentsResponse.ok) {
                        const appointmentsData = await appointmentsResponse.json();
                        console.log("Appointments data received:", appointmentsData);
                        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
                    } else {
                        console.log("Appointments endpoint returned:", appointmentsResponse.status);
                        setAppointments([]);
                    }
                } catch (aptError) {
                    console.error("Error fetching appointments:", aptError);
                    setAppointments([]);
                }

                // Save userId to localStorage from backend response
                if (data.userId) {
                    localStorage.setItem('userId', data.userId.toString());

                    // Also update user object in localStorage
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            user.id = data.userId;
                            localStorage.setItem('user', JSON.stringify(user));
                        } catch (e) {
                            console.error("Error updating user in localStorage", e);
                        }
                    }
                }

                setError(null);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setError("Failed to load data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-foreground">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-destructive text-center">
                <p className="text-xl mb-4"> {error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!dashboardData) {
        return <div className="p-8 text-destructive text-center">No data found</div>;
    }

    console.log("Rendering calendar with appointments:", appointments);

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Hello, {dashboardData.fullName}!
                        </h1>
                        <p className="text-muted-foreground">{formatDate(currentDate)}</p>
                    </div>
                    <ProfileCard
                        name={dashboardData.fullName}
                        blood_type={dashboardData.bloodType}
                        location={`${dashboardData.city}, ${dashboardData.address?.substring(0, 30) || ''}...`}
                        donor_level={dashboardData.donorLevel}
                        donor_status={dashboardData.donorStatus}
                        points={dashboardData.points}
                        onLogout={handleLogout}
                    />
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
                    <DonationCalendar
                        appointments={appointments}
                    />
                    <DonationStats
                        total_donations={dashboardData.totalDonations}
                        lives_saved={dashboardData.livesSaved}
                        blood_type={dashboardData.bloodType}
                        donor_level={dashboardData.donorLevel}
                        rating={dashboardData.rating}
                        points={dashboardData.points}
                    />
                </div>
            </main>
        </div>
    );
}