"use client";

import {useEffect, useState} from "react"
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
import {FileText, ArrowLeft, CheckCircle, Loader2, ClipboardList, Plus} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {ProfileCard} from "@/app/dashboard/for-medcenter/components/profile-card";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const bloodGroups = ["A", "B", "AB", "O"]

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
    { value: "ml", label: "ml" },
    { value: "L", label: "L" }
]

export default function CreateRequestPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCustomVolume, setIsCustomVolume] = useState(false)
    const [customVolumeValue, setCustomVolumeValue] = useState("")
    const [customVolumeUnit, setCustomVolumeUnit] = useState("ml")
    const [medCenter, setMedCenter] = useState<any>(null)

    const [formData, setFormData] = useState({
        componentType: "",
        bloodGroup: "",
        rhesusFactor: "",
        volume: "",
        deadline: "",
        comment: ""
    })

    const fetchMedCenterId = async (): Promise<number | null> => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return null;

            const response = await fetch(`http://localhost:8080/medcenter/user/${userId}`, {
                headers: headers
            })

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
                return null;
            }

            if (response.ok) {
                const data = await response.json()
                return data.medCenterId
            }
            return null
        } catch (error) {
            console.error("Error fetching med center ID:", error)
            return null
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        if (!userId) {
            setError("User ID not found")
            setIsSubmitting(false)
            return
        }

        const headers = getAuthHeaders();
        if (!headers) {
            window.location.href = '/auth/login';
            return;
        }

        const fetchedMedCenterId = await fetchMedCenterId()
        if (!fetchedMedCenterId) {
            setError("Medical center not found for this user")
            setIsSubmitting(false)
            return
        }

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
                medCenter: { medCenterId: fetchedMedCenterId }
            }

            const response = await fetch("http://localhost:8080/blood-requests/create", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestData),
            })

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to create request")
            }

            setIsSuccess(true)
            setTimeout(() => {
                router.push(`/dashboard/for-medcenter/my-requests?userId=${userId}`)
            }, 2000)
        } catch (err) {
            console.error("Error creating request:", err)
            setError("Failed to create request. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        const fetchMedCenter = async () => {
            if (!userId) return
            try {
                const headers = getAuthHeaders()
                if (!headers) return
                const response = await fetch(`http://localhost:8080/medcenter/user/${userId}`, {
                    headers: headers
                })
                if (response.ok) {
                    const data = await response.json()
                    setMedCenter(data)
                }
            } catch (error) {
                console.error("Error fetching med center:", error)
            }
        }
        fetchMedCenter()
    }, [userId])

    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Request created!</h2>
                    <p className="text-gray-600 mb-4">
                        Your blood request has been submitted successfully.
                    </p>
                    <Link href={`/dashboard/for-medcenter/my-requests?userId=${userId}`}>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            View my requests
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row  sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">Create Blood Request</h1>
                            <p className="text-sm text-muted-foreground">Submit a new blood request to blood centers</p>
                        </div>
                    </div>
                    {medCenter && (
                        <ProfileCard
                            name={medCenter.name}
                            location={medCenter.location}
                            userId={userId || ""}
                        />
                    )}
                </div>
            </div>
            <div className="max-w-4xl mx-auto">
                <Card className="p-4 md:p-6 rounded-2xl border border-border">
                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="componentType" className="text-sm font-medium">
                                Component type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.componentType}
                                onValueChange={(value) => setFormData({ ...formData, componentType: value })}
                                required
                            >
                                <SelectTrigger id="componentType" className="w-full h-11 bg-white">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup" className="text-sm font-medium">
                                    Blood group <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.bloodGroup}
                                    onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                                    required
                                >
                                    <SelectTrigger id="bloodGroup" className="w-full h-11 bg-white">
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
                                <Label htmlFor="rhesusFactor" className="text-sm font-medium">
                                    Rhesus factor <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.rhesusFactor}
                                    onValueChange={(value) => setFormData({ ...formData, rhesusFactor: value })}
                                    required
                                >
                                    <SelectTrigger id="rhesusFactor" className="w-full h-11 bg-white">
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

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">
                                Volume <span className="text-red-500">*</span>
                            </Label>

                            <div className="flex flex-col sm:flex-row gap-2">
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
                                    <SelectContent className="max-h-60 overflow-y-auto">
                                        {volumeOptions.map((vol) => (
                                            <SelectItem key={vol.value} value={vol.value}>
                                                {vol.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
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
                                    <div className="w-full sm:w-32">
                                        <Select
                                            value={customVolumeUnit}
                                            onValueChange={setCustomVolumeUnit}
                                        >
                                            <SelectTrigger className="w-full h-11 bg-white">
                                                <SelectValue placeholder="Unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {unitOptions.map((unit) => (
                                                    <SelectItem key={unit.value} value={unit.value}>
                                                        {unit.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {isCustomVolume && (
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span>Examples:</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">450ml</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">0.5L</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">1L</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">750ml</span>
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

                        {/* Comment */}
                        <div className="space-y-2">
                            <Label htmlFor="comment" className="text-sm font-medium">
                                Additional comments <span className="text-gray-400 text-xs">(Optional)</span>
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
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Link href={`/dashboard/for-medcenter?userId=${userId}`} className="sm:flex-1">
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
                                className="sm:flex-1 bg-primary hover:bg-primary/90 rounded-xl h-12 transition-all text-white"
                                disabled={isSubmitting || !formData.componentType || !formData.bloodGroup || !formData.rhesusFactor || (!formData.volume && !customVolumeValue)}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    "Submit request"
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}