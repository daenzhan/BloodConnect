"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Clock, Search, ExternalLink, Building2 } from "lucide-react"

// Matches BloodCenter.java entity
interface BloodCenter {
    bloodCenterId: number
    name: string
    location: string
    city: string
    specialization?: string
    licenseFile?: string
    directorFullName?: string
    latitude?: number
    longitude?: number
}

export default function BloodCentersPage() {
    const [centers, setCenters] = useState<BloodCenter[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchCenters = async () => {
            try {
                // Fetch blood centers from backend
                const response = await fetch("http://localhost:8080/blood-centers")
                if (response.ok) {
                    const data = await response.json()
                    setCenters(data)
                }
            } catch (error) {
                console.error("Error fetching blood centers:", error)
                // Fallback to mock data matching BloodCenter.java entity
                setCenters([
                    {
                        bloodCenterId: 1,
                        name: "City Blood Bank",
                        location: "123 Main Street",
                        city: "Almaty",
                        specialization: "General Blood Services",
                        directorFullName: "Dr. Alex Kim",
                        latitude: 43.2551,
                        longitude: 76.9126
                    },
                    {
                        bloodCenterId: 2,
                        name: "Regional Blood Center",
                        location: "456 Health Avenue",
                        city: "Almaty",
                        specialization: "Plasma Collection",
                        directorFullName: "Dr. Marina Ivanova",
                        latitude: 43.2380,
                        longitude: 76.9450
                    },
                    {
                        bloodCenterId: 3,
                        name: "Central Hospital Blood Bank",
                        location: "789 Medical Park",
                        city: "Almaty",
                        specialization: "Emergency Blood Services",
                        directorFullName: "Dr. Nurlan Omarov",
                        latitude: 43.2650,
                        longitude: 76.9280
                    },
                    {
                        bloodCenterId: 4,
                        name: "National Blood Transfusion Center",
                        location: "321 Healthcare Blvd",
                        city: "Almaty",
                        specialization: "Full Blood Services",
                        directorFullName: "Dr. Aigul Sadvakasova",
                        latitude: 43.2420,
                        longitude: 76.9100
                    }
                ])
            } finally {
                setIsLoading(false)
            }
        }

        fetchCenters()
    }, [])

    const filteredCenters = centers.filter(center =>
        center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.city.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getFullAddress = (center: BloodCenter) => {
        return `${center.location}, ${center.city}`
    }

    const openInMaps = (center: BloodCenter) => {
        if (center.latitude && center.longitude) {
            window.open(`https://maps.google.com/?q=${center.latitude},${center.longitude}`, "_blank")
        } else {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(getFullAddress(center))}`, "_blank")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading blood centers...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Blood Centers</h1>
                    <p className="text-muted-foreground">Find blood donation centers near you</p>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="Search by name, location or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                />
            </div>

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
                                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">{center.specialization}</span>
                                </div>
                            )}
                            {center.directorFullName && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
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

            {filteredCenters.length === 0 && (
                <Card className="p-8 text-center rounded-2xl border border-border">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">No Centers Found</h2>
                    <p className="text-muted-foreground">
                        No blood centers match your search criteria. Try a different search term.
                    </p>
                </Card>
            )}
        </div>
    )
}
