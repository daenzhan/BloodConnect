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
import {FileText, ArrowLeft, CheckCircle, Loader2, ClipboardList, Plus, Building2} from "lucide-react"
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
    { value: "POSITIVE", label: "Positive (+)" },
    { value: "NEGATIVE", label: "Negative (-)" }
]

// ТЕ ЖЕ КОМПОНЕНТЫ, ЧТО И В РЕЗЕРВАХ
const componentTypes = [
    { value: "WHOLE_BLOOD", label: "Whole Blood" },
    { value: "RED_BLOOD_CELLS", label: "Red Blood Cells" },
    { value: "PLATELETS", label: "Platelets" },
    { value: "PLASMA", label: "Plasma" },
    { value: "CRYOPRECIPITATE", label: "Cryoprecipitate" }
]

const volumeOptions = [
    { value: "200 ml", label: "200 ml" },
    { value: "250 ml", label: "250 ml" },
    { value: "300 ml", label: "300 ml" },
    { value: "350 ml", label: "350 ml" },
    { value: "450 ml", label: "450 ml" },
    { value: "500 ml", label: "500 ml" },
    { value: "1000 ml", label: "1000 ml (1L)" }
]

interface BloodCenter {
    bloodCenterId: number;
    name: string;
    location: string;
}

export default function CreateRequestPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [medCenter, setMedCenter] = useState<any>(null)
    const [bloodCenters, setBloodCenters] = useState<BloodCenter[]>([])
    const [selectedBloodCenterId, setSelectedBloodCenterId] = useState<string>("")
    const [isLoadingCenters, setIsLoadingCenters] = useState(false)

    const [formData, setFormData] = useState({
        componentType: "",
        bloodGroup: "",
        rhesusFactor: "",
        volume: "",
        deadline: "",
        comment: ""
    })

    // Fetch medical center info
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

    // Fetch all blood centers
    useEffect(() => {
        const fetchBloodCenters = async () => {
            setIsLoadingCenters(true)
            try {
                const headers = getAuthHeaders()
                if (!headers) return

                const response = await fetch("http://localhost:8080/blood-centers", {
                    headers: headers
                })

                if (response.ok) {
                    const data = await response.json()
                    setBloodCenters(data)
                } else {
                    console.error("Failed to fetch blood centers")
                }
            } catch (error) {
                console.error("Error fetching blood centers:", error)
            } finally {
                setIsLoadingCenters(false)
            }
        }
        fetchBloodCenters()
    }, [])

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

        if (!selectedBloodCenterId) {
            setError("Please select a blood center")
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
        if (!finalVolume) {
            setError("Please select a volume")
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
                medCenter: { medCenterId: fetchedMedCenterId },
                bloodCenter: { bloodCenterId: parseInt(selectedBloodCenterId) }
            }

            console.log("Sending request:", requestData)

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
                const errorData = await response.text()
                console.error("Server response:", errorData)
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
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
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

                        {/* Blood Center Selection - NEW */}
                        <div className="space-y-2">
                            <Label htmlFor="bloodCenter" className="text-sm font-medium">
                                Blood Center <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedBloodCenterId}
                                onValueChange={setSelectedBloodCenterId}
                                required
                            >
                                <SelectTrigger id="bloodCenter" className="w-full h-11 bg-white">
                                    <SelectValue placeholder={isLoadingCenters ? "Loading blood centers..." : "Select blood center"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {bloodCenters.map((center) => (
                                        <SelectItem key={center.bloodCenterId} value={center.bloodCenterId.toString()}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-gray-500" />
                                                <span>{center.name}</span>
                                                <span className="text-xs text-gray-400">({center.location})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {bloodCenters.length === 0 && !isLoadingCenters && (
                                <p className="text-xs text-amber-600 mt-1">
                                    No blood centers available. Please contact administrator.
                                </p>
                            )}
                        </div>

                        {/* Component Type */}
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
                            <p className="text-xs text-muted-foreground">
                                {formData.componentType === "PLASMA" && "⚠️ Plasma requires 90 days quarantine before use"}
                                {formData.componentType === "PLATELETS" && "📅 Platelets expire in 5 days"}
                                {formData.componentType === "WHOLE_BLOOD" && "📅 Whole blood expires in 35 days"}
                                {formData.componentType === "RED_BLOOD_CELLS" && "📅 Red blood cells expire in 42 days"}
                            </p>
                        </div>

                        {/* Blood Group and Rhesus Factor */}
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

                        {/* Volume */}
                        <div className="space-y-2">
                            <Label htmlFor="volume" className="text-sm font-medium">
                                Volume <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.volume}
                                onValueChange={(value) => setFormData({ ...formData, volume: value })}
                                required
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
                            <p className="text-xs text-muted-foreground">
                                💡 Standard blood donation is 450 ml
                            </p>
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
                            <p className="text-xs text-muted-foreground">
                                If not specified, request will be active until fulfilled
                            </p>
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
                                disabled={isSubmitting || !formData.componentType || !formData.bloodGroup || !formData.rhesusFactor || !formData.volume || !selectedBloodCenterId}
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