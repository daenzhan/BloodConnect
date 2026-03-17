"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Donation {
    donationId: number
    donorName: string
    donationDate: string
    status: string
    bloodType?: string
}

interface RecentDonationsProps {
    donations: Donation[]
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

export function RecentDonations({ donations }: RecentDonationsProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <Card className="p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Donations</h3>
                <Link
                    href="/dashboard/for-bloodcenter/donations"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                    View All <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-3">
                {donations.slice(0, 5).map((donation) => (
                    <div
                        key={donation.donationId}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{donation.donorName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDate(donation.donationDate)}
                                    {donation.bloodType && ` • ${donation.bloodType}`}
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={statusColors[donation.status] || statusColors.PENDING}
                        >
                            {statusLabels[donation.status] || donation.status}
                        </Badge>
                    </div>
                ))}

                {donations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No recent donations
                    </div>
                )}
            </div>
        </Card>
    )
}
