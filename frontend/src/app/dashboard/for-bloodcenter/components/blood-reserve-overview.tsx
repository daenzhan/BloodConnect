"use client"

import { Card } from "@/components/ui/card"
import { Droplet } from "lucide-react"

interface BloodReserveItem {
    bloodGroup: string
    rhesusFactor: string
    quantity: number
}

interface BloodReserveOverviewProps {
    reserves: BloodReserveItem[]
}

const bloodTypes = [
    { group: "A", rh: "+" },
    { group: "A", rh: "-" },
    { group: "B", rh: "+" },
    { group: "B", rh: "-" },
    { group: "AB", rh: "+" },
    { group: "AB", rh: "-" },
    { group: "O", rh: "+" },
    { group: "O", rh: "-" },
]

export function BloodReserveOverview({ reserves }: BloodReserveOverviewProps) {
    const getQuantityForType = (group: string, rh: string) => {
        const reserve = reserves.find(
            (r) => r.bloodGroup === group && r.rhesusFactor === rh
        )
        return reserve?.quantity || 0
    }

    const getStatusColor = (quantity: number) => {
        if (quantity <= 5) return "bg-destructive/10 text-destructive border-destructive/20"
        if (quantity <= 15) return "bg-chart-4/10 text-chart-4 border-chart-4/20"
        return "bg-chart-2/10 text-chart-2 border-chart-2/20"
    }

    return (
        <Card className="p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Blood Reserve</h3>
                <Droplet className="w-5 h-5 text-primary" />
            </div>

            <div className="grid grid-cols-4 gap-2">
                {bloodTypes.map((type) => {
                    const quantity = getQuantityForType(type.group, type.rh)
                    const statusColor = getStatusColor(quantity)

                    return (
                        <div
                            key={`${type.group}${type.rh}`}
                            className={`p-3 rounded-xl border ${statusColor} text-center`}
                        >
                            <p className="text-lg font-bold">
                                {type.group}{type.rh}
                            </p>
                            <p className="text-sm opacity-80">{quantity} units</p>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}
