"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, ExternalLink, Building2, ArrowLeft, AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "../components/sidebar"

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

    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    // Fetch blood centers
    useEffect(() => {
        const fetchCenters = async () => {
            try {
                setError(null)
                console.log("Fetching blood centers from backend...")

                const response = await fetch("http://localhost:8080/blood-centers", {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

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

        fetchCenters()
    }, [])

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

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading blood centers...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header with Back Button */}
                    <div className="mb-6">
                        <Link
                            href={`/dashboard/for-donor?userId=${userId}`}
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </div>

                    {/* Page Title */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Find Blood Centers</h1>
                            <p className="text-muted-foreground mt-1">
                                Browse all blood donation centers
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, location or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl h-11"
                        />
                        {centers.length > 0 && (
                            <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                {filteredCenters.length} of {centers.length} centers
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <Card className="p-6 mb-6 bg-destructive/5 border-destructive/20 rounded-xl">
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

                    {/* No Centers Found */}
                    {!error && centers.length === 0 ? (
                        <Card className="p-12 text-center rounded-xl border border-border">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">No Blood Centers Found</h2>
                            <p className="text-muted-foreground">
                                There are no blood centers registered in the system yet.
                            </p>
                        </Card>
                    ) : (
                        /* Centers Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                            {filteredCenters.map((center) => (
                                <Card key={center.bloodCenterId} className="p-5 rounded-xl border border-border hover:shadow-lg transition-all duration-200">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Building2 className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground text-lg">{center.name}</h3>
                                                <p className="text-sm text-muted-foreground">{center.city}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 mb-5">
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
                                                <span className="text-muted-foreground">📋 Director: {center.directorFullName}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-lg"
                                        onClick={() => openInMaps(center)}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        View on Map
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* No Search Results */}
                    {!error && centers.length > 0 && filteredCenters.length === 0 && (
                        <Card className="p-12 text-center rounded-xl border border-border mt-6">
                            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">No Results Found</h2>
                            <p className="text-muted-foreground">
                                No centers match your search criteria. Try a different search term.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setSearchQuery("")}
                            >
                                Clear Search
                            </Button>
                        </Card>
                    )}


                </div>
            </main>
        </div>
    )
}