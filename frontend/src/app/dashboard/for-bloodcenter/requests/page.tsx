"use client"

import { useState, useEffect } from "react"
import { BloodCenterSidebar } from "../components/sidebar"
import { CenterProfileCard } from "../components/center-profile-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FlaskConical, Clock, Building2, Droplet } from "lucide-react"

interface BloodRequest {
    bloodRequestId: number
    componentType: string
    bloodGroup: string
    rhesusFactor: string
    volume: string
    deadline: string
    status: string
    comment: string
    medCenterName: string
}

const statusColors: Record<string, string> = {
    PENDING: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    APPROVED: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
    IN_PROGRESS: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    COMPLETED: "bg-muted text-muted-foreground border-border",
}

const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
}

export default function BloodRequestsPage() {
    const [requests, setRequests] = useState<BloodRequest[]>([])
    const [filteredRequests, setFilteredRequests] = useState<BloodRequest[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [bloodGroupFilter, setBloodGroupFilter] = useState("ALL")
    const [isLoading, setIsLoading] = useState(true)

    const bloodCenterId = 1 // Temporarily hardcoded

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch(`http://localhost:8080/blood-center/bloodrequests?bloodCenterId=${bloodCenterId}`)
                if (response.ok) {
                    const data = await response.json()
                    setRequests(data)
                    setFilteredRequests(data)
                }
            } catch (error) {
                console.error("Error fetching blood requests:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRequests()
    }, [bloodCenterId])

    useEffect(() => {
        let result = requests

        if (searchTerm) {
            result = result.filter(
                (req) =>
                    req.medCenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    req.componentType?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (statusFilter !== "ALL") {
            result = result.filter((req) => req.status === statusFilter)
        }

        if (bloodGroupFilter !== "ALL") {
            result = result.filter((req) => `${req.bloodGroup}${req.rhesusFactor}` === bloodGroupFilter)
        }

        setFilteredRequests(result)
    }, [searchTerm, statusFilter, bloodGroupFilter, requests])

    const handleAnalysis = (requestId: number) => {
        // Navigate to analysis page or open modal
        window.location.href = `/dashboard/for-bloodcenter/requests/${requestId}/analysis`
    }

    const formatDeadline = (dateStr: string) => {
        if (!dateStr) return "No deadline"
        const date = new Date(dateStr)
        const now = new Date()
        const diffTime = date.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return "Overdue"
        if (diffDays === 0) return "Today"
        if (diffDays === 1) return "Tomorrow"
        return `${diffDays} days left`
    }

    // Mock data for development
    const mockRequests: BloodRequest[] = requests.length > 0 ? requests : [
        { bloodRequestId: 1, componentType: "Whole Blood", bloodGroup: "A", rhesusFactor: "+", volume: "450ml", deadline: "2026-03-12T10:00:00", status: "PENDING", comment: "Urgent surgery", medCenterName: "City Hospital" },
        { bloodRequestId: 2, componentType: "Platelets", bloodGroup: "O", rhesusFactor: "-", volume: "200ml", deadline: "2026-03-10T15:00:00", status: "PENDING", comment: "Cancer treatment", medCenterName: "Regional Medical Center" },
        { bloodRequestId: 3, componentType: "Plasma", bloodGroup: "B", rhesusFactor: "+", volume: "300ml", deadline: "2026-03-15T09:00:00", status: "APPROVED", comment: "Burn victim", medCenterName: "Emergency Hospital" },
        { bloodRequestId: 4, componentType: "Red Blood Cells", bloodGroup: "AB", rhesusFactor: "+", volume: "350ml", deadline: "2026-03-11T12:00:00", status: "IN_PROGRESS", comment: "Scheduled surgery", medCenterName: "University Hospital" },
        { bloodRequestId: 5, componentType: "Whole Blood", bloodGroup: "O", rhesusFactor: "+", volume: "450ml", deadline: "2026-03-08T08:00:00", status: "COMPLETED", comment: "Emergency", medCenterName: "City Hospital" },
    ]

    const displayRequests = filteredRequests.length > 0 || requests.length > 0 ? filteredRequests : mockRequests

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Blood Requests</h1>
                        <p className="text-muted-foreground">Manage incoming blood requests from medical centers</p>
                    </div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
                </header>

                {/* Filters */}
                <Card className="p-4 mb-6 rounded-xl border border-border">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by hospital or component type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Blood Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="A+">A+</SelectItem>
                                <SelectItem value="A-">A-</SelectItem>
                                <SelectItem value="B+">B+</SelectItem>
                                <SelectItem value="B-">B-</SelectItem>
                                <SelectItem value="AB+">AB+</SelectItem>
                                <SelectItem value="AB-">AB-</SelectItem>
                                <SelectItem value="O+">O+</SelectItem>
                                <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Requests List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Loading requests...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayRequests.map((request) => (
                            <Card key={request.bloodRequestId} className="p-4 rounded-xl border border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Droplet className="w-7 h-7 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-foreground">
                                                    {request.bloodGroup}{request.rhesusFactor} - {request.componentType}
                                                </h3>
                                                <Badge variant="outline" className={statusColors[request.status] || statusColors.PENDING}>
                                                    {statusLabels[request.status] || request.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    {request.medCenterName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDeadline(request.deadline)}
                                                </span>
                                                <span>Volume: {request.volume}</span>
                                            </div>
                                            {request.comment && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Note: {request.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleAnalysis(request.bloodRequestId)}
                                        className="gap-2"
                                        variant="outline"
                                    >
                                        <FlaskConical className="w-4 h-4" />
                                        Analysis
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {displayRequests.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No blood requests found</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
