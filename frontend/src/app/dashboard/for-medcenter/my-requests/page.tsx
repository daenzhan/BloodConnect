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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClipboardList, Plus, Clock, CheckCircle, XCircle, AlertCircle, Filter, MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

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
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Pending"
    },
    APPROVED: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Approved"
    },
    REJECTED: {
        icon: XCircle,
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Rejected"
    },
    IN_PROGRESS: {
        icon: AlertCircle,
        color: "bg-blue-100 text-blue-700 border-blue-200",
        label: "In Progress"
    },
    COMPLETED: {
        icon: CheckCircle,
        color: "bg-purple-100 text-purple-700 border-purple-200",
        label: "Completed"
    }
}

const componentTypeLabels: Record<string, string> = {
    WHOLE_BLOOD: "Whole Blood",
    PLASMA: "Plasma",
    PLATELETS: "Platelets",
    RED_CELLS: "Red Blood Cells",
    CRYOPRECIPITATE: "Cryoprecipitate"
}

// Функция для преобразования rhesusFactor
const formatRhesusFactor = (rhesusFactor: string): string => {
    if (!rhesusFactor) return "";

    const lower = rhesusFactor.toLowerCase();
    if (lower.includes("positive") || lower === "+") {
        return "+";
    } else if (lower.includes("negative") || lower === "-") {
        return "-";
    }
    return rhesusFactor;
};

export default function MyRequestsPage() {
    const [requests, setRequests] = useState<BloodRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const medCenterId = searchParams.get('id') || "1"

    // Fetch requests
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch(`http://localhost:8080/blood-requests/medcenter/${medCenterId}`)

                if (response.ok) {
                    const data = await response.json()
                    setRequests(data)
                } else {
                    console.error("Failed to fetch requests")
                }
            } catch (error) {
                console.error("Error fetching requests:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRequests()
    }, [medCenterId])

    // Delete request
    const handleDelete = async () => {
        if (!selectedRequest) return

        setIsDeleting(true)
        try {
            const response = await fetch(`http://localhost:8080/blood-requests/${selectedRequest.bloodRequestId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                // Remove from list
                setRequests(requests.filter(r => r.bloodRequestId !== selectedRequest.bloodRequestId))
                setDeleteDialogOpen(false)
                setSelectedRequest(null)
            } else {
                console.error("Failed to delete request")
            }
        } catch (error) {
            console.error("Error deleting request:", error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleStatusUpdate = async (requestId: number, newStatus: string) => {
        try {
            const response = await fetch(`http://localhost:8080/blood-requests/${requestId}/status?status=${newStatus}`, {
                method: "PUT"
            })

            if (response.ok) {
                // Update local state
                setRequests(requests.map(r =>
                    r.bloodRequestId === requestId
                        ? { ...r, status: newStatus }
                        : r
                ))
            }
        } catch (error) {
            console.error("Error updating status:", error)
        }
    }

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
        const rhesusSymbol = formatRhesusFactor(request.rhesusFactor);
        return `${request.bloodGroup}${rhesusSymbol}`;
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
                        <h1 className="text-2xl font-bold text-foreground">My requests</h1>


                    </div>
                </div>
                <Link href={`/dashboard/for-medcenter/create-request?id=${medCenterId}`}>
                    <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-xl">
                        <Plus className="w-4 h-4" />
                        New request
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="ALL" className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900">All requests</SelectItem>
                        <SelectItem value="PENDING" className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900">Pending</SelectItem>
                        <SelectItem value="APPROVED" className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900">Approved</SelectItem>
                        <SelectItem value="REJECTED" className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900">Rejected</SelectItem>
                        <SelectItem value="IN_PROGRESS" className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900">In progress</SelectItem>
                        <SelectItem value="COMPLETED" className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 bg-white text-gray-900">Completed</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                    {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
                </span>
            </div>

            {filteredRequests.length === 0 ? (
                <Card className="p-8 text-center rounded-2xl border border-border">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">No requests found</h2>
                    <p className="text-muted-foreground mb-4">
                        {statusFilter === "ALL"
                            ? "You haven't created any blood requests yet."
                            : `No ${statusFilter.toLowerCase()} requests found.`}
                    </p>
                    <Link href={`/dashboard/for-medcenter/create-request?id=${medCenterId}`}>
                        <Button className="bg-primary hover:bg-primary/90 rounded-xl">
                            Create your first request
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
                        const originalRhesus = request.rhesusFactor;

                        return (
                            <Card key={request.bloodRequestId} className="p-4 rounded-2xl border border-border hover:shadow-md transition-all relative group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">

                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <span className="text-lg font-bold text-primary">{bloodType}</span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-foreground">
                                                    {request.volume} of {bloodType} ({componentLabel})
                                                </h3>

                                                <Select
                                                    value={request.status}
                                                    onValueChange={(value) => handleStatusUpdate(request.bloodRequestId, value)}
                                                >
                                                    <SelectTrigger className="w-32 h-7 text-xs bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                                        <SelectItem value="PENDING" className="cursor-pointer py-1.5 hover:bg-gray-100 bg-white">Pending</SelectItem>
                                                        <SelectItem value="APPROVED" className="cursor-pointer py-1.5 hover:bg-gray-100 bg-white">Approved</SelectItem>
                                                        <SelectItem value="IN_PROGRESS" className="cursor-pointer py-1.5 hover:bg-gray-100 bg-white">In progress</SelectItem>
                                                        <SelectItem value="COMPLETED" className="cursor-pointer py-1.5 hover:bg-gray-100 bg-white">Completed</SelectItem>
                                                        <SelectItem value="REJECTED" className="cursor-pointer py-1.5 hover:bg-gray-100 bg-white">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-2">
                                                Request #{request.bloodRequestId} • Deadline: {formatDate(request.deadline)}
                                                {originalRhesus && originalRhesus !== bloodType.slice(1) && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        (Original: {originalRhesus})
                                                    </span>
                                                )}
                                            </p>

                                            {request.bloodCenter && (
                                                <p className="text-sm text-green-600 mb-1">
                                                    Assigned to: {request.bloodCenter.name}
                                                </p>
                                            )}

                                            {request.comment && (
                                                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-lg">
                                                    <span className="font-medium">Note:</span> {request.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Badge variant="outline" className={`${status.color} flex items-center gap-1 px-3 py-1`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </Badge>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white hover:bg-gray-100">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/dashboard/for-medcenter/requests/${request.bloodRequestId}/view?id=${medCenterId}`)}
                                                    className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 text-gray-900"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/dashboard/for-medcenter/requests/${request.bloodRequestId}/edit?id=${medCenterId}`)}
                                                    className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 text-gray-900"
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit request
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer py-2 hover:bg-gray-100 focus:bg-gray-100 text-red-600"
                                                    onClick={() => {
                                                        setSelectedRequest(request)
                                                        setDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete request
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the blood request
                            {selectedRequest && (
                                <>
                                    {" "}for {selectedRequest.bloodGroup}
                                    {formatRhesusFactor(selectedRequest.rhesusFactor)} ({selectedRequest.volume})
                                </>
                            )}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="bg-white hover:bg-gray-100">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}