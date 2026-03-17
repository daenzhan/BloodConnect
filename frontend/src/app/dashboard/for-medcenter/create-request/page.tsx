"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group"
import { FileText, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

const bloodGroups = ["A", "B", "AB", "O"]

// Rhesus factors as Positive/Negative
const rhesusFactors = [
    { value: "Positive", label: "Positive (+)" },
    { value: "Negative", label: "Negative (-)" }
]

const componentTypes = [
    { value: "WHOLE_BLOOD", label: "Whole Blood" },
    { value: "PLASMA", label: "Plasma" },
    { value: "PLATELETS", label: "Platelets" },
    { value: "RED_CELLS", label: "Red Blood Cells" },
    { value: "CRYOPRECIPITATE", label: "Cryoprecipitate" }
]

const volumeOptions = [
    { value: "200ml", label: "200 ml" },
    { value: "250ml", label: "250 ml" },
    { value: "300ml", label: "300 ml" },
    { value: "350ml", label: "350 ml" },
    { value: "450ml", label: "450 ml" },
    { value: "500ml", label: "500 ml" }
]

const unitOptions = [
    { value: "ml", label: "Milliliters (ml)" },
    { value: "L", label: "Liters (L)" }
]

export default function CreateRequestPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const medCenterId = searchParams.get('id')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCustomVolume, setIsCustomVolume] = useState(false)
    const [customVolumeValue, setCustomVolumeValue] = useState("")
    const [customVolumeUnit, setCustomVolumeUnit] = useState("ml")

    const [formData, setFormData] = useState({
        componentType: "",
        bloodGroup: "",
        rhesusFactor: "",
        volume: "",
        deadline: "",
        comment: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        if (!medCenterId) {
            setError("Medical Center ID not found")
            setIsSubmitting(false)
            return
        }

        // Determine final volume
        let finalVolume = formData.volume
        if (isCustomVolume && customVolumeValue) {
            finalVolume = `${customVolumeValue}${customVolumeUnit}`
        }

        if (!finalVolume) {
            setError("Please select or enter a volume")
            setIsSubmitting(false)
            return
        }

        try {
            const requestData = {
                componentType: formData.componentType,
                bloodGroup: formData.bloodGroup,
                rhesusFactor: formData.rhesusFactor,
                volume: finalVolume,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
                comment: formData.comment || null,
                status: "PENDING",
                medCenter: { medCenterId: parseInt(medCenterId) }
            }

            console.log("Submitting request:", requestData)

            const response = await fetch("http://localhost:8080/blood-requests/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData),
            })

            if (!response.ok) {
                throw new Error("Failed to create request")
            }

            setIsSuccess(true)
            setTimeout(() => {
                router.push(`/dashboard/for-medcenter/my-requests?id=${medCenterId}`)
            }, 2000)
        } catch (err) {
            console.error("Error creating request:", err)
            setError("Failed to create request. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="p-8 text-center max-w-md rounded-2xl border border-border">
                    <div className="w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-chart-2" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Request Created!</h2>
                    <p className="text-muted-foreground mb-4">
                        Your blood request has been submitted successfully.
                    </p>
                    <Link href={`/dashboard/for-medcenter/my-requests?id=${medCenterId}`}>
                        <Button className="bg-primary hover:bg-primary/90 rounded-xl">
                            View My Requests
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="mb-6">
                <Link
                    href={`/dashboard/for-medcenter?id=${medCenterId}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Create Blood Request</h1>
                        <p className="text-muted-foreground">Submit a new blood request for your patients</p>
                    </div>
                </div>
            </div>

            <Card className="p-6 rounded-2xl border border-border">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Component Type */}
                    <div className="space-y-2">
                        <Label htmlFor="componentType" className="text-sm font-medium">
                            Component Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.componentType}
                            onValueChange={(value) => setFormData({ ...formData, componentType: value })}
                            required
                        >
                            <SelectTrigger id="componentType" className="w-full h-11 bg-white">
                                <SelectValue placeholder="Select blood component" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                {componentTypes.map((type) => (
                                    <SelectItem
                                        key={type.value}
                                        value={type.value}
                                        className="cursor-pointer py-3 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900"
                                    >
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Blood Group and Rhesus Factor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bloodGroup" className="text-sm font-medium">
                                Blood Group <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.bloodGroup}
                                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                                required
                            >
                                <SelectTrigger id="bloodGroup" className="w-full h-11 bg-white">
                                    <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                    {bloodGroups.map((group) => (
                                        <SelectItem
                                            key={group}
                                            value={group}
                                            className="cursor-pointer py-3 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900"
                                        >
                                            {group}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rhesusFactor" className="text-sm font-medium">
                                Rhesus Factor <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.rhesusFactor}
                                onValueChange={(value) => setFormData({ ...formData, rhesusFactor: value })}
                                required
                            >
                                <SelectTrigger id="rhesusFactor" className="w-full h-11 bg-white">
                                    <SelectValue placeholder="Select Rh factor" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                    {rhesusFactors.map((rh) => (
                                        <SelectItem
                                            key={rh.value}
                                            value={rh.value}
                                            className="cursor-pointer py-3 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900"
                                        >
                                            {rh.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Volume with Custom Input Option */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">
                            Volume <span className="text-red-500">*</span>
                        </Label>

                        <div className="flex gap-2 mb-2">
                            <Button
                                type="button"
                                variant={!isCustomVolume ? "default" : "outline"}
                                className={`flex-1 h-11 ${!isCustomVolume ? 'bg-primary text-white' : 'bg-white'}`}
                                onClick={() => {
                                    setIsCustomVolume(false)
                                    setCustomVolumeValue("")
                                }}
                            >
                                Select from list
                            </Button>
                            <Button
                                type="button"
                                variant={isCustomVolume ? "default" : "outline"}
                                className={`flex-1 h-11 ${isCustomVolume ? 'bg-primary text-white' : 'bg-white'}`}
                                onClick={() => setIsCustomVolume(true)}
                            >
                                Enter custom
                            </Button>
                        </div>

                        {!isCustomVolume ? (
                            <Select
                                value={formData.volume}
                                onValueChange={(value) => setFormData({ ...formData, volume: value })}
                                required={!isCustomVolume}
                            >
                                <SelectTrigger id="volume" className="w-full h-11 bg-white">
                                    <SelectValue placeholder="Select volume" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                                    {volumeOptions.map((vol) => (
                                        <SelectItem
                                            key={vol.value}
                                            value={vol.value}
                                            className="cursor-pointer py-3 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900"
                                        >
                                            {vol.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Input
                                            id="customVolume"
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            placeholder="Enter amount"
                                            value={customVolumeValue}
                                            onChange={(e) => {
                                                setCustomVolumeValue(e.target.value)
                                                setFormData({ ...formData, volume: "" })
                                            }}
                                            className="w-full h-11 px-4 border border-input bg-white rounded-xl"
                                            required={isCustomVolume}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <Select
                                            value={customVolumeUnit}
                                            onValueChange={setCustomVolumeUnit}
                                        >
                                            <SelectTrigger className="w-full h-11 bg-white">
                                                <SelectValue placeholder="Unit" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                                {unitOptions.map((unit) => (
                                                    <SelectItem
                                                        key={unit.value}
                                                        value={unit.value}
                                                        className="cursor-pointer py-3 hover:bg-gray-100 bg-white text-gray-900"
                                                    >
                                                        {unit.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex gap-3 text-sm text-muted-foreground">
                                    <span>Examples:</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">450ml</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">0.5L</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">1L</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">750ml</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deadline */}
                    <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-sm font-medium">
                            Deadline <span className="text-gray-400 text-xs">(Optional)</span>
                        </Label>
                        <Input
                            id="deadline"
                            type="datetime-local"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            className="rounded-xl w-full h-11 px-4 border border-input bg-white"
                        />
                    </div>

                    {/* Comments */}
                    <div className="space-y-2">
                        <Label htmlFor="comment" className="text-sm font-medium">
                            Additional Comments <span className="text-gray-400 text-xs">(Optional)</span>
                        </Label>
                        <Textarea
                            id="comment"
                            placeholder="Any additional information about the request..."
                            rows={4}
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            className="rounded-xl w-full resize-none p-4 border border-input bg-white"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <Link href={`/dashboard/for-medcenter?id=${medCenterId}`} className="flex-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-xl h-12 border-2 hover:bg-gray-50 transition-all bg-white"
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-12 transition-all text-white"
                            disabled={isSubmitting || !formData.componentType || !formData.bloodGroup || !formData.rhesusFactor || (!formData.volume && !customVolumeValue)}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Submitting...
                                </span>
                            ) : (
                                "Submit Request"
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}