"use client"

import { useState, useEffect } from "react"
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
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams, useSearchParams } from "next/navigation"

interface BloodRequest {
    bloodRequestId: number
    componentType: string
    bloodGroup: string
    rhesusFactor: string
    volume: string
    deadline?: string
    status: string
    comment?: string
}

const bloodGroups = ["A", "B", "AB", "O"]
const rhesusFactors = [
    { value: "+", label: "Positive (+)" },
    { value: "-", label: "Negative (-)" }
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

export default function EditRequestPage() {
    const [request, setRequest] = useState<BloodRequest | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const medCenterId = searchParams.get('id')
    const requestId = params.id

    const [formData, setFormData] = useState({
        componentType: "",
        bloodGroup: "",
        rhesusFactor: "",
        volume: "",
        deadline: "",
        comment: ""
    })

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                console.log("Fetching request for edit:", requestId)
                const response = await fetch(`http://localhost:8080/blood-requests/${requestId}`)
                if (response.ok) {
                    const data = await response.json()
                    setRequest(data)
                    setFormData({
                        componentType: data.componentType || "",
                        bloodGroup: data.bloodGroup || "",
                        rhesusFactor: data.rhesusFactor || "",
                        volume: data.volume || "",
                        deadline: data.deadline ? data.deadline.slice(0, 16) : "",
                        comment: data.comment || ""
                    })
                }
            } catch (error) {
                console.error("Error fetching request:", error)
                setError("Failed to load request")
            } finally {
                setIsLoading(false)
            }
        }

        if (requestId) {
            fetchRequest()
        }
    }, [requestId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch(`http://localhost:8080/blood-requests/${requestId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...formData,
                    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to update request")
            }

            router.push(`/dashboard/for-medcenter/my-requests?id=${medCenterId}`)
        } catch (err) {
            console.error("Error updating request:", err)
            setError("Failed to update request. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Loading request...</p>
                </div>
            </div>
        )
    }

    if (!request) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 mb-4">Request not found</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link
                    href={`/dashboard/for-medcenter/my-requests?id=${medCenterId}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Requests
                </Link>
            </div>

            <Card className="p-6 rounded-2xl border border-border">
                <h1 className="text-2xl font-bold text-foreground mb-6">Edit Blood Request #{requestId}</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="componentType">Component Type *</Label>
                        <Select
                            value={formData.componentType}
                            onValueChange={(value) => setFormData({ ...formData, componentType: value })}
                            required
                        >
                            <SelectTrigger id="componentType">
                                <SelectValue placeholder="Select blood component" />
                            </SelectTrigger>
                            <SelectContent>
                                {componentTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bloodGroup">Blood Group *</Label>
                            <Select
                                value={formData.bloodGroup}
                                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                                required
                            >
                                <SelectTrigger id="bloodGroup">
                                    <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bloodGroups.map((group) => (
                                        <SelectItem key={group} value={group}>
                                            {group}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rhesusFactor">Rhesus Factor *</Label>
                            <Select
                                value={formData.rhesusFactor}
                                onValueChange={(value) => setFormData({ ...formData, rhesusFactor: value })}
                                required
                            >
                                <SelectTrigger id="rhesusFactor">
                                    <SelectValue placeholder="Select Rh factor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rhesusFactors.map((rh) => (
                                        <SelectItem key={rh.value} value={rh.value}>
                                            {rh.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="volume">Volume *</Label>
                            <Select
                                value={formData.volume}
                                onValueChange={(value) => setFormData({ ...formData, volume: value })}
                                required
                            >
                                <SelectTrigger id="volume">
                                    <SelectValue placeholder="Select volume" />
                                </SelectTrigger>
                                <SelectContent>
                                    {volumeOptions.map((vol) => (
                                        <SelectItem key={vol.value} value={vol.value}>
                                            {vol.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deadline">Deadline</Label>
                            <Input
                                id="deadline"
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Additional Comments</Label>
                        <Textarea
                            id="comment"
                            placeholder="Any additional information about the request..."
                            rows={4}
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Link href={`/dashboard/for-medcenter/my-requests?id=${medCenterId}`} className="flex-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-xl"
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                            disabled={isSaving || !formData.componentType || !formData.bloodGroup || !formData.rhesusFactor || !formData.volume}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}