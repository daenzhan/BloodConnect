"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { WelcomeCard } from "./components/welcome-card"
import { QuickActions } from "./components/quick-actions"
import { RequestStats } from "./components/request-stats"
import { RecentRequests } from "./components/recent-requests"
import { CenterInfoCard } from "./components/center-info-card"
import { ProfileCard } from "./components/profile-card"

interface MedCenterData {
    medCenterId: number
    name: string
    location: string
    phone: string
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

export default function MedCenterDashboard() {
    const [currentDate] = useState(new Date())
    const [medCenter, setMedCenter] = useState<MedCenterData | null>(null)
    const [requests, setRequests] = useState<BloodRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const searchParams = useSearchParams()
    const medCenterId = searchParams.get('id')

    useEffect(() => {
        if (!medCenterId) {
            setError("Medical Center ID not provided in URL")
            setIsLoading(false)
            return
        }

        const fetchData = async () => {
            try {
                console.log("Fetching med center data for ID:", medCenterId)

                const centerResponse = await fetch(`http://localhost:8080/medcenter/${medCenterId}`)

                if (!centerResponse.ok) {
                    throw new Error(`Failed to fetch medical center data: ${centerResponse.status}`)
                }

                const centerData = await centerResponse.json()
                console.log("Center data received:", centerData)
                setMedCenter(centerData)

                const requestsResponse = await fetch(`http://localhost:8080/blood-requests/medcenter/${medCenterId}`)

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

        if (medCenterId) {
            fetchData()
        }
    }, [medCenterId])

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
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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

    return (
        <div className="space-y-6">
            <header className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Hello, {medCenter.name}!
                    </h1>
                    <p className="text-muted-foreground">{formatDate(currentDate)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Center ID: {medCenter.medCenterId} | URL ID: {medCenterId}
                    </p>
                </div>
                <ProfileCard
                    name={medCenter.name}
                    location={medCenter.location}
                />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <WelcomeCard centerName={medCenter.name} />
                <CenterInfoCard
                    name={medCenter.name}
                    location={medCenter.location}
                    phone={medCenter.phone}
                    specialization={medCenter.specialization}
                />
            </div>

            <QuickActions />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <RecentRequests requests={requests} />
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
    )
}