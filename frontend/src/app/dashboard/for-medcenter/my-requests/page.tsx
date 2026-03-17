"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ClipboardList, Plus, Clock, CheckCircle, XCircle, AlertCircle, Filter } from "lucide-react"
import Link from "next/link"

// Matches BloodRequest.java entity
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

const statusConfig = {
    PENDING: {
        icon: Clock,
        color: "bg-chart-4/10 text-chart-4 border-chart-4/20",
        label: "Pending"
    },
    APPROVED: {
        icon: CheckCircle,
        color: "bg-chart-2/10 text-chart-2 border-chart-2/20",
        label: "Approved"
    },
    REJECTED: {
        icon: XCircle,
        color: "bg-destructive/10 text-destructive border-destructive/20",
        label: "Rejected"
    },
    IN_PROGRESS: {
        icon: AlertCircle,
        color: "bg-chart-3/10 text-chart-3 border-chart-3/20",
        label: "In Progress"
    }
}

const componentTypeLabels: Record<string, string> = {
    WHOLE_BLOOD: "Whole Blood",
    PLASMA: "Plasma",
    PLATELETS: "Platelets",
    RED_CELLS: "Red Blood Cells",
    CRYOPRECIPITATE: "Cryoprecipitate"
}

export default function MyRequestsPage() {
    const [requests, setRequests] = useState<BloodRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>("ALL")

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch("http://localhost:8080/show/own/requests", {
                    headers: {
                        "Content-Type": "application/json"
                        // TODO: Add Authorization header with JWT token
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setRequests(data)
                }
            } catch (error) {
                console.error("Error fetching requests:", error)
                // Fallback to mock data for development
                setRequests([
                    {
                        bloodRequestId: 1,
                        componentType: "WHOLE_BLOOD",
                        bloodGroup: "A",
                        rhesusFactor: "+",
                        volume: "450ml",
                        deadline: new Date().toISOString(),
                        status: "PENDING",
                        comment: "Urgent surgery scheduled"
                    },
                    {
                        bloodRequestId: 2,
                        componentType: "PLASMA",
                        bloodGroup: "O",
                        rhesusFactor: "-",
                        volume: "300ml",
                        deadline: new Date(Date.now() - 86400000).toISOString(),
                        status: "APPROVED",
                        bloodCenter: {
                            bloodCenterId: 1,
                            name: "City Blood Bank"
                        }
                    },
                    {
                        bloodRequestId: 3,
                        componentType: "PLATELETS",
                        bloodGroup: "B",
                        rhesusFactor: "+",
                        volume: "200ml",
                        deadline: new Date(Date.now() - 172800000).toISOString(),
                        status: "APPROVED"
                    },
                    {
                        bloodRequestId: 4,
                        componentType: "RED_CELLS",
                        bloodGroup: "AB",
                        rhesusFactor: "+",
                        volume: "350ml",
                        deadline: new Date(Date.now() - 259200000).toISOString(),
                        status: "REJECTED",
                        comment: "Insufficient stock available"
                    },
                    {
                        bloodRequestId: 5,
                        componentType: "WHOLE_BLOOD",
                        bloodGroup: "O",
                        rhesusFactor: "+",
                        volume: "450ml",
                        deadline: new Date(Date.now() - 345600000).toISOString(),
                        status: "IN_PROGRESS"
                    }
                ])
            } finally {
                setIsLoading(false)
            }
        }

        fetchRequests()
    }, [])

    const formatDate = (dateString?: string) => {
        if (!dateString) return "No deadline"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getBloodTypeDisplay = (request: BloodRequest) => {
        return `${request.bloodGroup}${request.rhesusFactor}`
    }

    const filteredRequests = statusFilter === "ALL"
        ? requests
        : requests.filter(r => r.status === statusFilter)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading requests...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">My Requests</h1>
                        <p className="text-muted-foreground">View and manage your blood requests</p>
                    </div>
                </div>
                <Link href="/dashboard/for-medcenter/create-request">
                    <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-xl">
                        <Plus className="w-4 h-4" />
                        New Request
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Requests</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                    {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
                </span>
            </div>

            {filteredRequests.length === 0 ? (
                <Card className="p-8 text-center rounded-2xl border border-border">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">No Requests Found</h2>
                    <p className="text-muted-foreground mb-4">
                        {statusFilter === "ALL"
                            ? "You haven't created any blood requests yet."
                            : `No ${statusFilter.toLowerCase()} requests found.`}
                    </p>
                    <Link href="/dashboard/for-medcenter/create-request">
                        <Button className="bg-primary hover:bg-primary/90 rounded-xl">
                            Create Your First Request
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((request) => {
                        const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.PENDING
                        const StatusIcon = status.icon
                        const bloodType = getBloodTypeDisplay(request)
                        const componentLabel = componentTypeLabels[request.componentType] || request.componentType

                        return (
                            <Card key={request.bloodRequestId} className="p-4 rounded-2xl border border-border hover:shadow-md transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <span className="text-lg font-bold text-primary">{bloodType}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-foreground">
                                                    {request.volume} of {bloodType} ({componentLabel})
                                                </h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Request #{request.bloodRequestId} • Deadline: {formatDate(request.deadline)}
                                            </p>
                                            {request.bloodCenter && (
                                                <p className="text-sm text-chart-2">
                                                    Assigned to: {request.bloodCenter.name}
                                                </p>
                                            )}
                                            {request.comment && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Note: {request.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`${status.color} flex items-center gap-1`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {status.label}
                                    </Badge>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
