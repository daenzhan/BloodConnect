"use client"

import { useState, useEffect } from "react"
import { BloodCenterSidebar } from "../components/sidebar"
import { CenterProfileCard } from "../components/center-profile-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Search, User, Calendar, Droplet, RefreshCw } from "lucide-react"

interface Donation {
    donationId: number
    donorId: number
    donorName: string
    donationDate: string
    status: string
    hasAnalysis: boolean
    bloodType?: string
}

const statusColors: Record<string, string> = {
    PENDING: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    SCHEDULED: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    IN_PROGRESS: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    COMPLETED: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    AWAITING_ANALYSIS: "bg-primary/10 text-primary border-primary/20",
    FINALIZED: "bg-muted text-muted-foreground border-border",
}

const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    AWAITING_ANALYSIS: "Awaiting Analysis",
    FINALIZED: "Finalized",
}

const statusFlow = ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "AWAITING_ANALYSIS", "FINALIZED"]

export default function DonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([])
    const [filteredDonations, setFilteredDonations] = useState<Donation[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

    const bloodCenterId = 1 // Temporarily hardcoded

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                const response = await fetch(`http://localhost:8080/blood-center/${bloodCenterId}/donations`)
                if (response.ok) {
                    const data = await response.json()
                    setDonations(data)
                    setFilteredDonations(data)
                }
            } catch (error) {
                console.error("Error fetching donations:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDonations()
    }, [bloodCenterId])

    useEffect(() => {
        let result = donations

        if (searchTerm) {
            result = result.filter((donation) =>
                donation.donorName?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (statusFilter !== "ALL") {
            result = result.filter((donation) => donation.status === statusFilter)
        }

        setFilteredDonations(result)
    }, [searchTerm, statusFilter, donations])

    const handleStatusChange = async (donationId: number, newStatus: string) => {
        try {
            const response = await fetch(`http://localhost:8080/donations/${donationId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                setDonations((prev) =>
                    prev.map((d) =>
                        d.donationId === donationId ? { ...d, status: newStatus } : d
                    )
                )
            }
        } catch (error) {
            console.error("Error updating status:", error)
        }

        // Update locally for demo
        setDonations((prev) =>
            prev.map((d) =>
                d.donationId === donationId ? { ...d, status: newStatus } : d
            )
        )
        setIsStatusDialogOpen(false)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Mock data for development
    const mockDonations: Donation[] = donations.length > 0 ? donations : [
        { donationId: 1, donorId: 101, donorName: "John Doe", donationDate: "2026-03-09T10:30:00", status: "COMPLETED", hasAnalysis: true, bloodType: "A+" },
        { donationId: 2, donorId: 102, donorName: "Jane Smith", donationDate: "2026-03-09T09:15:00", status: "IN_PROGRESS", hasAnalysis: false, bloodType: "O-" },
        { donationId: 3, donorId: 103, donorName: "Mike Johnson", donationDate: "2026-03-09T08:00:00", status: "AWAITING_ANALYSIS", hasAnalysis: false, bloodType: "B+" },
        { donationId: 4, donorId: 104, donorName: "Sarah Wilson", donationDate: "2026-03-08T16:45:00", status: "FINALIZED", hasAnalysis: true, bloodType: "AB+" },
        { donationId: 5, donorId: 105, donorName: "Tom Brown", donationDate: "2026-03-08T14:30:00", status: "SCHEDULED", hasAnalysis: false, bloodType: "O+" },
        { donationId: 6, donorId: 106, donorName: "Emily Davis", donationDate: "2026-03-08T11:00:00", status: "PENDING", hasAnalysis: false, bloodType: "A-" },
        { donationId: 7, donorId: 107, donorName: "Chris Miller", donationDate: "2026-03-07T15:20:00", status: "COMPLETED", hasAnalysis: true, bloodType: "B-" },
        { donationId: 8, donorId: 108, donorName: "Lisa Anderson", donationDate: "2026-03-07T13:45:00", status: "FINALIZED", hasAnalysis: true, bloodType: "AB-" },
    ]

    const displayDonations = filteredDonations.length > 0 || donations.length > 0 ? filteredDonations : mockDonations

    const getStatusCounts = () => {
        const all = donations.length > 0 ? donations : mockDonations
        return {
            total: all.length,
            pending: all.filter((d) => d.status === "PENDING").length,
            inProgress: all.filter((d) => d.status === "IN_PROGRESS").length,
            completed: all.filter((d) => ["COMPLETED", "FINALIZED"].includes(d.status)).length,
        }
    }

    const counts = getStatusCounts()

    return (
        <div className="flex min-h-screen bg-background">
            <BloodCenterSidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <header className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Donations</h1>
                        <p className="text-muted-foreground">Manage and track all donation records</p>
                    </div>
                    <CenterProfileCard name="City Blood Center" city="Almaty" />
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 rounded-xl border border-border">
                        <p className="text-2xl font-bold text-foreground">{counts.total}</p>
                        <p className="text-sm text-muted-foreground">Total Donations</p>
                    </Card>
                    <Card className="p-4 rounded-xl border border-chart-4/20 bg-chart-4/5">
                        <p className="text-2xl font-bold text-chart-4">{counts.pending}</p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                    </Card>
                    <Card className="p-4 rounded-xl border border-chart-1/20 bg-chart-1/5">
                        <p className="text-2xl font-bold text-chart-1">{counts.inProgress}</p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                    </Card>
                    <Card className="p-4 rounded-xl border border-chart-2/20 bg-chart-2/5">
                        <p className="text-2xl font-bold text-chart-2">{counts.completed}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6 rounded-xl border border-border">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by donor name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="AWAITING_ANALYSIS">Awaiting Analysis</SelectItem>
                                <SelectItem value="FINALIZED">Finalized</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Donations List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Loading donations...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayDonations.map((donation) => (
                            <Card key={donation.donationId} className="p-4 rounded-xl border border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-foreground">{donation.donorName}</h3>
                                                <Badge variant="outline" className={statusColors[donation.status] || statusColors.PENDING}>
                                                    {statusLabels[donation.status] || donation.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(donation.donationDate)}
                                                </span>
                                                {donation.bloodType && (
                                                    <span className="flex items-center gap-1">
                                                        <Droplet className="w-4 h-4" />
                                                        {donation.bloodType}
                                                    </span>
                                                )}
                                                <span>ID: #{donation.donationId}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Dialog open={isStatusDialogOpen && selectedDonation?.donationId === donation.donationId} onOpenChange={(open) => {
                                        setIsStatusDialogOpen(open)
                                        if (open) setSelectedDonation(donation)
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="gap-2">
                                                <RefreshCw className="w-4 h-4" />
                                                Change Status
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Update Donation Status</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Donor: <span className="font-medium text-foreground">{donation.donorName}</span>
                                                </p>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Current Status: <Badge variant="outline" className={statusColors[donation.status]}>{statusLabels[donation.status]}</Badge>
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {statusFlow.map((status) => (
                                                        <Button
                                                            key={status}
                                                            variant={donation.status === status ? "default" : "outline"}
                                                            className="justify-start"
                                                            onClick={() => handleStatusChange(donation.donationId, status)}
                                                            disabled={donation.status === status}
                                                        >
                                                            {statusLabels[status]}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </Card>
                        ))}

                        {displayDonations.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No donations found</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
