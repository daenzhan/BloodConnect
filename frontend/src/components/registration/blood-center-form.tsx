"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {FileText, MapPin, Upload, X} from "lucide-react"
import type { BloodCenterData } from "@/app/auth/auth-types"
import { LocationPicker } from "./location-picker"
import { LocationPickerClient } from "./location-picker-client"
interface BloodCenterFormProps {
    data: BloodCenterData
    onChange: (data: BloodCenterData) => void
}

export function BloodCenterForm({ data, onChange }: BloodCenterFormProps) {
    const [isMapOpen, setIsMapOpen] = useState(false)
    const [selectedFileName, setSelectedFileName] = useState<string>("")

    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        onChange({
            ...data,
            latitude: lat,
            longitude: lng,
            location: address || data.location
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        if (file) {
            setSelectedFileName(file.name)
            onChange({ ...data, licenseFile: file })
        } else {
            setSelectedFileName("")
            onChange({ ...data, licenseFile: null })
        }
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="bloodCenterName">Blood Center Name *</Label>
                <Input
                    id="bloodCenterName"
                    placeholder="Enter blood center name"
                    value={data.bloodCenterName}
                    onChange={(e) => onChange({ ...data, bloodCenterName: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="directorFullName">Director Full Name *</Label>
                <Input
                    id="directorFullName"
                    placeholder="Enter director's full name"
                    value={data.directorFullName}
                    onChange={(e) => onChange({ ...data, directorFullName: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                    id="city"
                    placeholder="Enter city"
                    value={data.city}
                    onChange={(e) => onChange({ ...data, city: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location / Address *</Label>
                <Input
                    id="location"
                    placeholder="Enter full address"
                    value={data.location}
                    onChange={(e) => onChange({ ...data, location: e.target.value })}
                    required
                />
            </div>

            <input type="hidden" value={data.latitude || ""} />
            <input type="hidden" value={data.longitude || ""} />

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Center Location *</Label>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={() => setIsMapOpen(true)}
                    >
                        <MapPin className="w-4 h-4 mr-2" />
                        {data.latitude && data.longitude ? "Change Location on Map" : "Select Location on Map"}
                    </Button>
                </div>
                {data.latitude && data.longitude && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
                        <div className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>✓ Location selected</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange({ ...data, latitude: 0, longitude: 0, location: "" })}
                            className="h-6 w-6 p-0"
                            type="button"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                    id="specialization"
                    placeholder="e.g., Blood collection, Plasma processing"
                    value={data.specialization}
                    onChange={(e) => onChange({ ...data, specialization: e.target.value })}
                />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="licenseFile" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    License Document *
                </Label>
                <div className="relative">
                    <Input
                        id="licenseFile"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        required
                    />
                </div>
                {selectedFileName && (
                    <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                        <Upload className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700 dark:text-green-400">
                            Selected: {selectedFileName}
                        </span>
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Upload your medical license (PDF, JPG, or PNG). Max size: 10MB
                </p>
            </div>

            <LocationPickerClient
                open={isMapOpen}
                onOpenChange={setIsMapOpen}
                onLocationSelect={handleLocationSelect}
                currentLat={data.latitude}
                currentLng={data.longitude}
            />
        </div>
    )
}