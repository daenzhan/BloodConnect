"use client"

import { useState, useEffect } from "react"
import { WelcomeCard } from "./components/welcome-card"
import { QuickActions } from "./components/quick-actions"
import { RequestStats } from "./components/request-stats"
import { RecentRequests } from "./components/recent-requests"
import { CenterInfoCard } from "./components/center-info-card"
import { ProfileCard } from "./components/profile-card"

// Matches MedCenter.java entity
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

// Matches BloodRequest.java entity
interface BloodRequestData {
    bloodRequestId: number
    componentType: string
    bloodGroup: string
    rhesusFactor: string
    volume: string
    deadline?: string
    status: string
    comment?: string
    medCenter?: MedCenterData
    bloodCenter?: {
        bloodCenterId: number
        name: string
    }
}

interface DashboardData {
    medCenter: MedCenterData
    requests: BloodRequestData[]
    stats: {
        totalRequests: number
        approvedRequests: number
        pendingRequests: number
        rejectedRequests: number
    }
}

export default function MedCenterDashboard() {
    const [currentDate] = useState(new Date())
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // TODO: Get medCenterId from session/JWT token
    const medCenterId = 1

    useEffect(() => {
        const fetchDashboardData = async () => {
            // Mock data for development / fallback
            const mockData: DashboardData = {
                medCenter: {
                    medCenterId: 1,
                    name: "City General Hospital",
                    location: "123 Medical Center Dr, Almaty",
                    phone: "+7 (727) 123-4567",
                    specialization: "General Medicine",
                    directorFullName: "Dr. Sarah Johnson"
                },
                requests: [
                    {
                        bloodRequestId: 1,
                        componentType: "Whole Blood",
                        bloodGroup: "A",
                        rhesusFactor: "+",
                        volume: "450ml",
                        status: "PENDING",
                        deadline: new Date().toISOString()
                    },
                    {
                        bloodRequestId: 2,
                        componentType: "Plasma",
                        bloodGroup: "O",
                        rhesusFactor: "-",
                        volume: "300ml",
                        status: "APPROVED",
                        deadline: new Date(Date.now() - 86400000).toISOString()
                    },
                    {
                        bloodRequestId: 3,
                        componentType: "Platelets",
                        bloodGroup: "B",
                        rhesusFactor: "+",
                        volume: "200ml",
                        status: "APPROVED",
                        deadline: new Date(Date.now() - 172800000).toISOString()
                    }
                ],
                stats: {
                    totalRequests: 15,
                    approvedRequests: 10,
                    pendingRequests: 3,
                    rejectedRequests: 2
                }
            }

            try {
                // Try to fetch from backend
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 3000)

                const centerResponse = await fetch(`http://localhost:8080/medcenter/${medCenterId}/info`, {
                    signal: controller.signal
                })
                clearTimeout(timeoutId)

                if (centerResponse.ok) {
                    const centerData: MedCenterData = await centerResponse.json()

                    // Fetch own requests
                    const requestsResponse = await fetch(`http://localhost:8080/show/own/requests`, {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    })

                    let requestsData: BloodRequestData[] = []
                    let stats = { totalRequests: 0, approvedRequests: 0, pendingRequests: 0, rejectedRequests: 0 }

                    if (requestsResponse.ok) {
                        requestsData = await requestsResponse.json()
                        stats = {
                            totalRequests: requestsData.length,
                            approvedRequests: requestsData.filter(r => r.status === "APPROVED").length,
                            pendingRequests: requestsData.filter(r => r.status === "PENDING").length,
                            rejectedRequests: requestsData.filter(r => r.status === "REJECTED").length
                        }
                    }

                    setDashboardData({ medCenter: centerData, requests: requestsData, stats })
                    setIsLoading(false)
                    return
                }
            } catch {
                // Backend not available, use mock data silently
            }

            // Use mock data as fallback
            setDashboardData(mockData)
            setIsLoading(false)
        }

        fetchDashboardData()
    }, [medCenterId])

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
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className="p-8 text-destructive">
                Error loading data
            </div>
        )
    }

    return (
        <>
            <header className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Hello, {dashboardData.medCenter.name}!
                    </h1>
                    <p className="text-muted-foreground">{formatDate(currentDate)}</p>
                </div>
                <ProfileCard
                    name={dashboardData.medCenter.name}
                    location={dashboardData.medCenter.location}
                />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <WelcomeCard centerName={dashboardData.medCenter.name} />
                <CenterInfoCard
                    name={dashboardData.medCenter.name}
                    location={dashboardData.medCenter.location}
                    phone={dashboardData.medCenter.phone}
                    specialization={dashboardData.medCenter.specialization}
                />
            </div>

            <QuickActions />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <RecentRequests requests={dashboardData.requests} />
                <RequestStats
                    totalRequests={dashboardData.stats.totalRequests}
                    approvedRequests={dashboardData.stats.approvedRequests}
                    pendingRequests={dashboardData.stats.pendingRequests}
                    rejectedRequests={dashboardData.stats.rejectedRequests}
                />
            </div>
        </>
    )
}
