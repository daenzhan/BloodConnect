"use client"

import { useEffect } from "react"
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
import { validateDonorData } from "@/lib/validation"
import { Check, X } from "lucide-react"

interface DonorFormProps {
    data: DonorData
    onChange: (data: DonorData) => void
    onValidChange?: (isValid: boolean) => void
}

export function DonorForm({ data, onChange, onValidChange }: DonorFormProps) {
    const errors = validateDonorData(data)
    const isValid = Object.keys(errors).length === 0

    useEffect(() => {
        onValidChange?.(isValid)
    }, [isValid, onValidChange])

    const getFieldStyle = (fieldName: keyof DonorData) => {
        const value = data[fieldName]
        if (!value) return ""
        return errors[fieldName] ? "border-red-500 focus:border-red-500" : "border-green-500 focus:border-green-500"
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label className="flex items-center gap-2">
                    Full Name
                    {data.fullName && (
                        <span className={`text-xs ${!errors.fullName ? "text-green-500" : "text-red-500"}`}>
              {!errors.fullName ? "✓ Valid" : "✗ Required"}
            </span>
                    )}
                </Label>
                <Input
                    placeholder="Enter your full name"
                    value={data.fullName}
                    onChange={(e) => onChange({ ...data, fullName: e.target.value })}
                    className={getFieldStyle("fullName")}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                    Birth Date
                    {data.birthDate && (
                        <span className={`text-xs ${!errors.birthDate ? "text-green-500" : "text-red-500"}`}>
              {!errors.birthDate ? "✓ Valid" : "✗ Must be 18-60 years"}
            </span>
                    )}
                </Label>
                <Input
                    type="date"
                    value={data.birthDate}
                    onChange={(e) => onChange({ ...data, birthDate: e.target.value })}
                    className={getFieldStyle("birthDate")}
                    required
                />
            </div>


            <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                    IIN (12 digits)
                    {data.iin && (
                        <span className={`text-xs ${!errors.iin ? "text-green-500" : "text-red-500"}`}>
              {!errors.iin ? "✓ Valid" : "✗ Must be 12 digits"}
            </span>
                    )}
                </Label>
                <Input
                    placeholder="Enter your IIN"
                    value={data.iin}
                    onChange={(e) => onChange({ ...data, iin: e.target.value })}
                    maxLength={12}
                    className={getFieldStyle("iin")}
                    required
                />
            </div>


            <div className="flex flex-col gap-2">
                <Label>Gender</Label>
                <Select value={data.gender} onValueChange={(value: Gender) => onChange({ ...data, gender: value })}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                </Select>
            </div>


            <div className="flex flex-col gap-2">
                <Label>Blood Group</Label>
                <Select value={data.bloodGroup} onValueChange={(value: BloodGroup) => onChange({ ...data, bloodGroup: value })}>
                    <SelectTrigger className="w-full">
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
                <Label>Rhesus Factor</Label>
                <Select value={data.rhesusFactor} onValueChange={(value: RhesusFactor) => onChange({ ...data, rhesusFactor: value })}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select rhesus factor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="POSITIVE">Positive (+)</SelectItem>
                        <SelectItem value="NEGATIVE">Negative (-)</SelectItem>
                    </SelectContent>
                </Select>
            </div>


            <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                    Weight (kg)
                    {data.weight > 0 && (
                        <span className={`text-xs ${!errors.weight ? "text-green-500" : "text-red-500"}`}>
              {!errors.weight ? "✓ Valid" : "✗ Min 30 kg"}
            </span>
                    )}
                </Label>
                <Input
                    type="number"
                    placeholder="70"
                    value={data.weight || ""}
                    onChange={(e) => onChange({ ...data, weight: parseFloat(e.target.value) || 0 })}
                    min={30}
                    max={250}
                    className={getFieldStyle("weight")}
                    required
                />
            </div>


            <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                    Height (cm)
                    {data.height > 0 && (
                        <span className={`text-xs ${!errors.height ? "text-green-500" : "text-red-500"}`}>
              {!errors.height ? "✓ Valid" : "✗ Min 100 cm"}
            </span>
                    )}
                </Label>
                <Input
                    type="number"
                    placeholder="175"
                    value={data.height || ""}
                    onChange={(e) => onChange({ ...data, height: parseFloat(e.target.value) || 0 })}
                    min={100}
                    max={250}
                    className={getFieldStyle("height")}
                    required
                />
            </div>


            <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                    City
                    {data.city && (
                        <span className={`text-xs ${!errors.city ? "text-green-500" : "text-red-500"}`}>
              {!errors.city ? "✓ Valid" : "✗ Required"}
            </span>
                    )}
                </Label>
                <Input
                    placeholder="Enter your city"
                    value={data.city}
                    onChange={(e) => onChange({ ...data, city: e.target.value })}
                    className={getFieldStyle("city")}
                    required
                />
            </div>


            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label className="flex items-center gap-2">
                    Address
                    {data.address && (
                        <span className={`text-xs ${!errors.address ? "text-green-500" : "text-red-500"}`}>
              {!errors.address ? "✓ Valid" : "✗ Required"}
            </span>
                    )}
                </Label>
                <Input
                    placeholder="Enter your full address"
                    value={data.address}
                    onChange={(e) => onChange({ ...data, address: e.target.value })}
                    className={getFieldStyle("address")}
                    required
                />
            </div>
        </div>
    )
}