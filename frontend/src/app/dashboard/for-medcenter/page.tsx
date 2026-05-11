"use client";

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { WelcomeCard } from "./components/welcome-card"
import { QuickActions } from "./components/quick-actions"
import { RequestStats } from "./components/request-stats"
import { RecentRequests } from "./components/recent-requests"
import { CenterInfoCard } from "./components/center-info-card"
import { ProfileCard } from "./components/profile-card"
import { Loader2 } from "lucide-react";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

interface MedCenterData {
    medCenterId: number
    name: string
    location: string
    licenseFile?: string
    directorFullName?: string
    specialization?: string
    createdAt?: string
}

interface BloodRequest {
    bloodRequestId: number
    componentType: string
    bloodGroup: string
    rhesusFactor: string
    volume: string
    deadline?: string
    status: string
    comment?: string
    medCenter?: {
        medCenterId: number
        name: string
    }
    bloodCenter?: {
        bloodCenterId: number
        name: string
    }
}

const formatRhesusSymbol = (rhesusFactor: string): string => {
    if (!rhesusFactor) return "";
    const lower = rhesusFactor.toLowerCase();
    if (lower.includes("positive") || lower === "+") {
        return "+";
    } else if (lower.includes("negative") || lower === "-") {
        return "-";
    }
    return rhesusFactor;
};

const getBloodTypeDisplay = (request: BloodRequest): string => {
    const rhesusSymbol = formatRhesusSymbol(request.rhesusFactor);
    return `${request.bloodGroup}${rhesusSymbol}`;
};

export default function MedCenterDashboard() {
    const [currentDate] = useState(new Date())
    const [medCenter, setMedCenter] = useState<MedCenterData | null>(null)
    const [medCenterId, setMedCenterId] = useState<number | null>(null)
    const [requests, setRequests] = useState<BloodRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
    }, []);

    useEffect(() => {
        if (!userId || userId === 'null') {
            setError("User ID not provided in URL")
            setIsLoading(false)
            return
        }

        const fetchData = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }

                console.log("Fetching med center for user ID:", userId)

                const centerResponse = await fetch(`http://localhost:8080/medcenter/user/${userId}`, {
                    headers: headers
                })

                console.log("Response status:", centerResponse.status)
                if (!centerResponse.ok) {
                    if (centerResponse.status === 403) {
                        throw new Error("Access forbidden. Please check your authentication.")
                    } else if (centerResponse.status === 404) {
                        throw new Error("Blood centers endpoint not found. Please check the backend URL.")
                    } else {
                        throw new Error(`Failed to fetch blood centers: ${centerResponse.status}`)
                    }
                }

                const centerData = await centerResponse.json()
                console.log("Center data received:", centerData)
                setMedCenter(centerData)

                const fetchedMedCenterId = centerData.medCenterId
                setMedCenterId(fetchedMedCenterId)

                const requestsResponse = await fetch(`http://localhost:8080/blood-requests/medcenter/${fetchedMedCenterId}`, {
                    headers: headers
                })

                if (requestsResponse.ok) {
                    const requestsData = await requestsResponse.json()
                    console.log("Requests received:", requestsData)
                    setRequests(requestsData)
                } else {
                    console.log("No requests found or error fetching requests")
                }

                setError(null)
            } catch (error) {
                console.error("Error fetching data:", error)
                setError("Failed to load dashboard data. Please try again later.")
            } finally {
                setIsLoading(false)
            }
        }

        if (userId && userId !== 'null') {
            fetchData()
        }
    }, [userId])

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
            weekday: "long",
        })
    }

    const stats = {
        totalRequests: requests.length,
        approvedRequests: requests.filter(r => r.status === "APPROVED").length,
        pendingRequests: requests.filter(r => r.status === "PENDING").length,
        rejectedRequests: requests.filter(r => r.status === "REJECTED").length,
        inProgressRequests: requests.filter(r => r.status === "IN_PROGRESS").length
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (error || !medCenter) {
        return (
            <div className="p-8 text-center">
                <p className="text-destructive mb-4">{error || "Medical center not found"}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                    Try Again
                </button>
            </div>
        )
    }

    const safeUserId = userId || localStorage.getItem('userId') || "";
    if (!safeUserId) {
        return (
            <div className="p-8 text-center">
                <p className="text-destructive mb-4">User ID not found. Please login again.</p>
                <button
                    onClick={() => window.location.href = '/auth/login'}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                    Go to Login
                </button>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="space-y-6">
                <header className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Hello, {medCenter.name}!
                        </h1>
                        <p className="text-muted-foreground">{formatDate(currentDate)}</p>
                    </div>
                    <ProfileCard
                        name={medCenter.name}
                        location={medCenter.location}
                        userId={safeUserId}
                    />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WelcomeCard centerName={medCenter.name} />
                    <CenterInfoCard
                        name={medCenter.name}
                        location={medCenter.location}
                        specialization={medCenter.specialization}
                    />
                </div>

                <QuickActions userId={safeUserId} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentRequests
                        requests={requests}
                        userId={safeUserId}
                    />
                    <RequestStats
                        totalRequests={stats.totalRequests}
                        approvedRequests={stats.approvedRequests}
                        pendingRequests={stats.pendingRequests}
                        rejectedRequests={stats.rejectedRequests}
                        inProgressRequests={stats.inProgressRequests}
                    />
                </div>

                {requests.length === 0 && (
                    <div className="bg-muted/50 rounded-xl p-6 text-center">
                        <p className="text-muted-foreground">
                            No blood requests found. Click "Create Request" to create your first request.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}