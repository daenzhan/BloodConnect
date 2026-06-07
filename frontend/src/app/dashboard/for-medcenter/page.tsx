"use client";

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { WelcomeCard } from "./components/welcome-card"
import { QuickActions } from "./components/quick-actions"
import { RequestStats } from "./components/request-stats"
import { RecentRequests } from "./components/recent-requests"
import { CenterInfoCard } from "./components/center-info-card"
import { ProfileCard } from "./components/profile-card"
import { Loader2, Shield, Clock, CheckCircle, XCircle, AlertTriangle, Mail, Building2, FileCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
    verificationStatus?: string
    rejectionReason?: string
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
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)

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

                // Проверяем статус 403 - запрещено (обычно из-за неверифицированного статуса)
                if (centerResponse.status === 403) {
                    setVerificationStatus("PENDING")
                    setIsLoading(false)
                    return
                }

                if (!centerResponse.ok) {
                    if (centerResponse.status === 404) {
                        throw new Error("Medical center not found. Please check the backend URL.")
                    } else {
                        throw new Error(`Failed to fetch medical center: ${centerResponse.status}`)
                    }
                }

                const centerData = await centerResponse.json()
                console.log("Center data received:", centerData)
                setMedCenter(centerData)

                // Сохраняем статус верификации
                const status = centerData.verificationStatus || "APPROVED"
                setVerificationStatus(status)
                setRejectionReason(centerData.rejectionReason || null)

                // Если статус APPROVED, загружаем данные
                if (status === "APPROVED") {
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

    // Компонент для статуса PENDING (ожидание верификации)
    const renderPendingVerification = () => (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-amber-100/30 p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Clock className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">!</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-amber-800 mb-3">Account Pending Verification</h2>

                <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto mb-6"></div>

                <p className="text-gray-600 mb-6">
                    Your medical center account is awaiting approval from the administrator.
                </p>

                <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left border border-amber-200">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-800 mb-1">Why is this happening?</p>
                            <p className="text-amber-700">All medical centers must have their license verified before accessing the system. This ensures compliance with medical regulations.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-gray-700 mb-1">What happens next?</p>
                            <ul className="text-gray-600 space-y-1">
                                <li>• Admin will review your license document</li>
                                <li>• You will receive an email notification once approved</li>
                                <li>• After approval, you can create blood requests</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => window.location.href = '/auth/login'}
                        variant="outline"
                        className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                        Back to Login
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    >
                        Refresh Status
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Need help? Contact support at support@bloodconnect.com
                </p>
            </Card>
        </div>
    )

    // Компонент для статуса REJECTED (отклонено)
    const renderRejectedVerification = () => (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100/30 p-4">
            <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <XCircle className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-red-800 mb-3">Account Not Verified</h2>

                <div className="h-1 w-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full mx-auto mb-6"></div>

                <p className="text-gray-600 mb-6">
                    Your medical center account could not be verified by the administrator.
                </p>

                {rejectionReason && (
                    <div className="bg-red-50 rounded-xl p-4 mb-6 text-left border border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-red-800 mb-1">Rejection Reason</p>
                                <p className="text-red-700">{rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-gray-700 mb-1">What can you do?</p>
                            <ul className="text-gray-600 space-y-1">
                                <li>• Contact support for more information</li>
                                <li>• Correct any issues with your license document</li>
                                <li>• Submit a new registration with updated documents</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => window.location.href = '/auth/login'}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    >
                        Back to Login
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Contact support: support@bloodconnect.com
                </p>
            </Card>
        </div>
    )

    // Показываем статус PENDING
    if (verificationStatus === "PENDING") {
        return renderPendingVerification()
    }

    // Показываем статус REJECTED
    if (verificationStatus === "REJECTED") {
        return renderRejectedVerification()
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    </div>
                    <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (error || !medCenter) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <Card className="max-w-md w-full p-8 text-center shadow-xl">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
                    <p className="text-gray-600 mb-6">{error || "Medical center not found"}</p>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-primary hover:bg-primary/90"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/auth/login'}
                            variant="outline"
                            className="flex-1"
                        >
                            Go to Login
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    const safeUserId = userId || localStorage.getItem('userId') || "";
    if (!safeUserId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <Card className="max-w-md w-full p-8 text-center shadow-xl">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Session Expired</h2>
                    <p className="text-gray-600 mb-6">User ID not found. Please login again.</p>
                    <Button
                        onClick={() => window.location.href = '/auth/login'}
                        className="w-full bg-primary hover:bg-primary/90"
                    >
                        Go to Login
                    </Button>
                </Card>
            </div>
        )
    }

    // Если APPROVED - показываем дашборд
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

                {/* Баннер успешной верификации (если только что одобрено) */}
                {verificationStatus === "APPROVED" && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-800">Account Verified!</p>
                                <p className="text-sm text-green-700">Your medical center is now fully verified. You can create blood requests.</p>
                            </div>
                        </div>
                        <FileCheck className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                )}

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
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">
                            No blood requests found. Click "Create Request" to create your first request.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}