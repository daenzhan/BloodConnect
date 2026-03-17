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
import { FileText, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Matches BloodRequest.java entity fields
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

export default function CreateRequestPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form data matches BloodRequest.java entity
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

        try {
            // POST to /create/request endpoint
            const response = await fetch("http://localhost:8080/create/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // TODO: Add Authorization header with JWT token
                },
                body: JSON.stringify({
                    componentType: formData.componentType,
                    bloodGroup: formData.bloodGroup,
                    rhesusFactor: formData.rhesusFactor,
                    volume: formData.volume,
                    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
                    comment: formData.comment || null,
                    status: "PENDING"
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to create request")
            }

            setIsSuccess(true)
            setTimeout(() => {
                router.push("/dashboard/for-medcenter/my-requests")
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
                        Your blood request has been submitted successfully. You will be redirected to your requests page.
                    </p>
                    <Link href="/dashboard/for-medcenter/my-requests">
                        <Button className="bg-primary hover:bg-primary/90 rounded-xl">
                            View My Requests
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/for-medcenter"
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
                    <div className="space-y-2">
                        <Label htmlFor="componentType">Component Type *</Label>
                        <Select
                            value={formData.componentType}
                            onValueChange={(value) => setFormData({ ...formData, componentType: value })}
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
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Link href="/dashboard/for-medcenter" className="flex-1">
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
                            disabled={
                                isSubmitting ||
                                !formData.componentType ||
                                !formData.bloodGroup ||
                                !formData.rhesusFactor ||
                                !formData.volume
                            }
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                    Submitting...
                                </>
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
