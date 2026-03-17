import { Card } from "@/components/ui/card"
import { Droplet, Heart, Users, Award } from "lucide-react"

// Описываем, какие данные компонент ожидает получить
interface DonationStatsProps {
    total_donations: number;
    lives_saved: number;
    blood_type: string;
    donor_level: string;
}

export function DonationStats({
                                  total_donations,
                                  lives_saved,
                                  blood_type,
                                  donor_level
                              }: DonationStatsProps) {

    // Формируем массив данных динамически из полученных пропсов
    const stats_items = [
        {
            icon: Droplet,
            label: "Total Donations",
            value: total_donations,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            icon: Heart,
            label: "Lives Saved",
            value: lives_saved,
            color: "text-chart-2",
            bg: "bg-chart-2/10",
        },
        {
            icon: Users,
            label: "Blood Type",
            value: blood_type,
            color: "text-chart-3",
            bg: "bg-chart-3/10",
        },
        {
            icon: Award,
            label: "Donor Level",
            value: donor_level,
            color: "text-chart-4",
            bg: "bg-chart-4/10",
        },
    ]

    return (
        <Card className="p-4 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground mb-4">Your Stats</h3>

            <div className="grid grid-cols-2 gap-3">
                {stats_items.map((item) => {
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