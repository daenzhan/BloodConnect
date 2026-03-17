"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
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
}

interface RecentRequestsProps {
    requests: BloodRequest[]
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
    RED_CELLS: "Red Cells",
    CRYOPRECIPITATE: "Cryo"
}

export function RecentRequests({ requests }: RecentRequestsProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return "No deadline"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    const getBloodTypeDisplay = (request: BloodRequest) => {
        return `${request.bloodGroup}${request.rhesusFactor}`
    }

    return (
        <Card className="p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Requests</h3>
                <Link
                    href="/dashboard/for-medcenter/my-requests"
                    className="text-sm text-primary hover:underline"
                >
                    View All
                </Link>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No requests yet</p>
                    <Link
                        href="/dashboard/for-medcenter/create-request"
                        className="text-primary hover:underline text-sm"
                    >
                        Create your first request
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.slice(0, 5).map((request) => {
                        const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.PENDING
                        const StatusIcon = status.icon
                        const bloodType = getBloodTypeDisplay(request)
                        const componentLabel = componentTypeLabels[request.componentType] || request.componentType

                        return (
                            <div
                                key={request.bloodRequestId}
                                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary">{bloodType}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {request.volume} {componentLabel}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Deadline: {formatDate(request.deadline)}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={status.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                </Badge>
                            </div>
                        )
                    })}
                </div>
            )}
        </Card>
    )
}
