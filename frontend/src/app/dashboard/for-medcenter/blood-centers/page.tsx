"use client";

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Search, ExternalLink, Building2, AlertCircle, Shield, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ProfileCard } from "@/app/dashboard/for-medcenter/components/profile-card"

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

interface BloodCenter {
    bloodCenterId: number
    name: string
    location: string
    city: string
    specialization?: string
    directorFullName?: string
    latitude?: number
    longitude?: number
}

export default function BloodCentersPage() {
    const [centers, setCenters] = useState<BloodCenter[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [medCenter, setMedCenter] = useState<any>(null)
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
    }, []);

    // Проверка статуса верификации
    useEffect(() => {
        const checkVerification = async () => {
            if (!userId) {
                setIsCheckingAuth(false)
                return
            }

            try {
                const headers = getAuthHeaders()
                if (!headers) {
                    window.location.href = '/auth/login'
                    return
                }

                const response = await fetch(`http://localhost:8080/medcenter/user/${userId}`, {
                    headers: headers
                })

                if (response.status === 403) {
                    setVerificationStatus("PENDING")
                    setIsCheckingAuth(false)
                    return
                }

                if (response.ok) {
                    const data = await response.json()
                    setMedCenter(data)
                    setVerificationStatus(data.verificationStatus || "APPROVED")
                }
            } catch (error) {
                console.error("Error checking verification:", error)
            } finally {
                setIsCheckingAuth(false)
            }
        }

        checkVerification()
    }, [userId])

    useEffect(() => {
        const fetchCenters = async () => {
            if (verificationStatus !== "APPROVED") {
                setIsLoading(false)
                return
            }

            try {
                setError(null)
                console.log("Fetching blood centers from backend...")

                const headers = getAuthHeaders();
                if (!headers) {
                    window.location.href = '/auth/login';
                    return;
                }

                const response = await fetch("http://localhost:8080/blood-centers", {
                    method: 'GET',
                    headers: headers
                })

                console.log("Response status:", response.status)

                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("Access forbidden. Please check your authentication.")
                    } else if (response.status === 404) {
                        throw new Error("Blood centers endpoint not found. Please check the backend URL.")
                    } else {
                        throw new Error(`Failed to fetch blood centers: ${response.status}`)
                    }
                }

                const data = await response.json()
                console.log("Blood centers received:", data)

                if (Array.isArray(data)) {
                    setCenters(data)
                } else {
                    console.error("Received data is not an array:", data)
                    setCenters([])
                }

            } catch (error) {
                console.error("Error fetching blood centers:", error)
                setError(error instanceof Error ? error.message : "Failed to load blood centers. Please try again later.")
                setCenters([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchCenters()
    }, [verificationStatus])

    const filteredCenters = centers.filter(center =>
        center.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getFullAddress = (center: BloodCenter) => {
        return `${center.location || ''}, ${center.city || ''}`
    }

    const openInMaps = (center: BloodCenter) => {
        if (center.latitude && center.longitude) {
            window.open(`https://maps.google.com/?q=${center.latitude},${center.longitude}`, "_blank")
        } else if (center.location && center.city) {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(getFullAddress(center))}`, "_blank")
        } else {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(center.name)}`, "_blank")
        }
    }

    // Показываем статус PENDING
    if (verificationStatus === "PENDING") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-amber-100/30 p-4">
                <Card className="max-w-md w-full p-8 text-center shadow-xl border-0 bg-white">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Shield className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-800 mb-3">Account Pending Verification</h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto mb-6"></div>
                    <p className="text-gray-600 mb-6">
                        Your medical center account is awaiting approval from the administrator.
                    </p>
                    <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left border border-amber-200">
                        <p className="text-sm text-amber-700">
                            You cannot view blood centers until your account is verified.
                            Please wait for admin approval.
                        </p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/dashboard/for-medcenter'}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    >
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        )
    }

    if (isCheckingAuth || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading blood centers...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Blood Centers</h1>
                            <p className="text-sm text-muted-foreground">Find and view blood donation centers</p>
                        </div>
                    </div>
                    {medCenter && (
                        <ProfileCard
                            name={medCenter.name}
                            location={medCenter.location}
                            userId={userId || ""}
                        />
                    )}
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, location or city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl"
                    />
                    {centers.length > 0 && (
                        <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {filteredCenters.length} of {centers.length}
                        </p>
                    )}
                </div>

                {error && (
                    <Card className="p-6 mb-6 bg-destructive/5 border-destructive/20">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-destructive mb-1">Connection Error</h3>
                                <p className="text-sm text-destructive/80">{error}</p>
                                <p className="text-sm text-destructive/80 mt-2">
                                    Make sure the backend server is running on http://localhost:8080
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {!error && centers.length === 0 ? (
                    <Card className="p-8 text-center rounded-2xl border border-border">
                        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">No Blood centers found</h2>
                        <p className="text-muted-foreground mb-4">
                            There are no blood centers registered in the system yet.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCenters.map((center) => (
                            <Card key={center.bloodCenterId} className="p-4 rounded-2xl border border-border hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{center.name}</h3>
                                            <p className="text-sm text-muted-foreground">{center.city}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground">{getFullAddress(center)}</span>
                                    </div>
                                    {center.specialization && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">{center.specialization}</span>
                                        </div>
                                    )}
                                    {center.directorFullName && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Director: {center.directorFullName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-xl"
                                        onClick={() => openInMaps(center)}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        View on Map
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {!error && centers.length > 0 && filteredCenters.length === 0 && (
                    <Card className="p-8 text-center rounded-2xl border border-border mt-4">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">No results found</h2>
                        <p className="text-muted-foreground">
                            No centers match your search criteria. Try a different search term.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    )
}