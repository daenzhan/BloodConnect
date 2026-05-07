"use client"

import { useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navigation, Loader2, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"


delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

const mapContainerStyle = { width: "100%", height: "400px", borderRadius: "8px" }
const defaultCenter: [number, number] = [43.238, 76.945] // Алматы

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

function MapController({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
    const map = useMap()
    map.setView([lat, lng], zoom)
    return null
}

function SearchControl({ onSearchResult }: { onSearchResult: (lat: number, lng: number, address: string) => void }) {
    const [query, setQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const map = useMap()

    const searchAddress = async () => {
        if (!query.trim()) return
        setIsSearching(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                { headers: { "User-Agent": "BloodConnect/1.0" } }
            )
            const data = await response.json()
            if (data && data[0]) {
                const lat = parseFloat(data[0].lat)
                const lng = parseFloat(data[0].lon)
                const address = data[0].display_name
                map.setView([lat, lng], 15)
                onSearchResult(lat, lng, address)
            } else {
                alert("Address not found")
            }
        } catch (error) {
            console.error("Search error:", error)
            alert("Search error")
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="absolute top-3 left-3 z-[1000] flex gap-2 bg-background p-2 rounded-lg shadow-md">
            <Input
                placeholder="Searching for an address..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64 h-9"
                onKeyDown={(e) => e.key === "Enter" && searchAddress()}
            />
            <Button size="sm" onClick={searchAddress} disabled={isSearching} className="h-9">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
            </Button>
        </div>
    )
}

interface LocationPickerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onLocationSelect: (lat: number, lng: number, address: string) => void
    currentLat?: number | null
    currentLng?: number | null
}

export function LocationPicker({ open, onOpenChange, onLocationSelect, currentLat, currentLng }: LocationPickerProps) {
    const [selectedLat, setSelectedLat] = useState<number | null>(currentLat || null)
    const [selectedLng, setSelectedLng] = useState<number | null>(currentLng || null)
    const [address, setAddress] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleMapClick = useCallback(async (lat: number, lng: number) => {
        setSelectedLat(lat)
        setSelectedLng(lng)

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { "User-Agent": "BloodConnect/1.0" } }
            )
            const data = await response.json()
            setAddress(data.display_name || `${lat}, ${lng}`)
        } catch (error) {
            console.error("Address retrieval error:", error)
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
    }, [])

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported")
            return
        }
        setIsLoading(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                setSelectedLat(lat)
                setSelectedLng(lng)

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                        { headers: { "User-Agent": "BloodConnect/1.0" } }
                    )
                    const data = await response.json()
                    setAddress(data.display_name || `${lat}, ${lng}`)
                } catch (error) {
                    setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
                }
                setIsLoading(false)
            },
            (error) => {
                console.error("Geolocation error:", error)
                alert("Unable to determine the location")
                setIsLoading(false)
            }
        )
    }

    const handleSearchResult = (lat: number, lng: number, addr: string) => {
        setSelectedLat(lat)
        setSelectedLng(lng)
        setAddress(addr)
    }

    const handleConfirm = () => {
        if (selectedLat && selectedLng) {
            onLocationSelect(selectedLat, selectedLng, address)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Select a blood center location</DialogTitle>
                    <DialogDescription>
                        Find an address, use geolocation, or click on the map
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <MapContainer center={defaultCenter} zoom={12} style={mapContainerStyle} className="relative">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                        {selectedLat && selectedLng && (
                            <>
                                <MapController lat={selectedLat} lng={selectedLng} zoom={14} />
                                <Marker position={[selectedLat, selectedLng]} />
                            </>
                        )}
                        <SearchControl onSearchResult={handleSearchResult} />
                    </MapContainer>

                    <div className="flex gap-2">
                        <Button onClick={getCurrentLocation} variant="outline" className="flex-1" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
                            My location
                        </Button>
                    </div>

                    {address && (
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Selected location:</p>
                            <p className="text-xs text-muted-foreground">{address}</p>
                            {selectedLat && selectedLng && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Coordinates: {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={handleConfirm} disabled={!selectedLat || !selectedLng} className="flex-1">
                            Confirm
                        </Button>
                        <Button onClick={() => onOpenChange(false)} variant="ghost" className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}