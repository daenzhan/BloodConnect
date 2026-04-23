"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { DonorData, BloodGroup, RhesusFactor, Gender } from "@/app/auth/auth-types"

interface DonorFormProps {
    data: DonorData
    onChange: (data: DonorData) => void
}

export function DonorForm({ data, onChange }: DonorFormProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={data.fullName}
                    onChange={(e) => onChange({ ...data, fullName: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                    id="birthDate"
                    type="date"
                    value={data.birthDate}
                    onChange={(e) => onChange({ ...data, birthDate: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="iin">IIN (Individual Identification Number)</Label>
                <Input
                    id="iin"
                    placeholder="Enter your IIN"
                    value={data.iin}
                    onChange={(e) => onChange({ ...data, iin: e.target.value })}
                    required
                    maxLength={12}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                    value={data.gender}
                    onValueChange={(value: Gender) => onChange({ ...data, gender: value })}
                >
                    <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select
                    value={data.bloodGroup}
                    onValueChange={(value: BloodGroup) =>
                        onChange({ ...data, bloodGroup: value })
                    }
                >
                    <SelectTrigger id="bloodGroup" className="w-full">
                        <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="AB">AB</SelectItem>
                        <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="rhesusFactor">Rhesus Factor</Label>
                <Select
                    value={data.rhesusFactor}
                    onValueChange={(value: RhesusFactor) =>
                        onChange({ ...data, rhesusFactor: value })
                    }
                >
                    <SelectTrigger id="rhesusFactor" className="w-full">
                        <SelectValue placeholder="Select rhesus factor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="POSITIVE">Positive (+)</SelectItem>
                        <SelectItem value="NEGATIVE">Negative (-)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={data.weight || ""}
                    onChange={(e) =>
                        onChange({ ...data, weight: parseFloat(e.target.value) || 0 })
                    }
                    required
                    min={40}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={data.height || ""}
                    onChange={(e) =>
                        onChange({ ...data, height: parseFloat(e.target.value) || 0 })
                    }
                    required
                    min={100}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                    id="city"
                    placeholder="Enter your city"
                    value={data.city}
                    onChange={(e) => onChange({ ...data, city: e.target.value })}
                    required
                />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    placeholder="Enter your full address"
                    value={data.address}
                    onChange={(e) => onChange({ ...data, address: e.target.value })}
                    required
                />
            </div>
        </div>
    )
}
