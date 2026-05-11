import { Card } from "@/components/ui/card"
import { Droplet, Heart, Users, Award } from "lucide-react"

interface DonationStatsProps {
    total_donations: number;
    lives_saved: number;
    blood_type: string;
    donor_level?: string; // Сделаем опциональным
}

// Функция для определения уровня (как в TopDonorsPage)
const getDonorLevel = (donationCount: number): string => {
    if (donationCount >= 50) return 'Platinum'
    if (donationCount >= 25) return 'Gold'
    if (donationCount >= 15) return 'Silver'
    if (donationCount >= 5) return 'Bronze'
    return 'Newcomer'  // 1-4 донации = Newcomer
}

export function DonationStats({
                                  total_donations = 0,
                                  lives_saved = 0,
                                  blood_type = "Unknown",
                                  donor_level
                              }: DonationStatsProps) {

    // ВЫЧИСЛЯЕМ УРОВЕНЬ НА ФРОНТЕНДЕ, игнорируя то, что пришло с бэкенда
    const calculatedLevel = getDonorLevel(total_donations);

    // Используем вычисленный уровень вместо переданного
    const finalDonorLevel = calculatedLevel;

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
            value: lives_saved || total_donations * 3,
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
            value: finalDonorLevel,  // Используем вычисленный уровень
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
                            <p className="text-lg font-bold text-foreground">
                                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}