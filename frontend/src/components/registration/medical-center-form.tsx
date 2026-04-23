"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MedicalCenterData } from "@/app/auth/auth-types"

interface MedicalCenterFormProps {
    data: MedicalCenterData
    onChange: (data: MedicalCenterData) => void
}

export function MedicalCenterForm({ data, onChange }: MedicalCenterFormProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="medCenterName">Medical Center Name</Label>
                <Input
                    id="medCenterName"
                    placeholder="Enter medical center name"
                    value={data.medCenterName}
                    onChange={(e) => onChange({ ...data, medCenterName: e.target.value })}
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
                <Label htmlFor="location">Location / Address</Label>
                <Input
                    id="location"
                    placeholder="Enter full address"
                    value={data.location}
                    onChange={(e) => onChange({ ...data, location: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (777) 123-4567"
                    value={data.phone}
                    onChange={(e) => onChange({ ...data, phone: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                    id="specialization"
                    placeholder="e.g., General surgery, Oncology"
                    value={data.specialization}
                    onChange={(e) => onChange({ ...data, specialization: e.target.value })}
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
