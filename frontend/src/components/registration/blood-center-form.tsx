"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BloodCenterData } from "@/app/auth/auth-types"

interface BloodCenterFormProps {
    data: BloodCenterData
    onChange: (data: BloodCenterData) => void
}

export function BloodCenterForm({ data, onChange }: BloodCenterFormProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="bloodCenterName">Blood Center Name</Label>
                <Input
                    id="bloodCenterName"
                    placeholder="Enter blood center name"
                    value={data.bloodCenterName}
                    onChange={(e) => onChange({ ...data, bloodCenterName: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="directorFullName">Director Full Name</Label>
                <Input
                    id="directorFullName"
                    placeholder="Enter director's full name"
                    value={data.directorFullName}
                    onChange={(e) => onChange({ ...data, directorFullName: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                    id="city"
                    placeholder="Enter city"
                    value={data.city}
                    onChange={(e) => onChange({ ...data, city: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location / Address</Label>
                <Input
                    id="location"
                    placeholder="Enter full address"
                    value={data.location}
                    onChange={(e) => onChange({ ...data, location: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                    id="specialization"
                    placeholder="e.g., Blood collection, Plasma processing"
                    value={data.specialization}
                    onChange={(e) => onChange({ ...data, specialization: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 43.2380"
                    value={data.latitude || ""}
                    onChange={(e) =>
                        onChange({ ...data, latitude: parseFloat(e.target.value) || 0 })
                    }
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 76.9450"
                    value={data.longitude || ""}
                    onChange={(e) =>
                        onChange({ ...data, longitude: parseFloat(e.target.value) || 0 })
                    }
                    required
                />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="licenseFile">License Document</Label>
                <Input
                    id="licenseFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                        onChange({ ...data, licenseFile: e.target.files?.[0] || null })
                    }
                    className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                    Upload your medical license (PDF, JPG, or PNG)
                </p>
            </div>
        </div>
    )
}
