import { Card } from "@/components/ui/card"
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react"

interface RequestStatsProps {
    totalRequests: number
    approvedRequests: number
    pendingRequests: number
    rejectedRequests: number
}

export function RequestStats({
                                 totalRequests,
                                 approvedRequests,
                                 pendingRequests,
                                 rejectedRequests
                             }: RequestStatsProps) {

    const statsItems = [
        {
            icon: FileText,
            label: "Total Requests",
            value: totalRequests,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            icon: CheckCircle,
            label: "Approved",
            value: approvedRequests,
            color: "text-chart-2",
            bg: "bg-chart-2/10",
        },
        {
            icon: Clock,
            label: "Pending",
            value: pendingRequests,
            color: "text-chart-4",
            bg: "bg-chart-4/10",
        },
        {
            icon: XCircle,
            label: "Rejected",
            value: rejectedRequests,
            color: "text-chart-3",
            bg: "bg-chart-3/10",
        },
    ]

    return (
        <Card className="p-4 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground mb-4">Request Statistics</h3>

            <div className="grid grid-cols-2 gap-3">
                {statsItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={item.label}
                            className="p-3 rounded-xl bg-muted/50"
                        >
                            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                                <Icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <p className="text-lg font-bold text-foreground">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}
