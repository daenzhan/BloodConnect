"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Droplet, Building2, FileText, Edit } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"

interface BloodRequest {
    bloodRequestId: number
    componentType: string
    bloodGroup: string
    rhesusFactor: string
    volume: string
    deadline?: string
    status: string
    comment?: string
    medCenter?: {
        medCenterId: number
        name: string
    }
    bloodCenter?: {
        bloodCenterId: number
        name: string
    }
}

const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
    APPROVED: { color: "bg-green-100 text-green-700", label: "Approved" },
    REJECTED: { color: "bg-red-100 text-red-700", label: "Rejected" },
    IN_PROGRESS: { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    COMPLETED: { color: "bg-purple-100 text-purple-700", label: "Completed" }
}

const componentTypeLabels: Record<string, string> = {
    WHOLE_BLOOD: "Whole Blood",
    PLASMA: "Plasma",
    PLATELETS: "Platelets",
    RED_CELLS: "Red Blood Cells",
    CRYOPRECIPITATE: "Cryoprecipitate"
}

export default function ViewRequestPage() {
    const [request, setRequest] = useState<BloodRequest | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const medCenterId = searchParams.get('id')
    const requestId = params.id

    useEffect(() => {
        if (!requestId) {
            setError("Request ID not found")
            setIsLoading(false)
            return
        }

        const fetchRequest = async () => {
            try {
                console.log("Fetching request with ID:", requestId)
                const response = await fetch(`http://localhost:8080/blood-requests/${requestId}`)

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Request not found")
                    }
                    throw new Error(`Failed to fetch request: ${response.status}`)
                }

                const data = await response.json()
                console.log("Request data received:", data)
                setRequest(data)
                setError(null)
            } catch (error) {
                console.error("Error fetching request:", error)
                setError(error instanceof Error ? error.message : "Failed to load request")
            } finally {
                setIsLoading(false)
            }
        }

        fetchRequest()
    }, [requestId])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading request details...</p>
                </div>
            </div>
        )
    }

    if (error || !request) {
        return (
            <div className="p-8 text-center">
                <p className="text-destructive mb-4">{error || "Request not found"}</p>
                <Button
                    onClick={() => router.push(`/dashboard/for-medcenter/my-requests?id=${medCenterId}`)}
                    className="bg-primary hover:bg-primary/90 rounded-xl"
                >
                    Back to My Requests
                </Button>
            </div>
        )
    }

    const status = statusConfig[request.status] || statusConfig.PENDING
    const componentLabel = componentTypeLabels[request.componentType] || request.componentType

    return (
        <div className="max-w-3xl mx-auto">
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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Droplet className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Blood Request #{request.bloodRequestId}
                            </h1>
                            <p className="text-muted-foreground">
                                {componentLabel}
                            </p>
                            {/* Показываем ID медцентра для отладки */}
                            <p className="text-xs text-muted-foreground mt-1">
                                Center ID: {medCenterId}
                            </p>
                        </div>
                    </div>
                    <Badge className={`${status.color} px-3 py-1`}>
                        {status.label}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-1">Blood Type</p>
                        <p className="text-2xl font-bold text-foreground">
                            {request.bloodGroup}{request.rhesusFactor}
                        </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-1">Volume</p>
                        <p className="text-2xl font-bold text-foreground">{request.volume}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                        <Calendar className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                            <p className="text-sm text-muted-foreground">Deadline</p>
                            <p className="font-medium text-foreground">
                                {request.deadline ? new Date(request.deadline).toLocaleString() : "No deadline"}
                            </p>
                        </div>
                    </div>

                    {request.medCenter && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                            <Building2 className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Medical Center</p>
                                <p className="font-medium text-foreground">{request.medCenter.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {request.medCenter.medCenterId}</p>
                            </div>
                        </div>
                    )}

                    {request.bloodCenter && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                            <Building2 className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Blood Center</p>
                                <p className="font-medium text-foreground">{request.bloodCenter.name}</p>
                            </div>
                        </div>
                    )}

                    {request.comment && (
                        <div className="p-4 rounded-xl bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2">Comment</p>
                            <p className="text-foreground">{request.comment}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => router.push(`/dashboard/for-medcenter/requests/${requestId}/edit?id=${medCenterId}`)}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Request
                    </Button>
                    <Button
                        className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                        onClick={() => router.push(`/dashboard/for-medcenter/my-requests?id=${medCenterId}`)}
                    >
                        Back to List
                    </Button>
                </div>
            </Card>
        </div>
    )
}