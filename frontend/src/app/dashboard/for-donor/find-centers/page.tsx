"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    MapPin,
    Search,
    ExternalLink,
    Building2,
    ArrowLeft,
    AlertCircle,
    Loader2
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "../components/sidebar"
import { ProfileCard } from "../components/profile-card"
import { Badge } from "@/components/ui/badge"

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

export default function FindCentersPage() {
    const [centers, setCenters] = useState<BloodCenter[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const userIdFromUrl = searchParams.get('userId') || searchParams.get('id')
    const [userId, setUserId] = useState<string | null>(null)

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token')
        if (!token) {
            console.error("No token found")
            return null
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/auth/login')
            return
        }

        let finalUserId = userIdFromUrl
        if (!finalUserId || finalUserId === 'null') {
            const storedId = localStorage.getItem('userId')
            if (storedId && storedId !== 'null') {
                finalUserId = storedId
            }
        }

        if (finalUserId && finalUserId !== 'null') {
            setUserId(finalUserId)
            localStorage.setItem('userId', finalUserId)
        } else {
            setIsLoading(false)
            setError("No user ID found")
        }
    }, [userIdFromUrl, router])

    useEffect(() => {
        const fetchCenters = async () => {
            if (!userId) return

            try {
                setError(null)
                const headers = getAuthHeaders()
                if (!headers) {
                    router.push('/auth/login')
                    return
                }

                console.log("Fetching blood centers from backend with auth token...")

                const response = await fetch("http://localhost:8080/blood-centers", {
                    method: 'GET',
                    headers: headers
                })

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    localStorage.removeItem('userId')
                    router.push('/auth/login')
                    return
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch blood centers: ${response.status}`)
                }

                const data = await response.json()
                console.log("Blood centers received:", data)

                if (Array.isArray(data)) {
                    setCenters(data)
                } else {
                    setCenters([])
                }
            } catch (error) {
                console.error("Error fetching blood centers:", error)
                setError(error instanceof Error ? error.message : "Failed to load blood centers")
                setCenters([])
            } finally {
                setIsLoading(false)
            }
        }

        if (userId) {
            fetchCenters()
        }
    }, [userId, router])

    // Фильтрация только по имени центра
    const filteredCenters = centers.filter(center => {
        const searchLower = searchQuery.toLowerCase()
        return center.name?.toLowerCase().includes(searchLower)
    })

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Find Blood Centers</h1>
                            <p className="text-muted-foreground mt-1">Browse all blood donation centers</p>
                        </div>
                        <div className="flex items-center gap-3">

                            {userId && <ProfileCard userId={userId} showBookButton={false} />}
                        </div>
                    </div>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading blood centers...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Find Blood Centers</h1>
                            <p className="text-muted-foreground mt-1">Browse all blood donation centers</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => router.push(`/dashboard/for-donor?userId=${userId || ''}`)}
                                variant="outline"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            {userId && <ProfileCard userId={userId} showBookButton={false} />}
                        </div>
                    </div>
                    <Card className="p-12 text-center">
                        <div className="text-destructive mb-4">
                            <AlertCircle className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Error Loading Blood Centers</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </Card>
                </main>
            </div>
        )
    }

    if (!userId || userId === 'null') {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Blood Centers</h1>
                            <p className="text-muted-foreground mt-1">Browse all blood donation centers</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => router.push('/auth/login')}
                                variant="outline"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </div>
                    </div>
                    <Card className="p-6 text-center">
                        <p className="text-red-600">Access Denied: User ID not found</p>
                        <button
                            onClick={() => router.push('/auth/login')}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Go to Login
                        </button>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-20 lg:ml-64 p-6 lg:p-8">
                {/* Fixed Header - всегда на месте */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Blood Centers</h1>
                        <p className="text-muted-foreground mt-1">Browse all blood donation centers</p>
                    </div>
                    <div className="flex items-center gap-3">

                        <ProfileCard userId={userId} showBookButton={false} />
                    </div>
                </div>

                {/* Search Bar - фиксированная позиция */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl h-11"
                    />
                    {centers.length > 0 && searchQuery && (
                        <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            Found {filteredCenters.length} of {centers.length} centers
                        </p>
                    )}

                </div>

                {/* Content - динамическая область */}
                {centers.length === 0 ? (
                    <Card className="p-12 text-center">
                        <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Blood Centers Found</h3>
                        <p className="text-muted-foreground mb-4">
                            There are no blood centers registered in the system yet.
                        </p>
                    </Card>
                ) : filteredCenters.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                        <p className="text-muted-foreground mb-4">
                            No centers match "{searchQuery}". Try a different search term.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSearchQuery("")}
                        >
                            Clear Search
                        </Button>
                    </Card>
                ) : (
                    <>
                        {/* Results Count */}
                        {searchQuery && (
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {filteredCenters.length} results for "{searchQuery}"
                                </p>
                            </div>
                        )}

                        {/* Centers Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                            {filteredCenters.map((center) => (
                                <Card key={center.bloodCenterId} className="p-6 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Building2 className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground text-lg">{center.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {center.city || "City not specified"}
                                                    </Badge>
                                                    {center.specialization && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {center.specialization}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-5">
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground">{getFullAddress(center)}</span>
                                        </div>
                                        {center.directorFullName && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">📋 Director: {center.directorFullName}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => openInMaps(center)}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        View on Map
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}