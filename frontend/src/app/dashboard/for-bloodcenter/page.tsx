"use client"

import { useState, useEffect } from "react"
import { BloodCenterSidebar } from "./components/sidebar"
import { WelcomeCard } from "./components/welcome-card"
import { CenterProfileCard } from "./components/center-profile-card"
import { QuickActions } from "./components/quick-actions"
import { BloodReserveOverview } from "./components/blood-reserve-overview"
import { RecentDonations } from "./components/recent-donations"

interface BloodCenterData {
    bloodCenterId: number
    name: string
    location: string
    city: string
    specialization: string
    directorFullName: string
}

interface DashboardStats {
    todayDonations: number
    pendingRequests: number
    totalReserve: number
}

interface BloodReserveItem {
    bloodGroup: string
    rhesusFactor: string
    quantity: number
}

interface Donation {
    donationId: number
    donorName: string
    donationDate: string
    status: string
    bloodType?: string
}

// Mock data for development/preview (used when backend is not available)
const MOCK_CENTER_DATA: BloodCenterData = {
    bloodCenterId: 1,
    name: "City Blood Center",
    location: "123 Medical Ave",
    city: "Almaty",
    specialization: "General Blood Services",
    directorFullName: "Dr. John Smith",
}

const MOCK_STATS: DashboardStats = {
    todayDonations: 12,
    pendingRequests: 5,
    totalReserve: 245,
}

const MOCK_RESERVES: BloodReserveItem[] = [
    { bloodGroup: "A", rhesusFactor: "+", quantity: 25 },
    { bloodGroup: "A", rhesusFactor: "-", quantity: 8 },
    { bloodGroup: "B", rhesusFactor: "+", quantity: 18 },
    { bloodGroup: "B", rhesusFactor: "-", quantity: 5 },
    { bloodGroup: "AB", rhesusFactor: "+", quantity: 12 },
    { bloodGroup: "AB", rhesusFactor: "-", quantity: 3 },
    { bloodGroup: "O", rhesusFactor: "+", quantity: 30 },
    { bloodGroup: "O", rhesusFactor: "-", quantity: 10 },
]

const MOCK_DONATIONS: Donation[] = [
    { donationId: 1, donorName: "John Doe", donationDate: "2026-03-09T10:30:00", status: "COMPLETED", bloodType: "A+" },
    { donationId: 2, donorName: "Jane Smith", donationDate: "2026-03-09T09:15:00", status: "IN_PROGRESS", bloodType: "O-" },
    { donationId: 3, donorName: "Mike Johnson", donationDate: "2026-03-09T08:00:00", status: "AWAITING_ANALYSIS", bloodType: "B+" },
    { donationId: 4, donorName: "Sarah Wilson", donationDate: "2026-03-08T16:45:00", status: "FINALIZED", bloodType: "AB+" },
    { donationId: 5, donorName: "Tom Brown", donationDate: "2026-03-08T14:30:00", status: "SCHEDULED", bloodType: "O+" },
]

export default function BloodCenterDashboard() {
    const [currentDate] = useState(new Date())
    const [centerData, setCenterData] = useState<BloodCenterData>(MOCK_CENTER_DATA)
    const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
    const [reserves, setReserves] = useState<BloodReserveItem[]>(MOCK_RESERVES)
    const [recentDonations, setRecentDonations] = useState<Donation[]>(MOCK_DONATIONS)
    const [isLoading, setIsLoading] = useState(false)

    // Temporarily hardcoded userId. Later it should be taken from session/token.
    const userId = 1

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch blood center data from backend
                const centerResponse = await fetch(`http://localhost:8080/blood-center/${userId}/dashboard`)
                if (centerResponse.ok) {
                    const data = await centerResponse.json()
                    setCenterData(data.bloodCenter || MOCK_CENTER_DATA)
                    setStats(data.stats || MOCK_STATS)
                    setReserves(data.reserves?.length > 0 ? data.reserves : MOCK_RESERVES)
                    setRecentDonations(data.recentDonations?.length > 0 ? data.recentDonations : MOCK_DONATIONS)
                }
            } catch {
                // Backend not available - use mock data (already set as default)
            }
        }

        fetchDashboardData()
    }, [userId])

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
            weekday: "long",
        })
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-foreground">
                Loading...
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Blood Center Dashboard
                        </h1>
                        <p className="text-muted-foreground">{formatDate(currentDate)}</p>
                    </div>
                    <CenterProfileCard
                        name={centerData.name}
                        city={centerData.city}
                    />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <WelcomeCard
                        centerName={centerData.name}
                        location={centerData.location}
                        todayDonations={stats.todayDonations}
                        pendingRequests={stats.pendingRequests}
                    />
                    <BloodReserveOverview reserves={reserves} />
                </div>

                <QuickActions />

                <div className="mt-6">
                    <RecentDonations donations={recentDonations} />
                </div>
            </main>
        </div>
    )
}
